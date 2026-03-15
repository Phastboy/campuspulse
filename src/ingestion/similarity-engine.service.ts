import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from './interfaces/similarity-rule.interface';
import { EventSummary } from '@events/domain/event-summary';
import { EventSubmission } from '@events/domain';
import { ScoredEvent } from './dto/similarity.dto';
import {
  type ICandidateRepository,
  CANDIDATE_REPOSITORY,
} from './ports/candidate-repository.port';
import { type ISimilarityEngine } from './ports/similarity-engine.port';

/**
 * Internal scoring result — `ruleScores` is diagnostic only, never returned to callers.
 */
interface InternalScoredEvent {
  event: EventSummary;
  score: number;
  matches: Record<string, boolean>;
  ruleScores: Record<string, number>;
}

/**
 * Scores existing events against a new submission to detect duplicates.
 *
 * Uses maximum parallelism - processes all candidates concurrently,
 * and within each candidate, processes all rules concurrently.
 */
@Injectable()
export class SimilarityEngine implements ISimilarityEngine {
  private readonly logger = new Logger(SimilarityEngine.name);
  private readonly SIMILARITY_THRESHOLD = 0.3;
  private readonly MATCH_THRESHOLD = 0.7;
  private readonly SEARCH_WINDOW_DAYS = 7;

  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepository: ICandidateRepository,
    @Inject('SIMILARITY_RULES')
    private readonly rules: SimilarityRule[],
  ) {
    this.logger.log(`SimilarityEngine initialised with ${rules.length} rules`);
    this.logger.debug(`Rules: ${rules.map((r) => r.name).join(', ')}`);
  }

  /**
   * Finds events similar to a given submission.
   * Processes all candidates and rules in parallel for maximum throughput.
   */
  async findSimilar(submission: EventSubmission): Promise<ScoredEvent[]> {
    this.logger.log(`Finding similar events for: "${submission.title}"`);

    const submissionDate = submission.datetime.date;
    const from = new Date(submissionDate);
    from.setDate(from.getDate() - this.SEARCH_WINDOW_DAYS);
    const to = new Date(submissionDate);
    to.setDate(to.getDate() + this.SEARCH_WINDOW_DAYS);

    this.logger.debug(
      `Search window: ${from.toISOString()} → ${to.toISOString()}`,
    );

    try {
      const candidates = await this.candidateRepository.findCandidatesInWindow(
        from,
        to,
      );

      this.logger.log(`${candidates.length} candidates in window`);
      if (!candidates.length) return [];

      // Process ALL candidates in parallel, each with their own parallel rule execution
      const scoringPromises = candidates.map(async (candidate) => {
        try {
          return await this.scoreCandidate(candidate, submission);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to score candidate ${candidate.id}: ${message}`,
          );
          return null;
        }
      });

      // Wait for all candidates to be processed
      const scored = await Promise.all(scoringPromises);

      const validResults = scored
        .filter(
          (r): r is InternalScoredEvent =>
            r !== null && r.score > this.SIMILARITY_THRESHOLD,
        )
        .sort((a, b) => b.score - a.score);

      this.logger.log(
        `${validResults.length} candidates above threshold (${this.SIMILARITY_THRESHOLD})`,
      );

      if (validResults.length > 0) {
        const top = validResults[0];
        this.logger.debug(`Top match: "${top.event.title}" (${top.score})`);
        for (const [rule, score] of Object.entries(top.ruleScores)) {
          this.logger.debug(`  ${rule}: ${score.toFixed(3)}`);
        }
      }

      return validResults.map((r) => this.stripInternal(r));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding similar events: ${message}`);
      throw error;
    }
  }

  /**
   * Scores a single candidate against the submission with parallel rule execution.
   * All rules for this candidate run concurrently.
   */
  private async scoreCandidate(
    candidate: EventSummary,
    submission: EventSubmission,
  ): Promise<InternalScoredEvent> {
    const context: SimilarityContext = {
      submission,
      candidate,
      submissionDate: submission.datetime.date,
    };

    // Quick path: check exact match first (sequential since it's a fast return)
    const exactRule = this.rules.find((r) => r.name === 'exact');
    if (exactRule) {
      try {
        if (exactRule.calculate(context) === 1.0) {
          this.logger.log(`Exact match: candidate ${candidate.id}`);
          return {
            event: candidate,
            score: 1.0,
            matches: { exact: true },
            ruleScores: { exact: 1.0 },
          };
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Exact rule failed for ${candidate.id}: ${message}`);
        // Continue with other rules even if exact fails
      }
    }

    // Run all non-exact rules in parallel
    const rulesToProcess = this.rules.filter((r) => r.name !== 'exact');

    const ruleResults = await Promise.allSettled(
      rulesToProcess.map(async (rule) => {
        // Check applicability first (if the rule has an applicability check)
        if (rule.isApplicable) {
          try {
            if (!rule.isApplicable(context)) {
              return {
                name: rule.name,
                applicable: false,
                weight: rule.weight,
              };
            }
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);
            return {
              name: rule.name,
              applicable: false,
              error: `Applicability check failed: ${message}`,
              weight: rule.weight,
            };
          }
        }

        // Calculate score
        try {
          const rawScore = rule.calculate(context);
          const score = Math.max(0, Math.min(1, rawScore));
          return {
            name: rule.name,
            applicable: true,
            score,
            weight: rule.weight,
            rawScore,
            isApplicable: true, // Flag that this rule was applicable
          };
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          return {
            name: rule.name,
            applicable: true, // It was applicable but calculation failed
            error: `Score calculation failed: ${message}`,
            weight: rule.weight,
          };
        }
      }),
    );

    // Process results from all parallel rule executions
    let totalWeight = 0;
    let weightedScore = 0;
    const ruleScores: Record<string, number> = {};
    const matches: Record<string, boolean> = {};
    const failedRules: string[] = [];

    for (const result of ruleResults) {
      if (result.status === 'rejected') {
        failedRules.push(`Unknown rule (Promise rejected)`);
        continue;
      }

      const ruleResult = result.value;

      // Handle errors
      if (ruleResult.error) {
        this.logger.error(
          `Rule "${ruleResult.name}" failed: ${ruleResult.error}`,
        );
        failedRules.push(ruleResult.name);
        continue;
      }

      // Skip non-applicable rules
      if (!ruleResult.applicable) {
        this.logger.debug(`Rule "${ruleResult.name}" not applicable`);
        continue;
      }

      // Process successful rule result
      const score = ruleResult.score ?? 0;
      const weight = Math.abs(ruleResult.weight);

      ruleScores[ruleResult.name] = score;

      if (score > this.MATCH_THRESHOLD) {
        matches[ruleResult.name] = true;
      }

      // Log warning if score was clamped
      if (ruleResult.rawScore !== undefined && ruleResult.rawScore !== score) {
        this.logger.warn(
          `Rule "${ruleResult.name}" returned ${ruleResult.rawScore} — clamped to ${score}`,
        );
      }

      weightedScore += score * weight;
      totalWeight += weight;

      this.logger.debug(`Rule "${ruleResult.name}": score ${score.toFixed(3)}`);
    }

    if (failedRules.length > 0) {
      this.logger.warn(
        `${failedRules.length} rule(s) failed for ${candidate.id}: ${failedRules.join(', ')}`,
      );
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      event: candidate,
      score: Math.round(finalScore * 100) / 100,
      matches,
      ruleScores,
    };
  }

  /**
   * Strips internal fields from scoring results for public consumption.
   */
  private stripInternal(scored: InternalScoredEvent): ScoredEvent {
    const { ruleScores, ...publicFields } = scored;
    return publicFields;
  }
}
