import { Injectable, Logger } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '@similarity/similarity-rule.interface';
import { getComparableDateFromSummary } from '@helpers/event-date.helper';

/**
 * Scores date proximity. Weight 0.2.
 * Score of 1.0 = same day; decays linearly to 0 at 7 days apart.
 * Fails gracefully — returns 0 rather than throwing on bad data.
 */
@Injectable()
export class DateProximityRule implements SimilarityRule {
  readonly name = 'date';
  readonly weight = 0.2;
  private readonly logger = new Logger(DateProximityRule.name);
  private readonly DECAY_WINDOW_DAYS = 7;

  calculate(context: SimilarityContext): number {
    try {
      const submissionDate = context.submission.datetime.date;
      const candidateDate = getComparableDateFromSummary(context.candidate);
      if (!(submissionDate instanceof Date)) return 0;
      if (!candidateDate) return 0;
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysDiff =
        Math.abs(candidateDate.getTime() - submissionDate.getTime()) / msPerDay;
      return Math.max(0, 1 - daysDiff / this.DECAY_WINDOW_DAYS);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to calculate date proximity: ${message}`);
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
