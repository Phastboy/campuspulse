import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  SimilarityRule,
  SimilarityContext,
} from './interfaces/similarity-rule.interface';
import { Event } from '@events/entities/event.entity';
import { EventSubmission } from '@events/domain';
import { ScoredEvent } from './dto/similarity.dto';

/**
 * Internal scoring result produced during candidate evaluation.
 *
 * `ruleScores` is kept here for debug logging only and is never returned to
 * callers or serialised into API responses. The public {@link ScoredEvent}
 * type is the stripped version without `ruleScores`.
 */
interface InternalScoredEvent {
  event: ScoredEvent['event'];
  score: number;
  matches: Record<string, boolean>;
  /** Engine-internal diagnostic data — stripped before returning to callers. */
  ruleScores: Record<string, number>;
}

/**
 * Scores existing events against a new submission to detect potential duplicates.
 *
 * The engine fetches all events within ±7 days of the submission date and
 * scores each candidate against a set of injected {@link SimilarityRule}
 * instances. Rules are weighted and their scores combined into a single
 * aggregate score per candidate.
 *
 * **Short-circuit optimisation:** if the `"exact"` rule returns `1.0` for any
 * candidate, scoring stops immediately for that candidate and it is returned
 * as a definitive match. No other rules are evaluated.
 *
 * **Adding rules:** implement {@link SimilarityRule} and register the class
 * in {@link IngestionModule}'s `SIMILARITY_RULES` factory. The engine itself
 * does not need to change — Open/Closed principle.
 *
 * @example
 * // Only candidates scoring above 0.3 are returned.
 * // Results are sorted by score descending.
 * const similar = await similarityEngine.findSimilar(submission);
 */
@Injectable()
export class SimilarityEngine {
  private readonly logger = new Logger(SimilarityEngine.name);

  /** Maximum number of candidates scored concurrently. */
  private readonly CONCURRENCY_LIMIT: number = 10;

  /** Minimum aggregate score for a candidate to be included in results. */
  private readonly SIMILARITY_THRESHOLD: number = 0.3;

  /** Score threshold above which an individual rule dimension is flagged in `matches`. */
  private readonly MATCH_THRESHOLD: number = 0.7;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: EntityRepository<Event>,

