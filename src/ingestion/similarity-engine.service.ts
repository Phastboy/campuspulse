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
import { RuleEvaluator } from './scoring/rule-evaluator';

/**
 * Orchestrates duplicate detection for a submission.
 *
 * Responsibilities:
 * 1. Build the candidate search window
 * 2. Score each candidate via {@link RuleEvaluator} (parallel)
 * 3. Filter and sort results
 *
 * There is no internal enriched type here — {@link RuleEvaluator} returns
 * fully formed {@link ScoredEvent} objects. Diagnostic `ruleScores` are
 * logged inside the evaluator and never surface here or above.
 */
@Injectable()
export class SimilarityEngine implements ISimilarityEngine {
  private readonly logger = new Logger(SimilarityEngine.name);
  private readonly evaluator: RuleEvaluator;

  private readonly SIMILARITY_THRESHOLD = 0.3;
  private readonly SEARCH_WINDOW_DAYS = 7;

  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepository: ICandidateRepository,
    @Inject('SIMILARITY_RULES')
    private readonly rules: SimilarityRule[],
  ) {
    this.evaluator = new RuleEvaluator(rules);
    this.logger.log(`SimilarityEngine ready with ${rules.length} rules`);
    this.logger.debug(`Rules: ${rules.map((r) => r.name).join(', ')}`);
  }

  async findSimilar(submission: EventSubmission): Promise<ScoredEvent[]> {
    this.logger.log(`Finding similar events for: "${submission.title}"`);

    const { from, to } = this.buildWindow(submission.datetime.date);
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

      const scored = await Promise.all(
        candidates.map((c) => this.scoreCandidate(c, submission)),
      );

      const results = scored
        .filter(
          (r): r is ScoredEvent =>
            r !== null && r.score > this.SIMILARITY_THRESHOLD,
        )
        .sort((a, b) => b.score - a.score);

      this.logger.log(
        `${results.length} candidates above threshold (${this.SIMILARITY_THRESHOLD})`,
      );

      if (results.length > 0) {
        const top = results[0];
        this.logger.debug(`Top match: "${top.event.title}" (${top.score})`);
      }

      return results;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding similar events: ${message}`);
      throw error;
    }
  }

  private buildWindow(date: Date): { from: Date; to: Date } {
    const from = new Date(date);
    from.setDate(from.getDate() - this.SEARCH_WINDOW_DAYS);
    const to = new Date(date);
    to.setDate(to.getDate() + this.SEARCH_WINDOW_DAYS);
    return { from, to };
  }

  private async scoreCandidate(
    candidate: EventSummary,
    submission: EventSubmission,
  ): Promise<ScoredEvent | null> {
    try {
      const context: SimilarityContext = {
        submission,
        candidate,
        submissionDate: submission.datetime.date,
      };

      // Short-circuit: exact match stops all further scoring
      const exactRule = this.rules.find((r) => r.name === 'exact');
      if (exactRule?.calculate(context) === 1.0) {
        this.logger.log(`Exact match: ${candidate.id}`);
        return { event: candidate, score: 1.0, matches: { exact: true } };
      }

      return this.evaluator.score(candidate, context);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to score candidate ${candidate.id}: ${message}`,
      );
      return null;
    }
  }
}
