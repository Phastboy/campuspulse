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
 * `ICandidateRepository.findCandidatesInWindow` now returns `EventSummary[]`
 * directly — no projection step needed here. The engine deals purely in
 * domain types; no ORM entity ever enters this class.
 */
@Injectable()
export class SimilarityEngine implements ISimilarityEngine {
  private readonly logger = new Logger(SimilarityEngine.name);

  private readonly CONCURRENCY_LIMIT: number = 10;
  private readonly SIMILARITY_THRESHOLD: number = 0.3;
  private readonly MATCH_THRESHOLD: number = 0.7;
  private readonly SEARCH_WINDOW_DAYS: number = 7;

  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepository: ICandidateRepository,
    @Inject('SIMILARITY_RULES')
    private readonly rules: SimilarityRule[],
  ) {
    this.logger.log(`SimilarityEngine initialised with ${rules.length} rules`);
    this.logger.debug(`Rules: ${rules.map((r) => r.name).join(', ')}`);
  }

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

      const scored = await this.mapConcurrent(candidates, async (candidate) => {
        try {
          return this.scoreCandidate(candidate, submission);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to score candidate ${candidate.id}: ${message}`,
          );
          return null;
        }
      });

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

      return validResults.map(
        ({ ruleScores: _internal, ...publicFields }) => publicFields,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding similar events: ${message}`);
      throw error;
    }
  }

  private async mapConcurrent<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency: number = this.CONCURRENCY_LIMIT,
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      results.push(...(await Promise.all(chunk.map(fn))));
      if (items.length > 100) {
        this.logger.debug(
          `Scored ${Math.min(i + concurrency, items.length)}/${items.length}`,
        );
      }
    }
    return results;
  }

  private scoreCandidate(
    candidate: EventSummary,
    submission: EventSubmission,
  ): InternalScoredEvent {
    const context: SimilarityContext = {
      submission,
      candidate,
      submissionDate: submission.datetime.date,
    };

    const exactRule = this.rules.find((r) => r.name === 'exact');
    if (exactRule && exactRule.calculate(context) === 1.0) {
      this.logger.log(`Exact match: candidate ${candidate.id}`);
      return {
        event: candidate,
        score: 1.0,
        matches: { exact: true },
        ruleScores: { exact: 1.0 },
      };
    }

    let totalWeight = 0;
    let weightedScore = 0;
    const ruleScores: Record<string, number> = {};
    const failedRules: string[] = [];

    for (const rule of this.rules) {
      if (rule.name === 'exact') continue;

      if (rule.isApplicable) {
        try {
          if (!rule.isApplicable(context)) continue;
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Applicability check failed for "${rule.name}": ${message}`,
          );
          failedRules.push(rule.name);
          continue;
        }
      }

      try {
        const rawScore = rule.calculate(context);
        const score = Math.max(0, Math.min(1, rawScore));
        if (rawScore !== score) {
          this.logger.warn(
            `Rule "${rule.name}" returned ${rawScore} — clamped to ${score}`,
          );
        }
        ruleScores[rule.name] = score;
        weightedScore += score * Math.abs(rule.weight);
        totalWeight += Math.abs(rule.weight);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Rule "${rule.name}" threw for candidate ${candidate.id}: ${message}`,
        );
        failedRules.push(rule.name);
      }
    }

    if (failedRules.length > 0) {
      this.logger.warn(
        `${failedRules.length} rule(s) failed for ${candidate.id}: ${failedRules.join(', ')}`,
      );
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const matches: Record<string, boolean> = {};
    for (const [name, score] of Object.entries(ruleScores)) {
      if (score > this.MATCH_THRESHOLD) matches[name] = true;
    }

    return {
      event: candidate,
      score: Math.round(finalScore * 100) / 100,
      matches,
      ruleScores,
    };
  }
}