    @Inject('SIMILARITY_RULES')
    private readonly rules: SimilarityRule[],
  ) {
    this.logger.log(`SimilarityEngine initialised with ${rules.length} rules`);
    this.logger.debug(`Rules: ${rules.map((r) => r.name).join(', ')}`);
  }

  /**
   * Finds existing events that are similar to the given submission.
   *
   * Searches within a ±7 day window around the submission date, scores all
   * candidates in parallel (bounded by {@link CONCURRENCY_LIMIT}), filters
   * out candidates below {@link SIMILARITY_THRESHOLD}, and returns results
   * sorted by score descending.
   *
   * Rule-level scores are stripped from the returned objects — callers receive
   * only the public {@link ScoredEvent} shape.
   *
   * @param submission - The normalised event submission to compare against
   * @returns Candidates above the similarity threshold, sorted by score descending
   * @throws Re-throws database errors — individual candidate scoring failures
   *   are caught and logged, and that candidate is excluded from results
   */
  async findSimilar(submission: EventSubmission): Promise<ScoredEvent[]> {
    this.logger.log(`Finding similar events for: "${submission.title}"`);

    const submissionDate = submission.datetime.date;

    const startDate = new Date(submissionDate);
    startDate.setDate(startDate.getDate() - 7);

    const endDate = new Date(submissionDate);
    endDate.setDate(endDate.getDate() + 7);

    this.logger.debug(
      `Search window: ${startDate.toISOString()} → ${endDate.toISOString()}`,
    );

    try {
      const qb = this.eventRepo.createQueryBuilder('e');
      const candidates = await qb
        .select('*')
        .where(`(e.datetime->>'date')::timestamptz BETWEEN ? AND ?`, [
          startDate,
          endDate,
        ])
        .getResult();

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
          (result): result is InternalScoredEvent =>
            result !== null && result.score > this.SIMILARITY_THRESHOLD,
        )
        .sort((a, b) => b.score - a.score);

      this.logger.log(
        `${validResults.length} candidates above threshold (${this.SIMILARITY_THRESHOLD})`,
      );

      if (validResults.length > 0) {
        const top = validResults[0];
        this.logger.debug(`Top match: "${top.event.title}" (${top.score})`);
        this.logger.debug('Top match rule scores:');
        for (const [rule, score] of Object.entries(top.ruleScores)) {
          this.logger.debug(`  ${rule}: ${score.toFixed(3)}`);
        }
      }

      // Strip internal ruleScores before returning to callers
      return validResults.map(
        ({ ruleScores: _internal, ...publicFields }) => publicFields,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding similar events: ${message}`);
      this.logger.error(`Submission: ${JSON.stringify(submission)}`);
      throw error;
    }
  }

  /**
   * Processes an array of items concurrently, bounded by `concurrency`.
   *
   * Splits `items` into chunks of size `concurrency` and processes each
   * chunk with `Promise.all` before moving to the next. This prevents
   * unbounded parallelism when the candidate pool is large.
   *
   * @param items - Items to process
   * @param fn - Async function to apply to each item
   * @param concurrency - Maximum number of items processed in parallel
   * @returns Results in the same order as `items`
   */
  private async mapConcurrent<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency: number = this.CONCURRENCY_LIMIT,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      const chunkResults = await Promise.all(chunk.map(fn));
      results.push(...chunkResults);

      if (items.length > 100) {
        this.logger.debug(
          `Scored ${Math.min(i + concurrency, items.length)}/${items.length}`,
        );
      }
    }

    return results;
  }

  /**
   * Scores a single candidate event against the submission.
   *
   * First checks for an exact match via the `"exact"` rule — if found,
   * returns immediately with score `1.0` without evaluating other rules.
   *
   * For non-exact candidates, runs all remaining rules (skipping inapplicable
   * ones), computes a weighted average, and collects dimension-level match flags.
   *
   * Rules that throw are logged and excluded from the weighted average, but
   * do not abort scoring for the rest of the rules.
   *
   * @param candidate - The existing event to score
   * @param submission - The submitted event to compare against
   * @returns Internal scored result including rule-level diagnostics
   */
  private scoreCandidate(
    candidate: Event,
    submission: EventSubmission,
  ): InternalScoredEvent {
    this.logger.debug(`Scoring candidate: ${candidate.id}`);

    const context: SimilarityContext = {
      submission,
      candidate,
      submissionDate: submission.datetime.date,
    };

    // Short-circuit: exact match check first
    const exactRule = this.rules.find((r) => r.name === 'exact');
    if (exactRule) {
      const exactScore = exactRule.calculate(context);
      if (exactScore === 1.0) {
        this.logger.log(
          `Exact match: candidate ${candidate.id} — short-circuiting`,
        );
        return {
          event: {
            id: candidate.id,
            title: candidate.title,
            datetime: candidate.datetime,
            venue: candidate.venue,
          },
          score: 1.0,
          matches: { exact: true },
          ruleScores: { exact: 1.0 },
        };
      }
    }

    // Full weighted scoring for non-exact candidates
    let totalWeight: number = 0;
    let weightedScore: number = 0;
    const ruleScores: Record<string, number> = {};
    const failedRules: string[] = [];

    for (const rule of this.rules) {
      if (rule.name === 'exact') continue;

      if (rule.isApplicable) {
        try {
          if (!rule.isApplicable(context)) {
            this.logger.debug(
              `Rule "${rule.name}" not applicable for candidate ${candidate.id}`,
            );
            continue;
          }
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Applicability check failed for rule "${rule.name}": ${message}`,
          );
          failedRules.push(rule.name);
          continue;
        }
      }

      try {
        const rawScore = rule.calculate(context);
        // Clamp to [0, 1] — rules should stay in range but we defend anyway
        const score = Math.max(0, Math.min(1, rawScore));

        if (rawScore !== score) {
          this.logger.warn(
            `Rule "${rule.name}" returned ${rawScore} — clamped to ${score}`,
          );
        }

        ruleScores[rule.name] = score;
        weightedScore += score * Math.abs(rule.weight);
        totalWeight += Math.abs(rule.weight);

        this.logger.debug(
          `Rule "${rule.name}": ${score.toFixed(3)} (weight: ${rule.weight})`,
        );
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
        `${failedRules.length} rule(s) failed for candidate ${candidate.id}: ${failedRules.join(', ')}`,
      );
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    const matches: Record<string, boolean> = {};
    for (const [name, score] of Object.entries(ruleScores)) {
      if (score > this.MATCH_THRESHOLD) matches[name] = true;
    }

    this.logger.debug(
      `Candidate ${candidate.id} final score: ${finalScore.toFixed(3)}`,
    );

    return {
      event: {
        id: candidate.id,
        title: candidate.title,
        datetime: candidate.datetime,
        venue: candidate.venue,
      },
      score: Math.round(finalScore * 100) / 100,
      matches,
      ruleScores,
    };
  }
}
