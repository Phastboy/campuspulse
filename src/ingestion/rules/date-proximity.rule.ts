import { Injectable, Logger } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';
import { getComparableDateFromSummary } from '../helpers/event-date.helper';

/**
 * Similarity rule that scores how close two event dates are.
 *
 * Weight: `0.2` — date proximity is a supporting signal. Score of `1.0`
 * means same day; decays linearly to `0` at {@link DECAY_WINDOW_DAYS} days apart.
 *
 * Fails gracefully — if the candidate date cannot be extracted, returns `0`
 * rather than throwing, preventing a single bad record from breaking the run.
 */
@Injectable()
export class DateProximityRule implements SimilarityRule {
  readonly name: string = 'date';
  readonly weight: number = 0.2;

  private readonly logger = new Logger(DateProximityRule.name);

  /** Number of days over which the score decays from 1 to 0. */
  private readonly DECAY_WINDOW_DAYS = 7;

  calculate(context: SimilarityContext): number {
    try {
      const submissionDate = context.submission.datetime.date;
      const candidateDate = getComparableDateFromSummary(context.candidate);

      if (!(submissionDate instanceof Date)) {
        this.logger.error(
          `Submission date is not a Date: ${typeof submissionDate}`,
        );
        return 0;
      }

      if (!candidateDate) {
        this.logger.error(
          `Could not extract date from candidate ${context.candidate.id}`,
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

  isApplicable(context: SimilarityContext): boolean {
    try {
      const { date } = context.submission.datetime;
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }
}
