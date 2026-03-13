import { Injectable, Logger } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';
import { getComparableDateFromEvent } from '../helpers/event-date.helper';

/**
 * Similarity rule that scores how close two event dates are.
 *
 * Weight: `0.2` — date proximity is a supporting signal. A score of `1.0`
 * means same day; score decays linearly to `0` at 7 days apart. Events
 * further than 7 days apart score `0`.
 *
 * This rule uses the ±7 day window that `SimilarityEngine` already uses
 * when fetching candidates, so scores will always be in `(0, 1]` for any
 * candidate that reaches this rule.
 *
 * Fails gracefully — if the candidate date cannot be extracted or is not a
 * valid `Date`, the rule returns `0` rather than throwing. This prevents a
 * single bad record from breaking the entire scoring run.
 *
 * @example
 * // Same day → 1.0
 * // 3.5 days apart → 0.5
 * // 7 days apart → 0.0
 */
@Injectable()
export class DateProximityRule implements SimilarityRule {
  readonly name: string = 'date';
  readonly weight: number = 0.2;

  private readonly logger = new Logger(DateProximityRule.name);

  /** Number of days over which the score decays from 1 to 0. */
  private readonly DECAY_WINDOW_DAYS = 7;

  /**
   * Computes a date proximity score for the given submission/candidate pair.
   *
   * @param context - Scoring context containing the submission and candidate
   * @returns Score in `[0, 1]` — `1.0` for same day, linearly decaying to `0` at 7 days
   */
  calculate(context: SimilarityContext): number {
    try {
      const submissionDate = context.submission.datetime.date;
      const candidateDate = getComparableDateFromEvent(context.candidate);

      if (!(submissionDate instanceof Date)) {
        this.logger.error(
          `Submission date is not a Date: ${typeof submissionDate}`,
        );
        return 0;
      }

      if (!(candidateDate instanceof Date)) {
        this.logger.error(
          `Candidate date is not a Date: ${typeof candidateDate} — value: ${JSON.stringify(candidateDate)}`,
        );
        return 0;
      }

      const msPerDay = 24 * 60 * 60 * 1000;
      const daysDiff =
        Math.abs(candidateDate.getTime() - submissionDate.getTime()) / msPerDay;

      const score = Math.max(0, 1 - daysDiff / this.DECAY_WINDOW_DAYS);

      this.logger.debug(
        `Date proximity: ${daysDiff.toFixed(2)} days apart → score ${score.toFixed(3)}`,
      );

      return score;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to calculate date proximity for candidate ${context.candidate.id}: ${message}`,
      );
      return 0;
    }
  }

  /**
   * Guards against invalid submission dates — skips scoring rather than
   * producing meaningless results.
   *
   * @param context - Scoring context
   * @returns `true` if `submissionDate` is a valid `Date`; `false` to skip this rule
   */
  isApplicable(context: SimilarityContext): boolean {
    try {
      const { date } = context.submission.datetime;
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }
}
