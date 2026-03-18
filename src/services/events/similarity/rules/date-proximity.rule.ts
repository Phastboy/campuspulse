import { Injectable, Logger } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../similarity-rule.interface';
import { getComparableDateFromSummary } from '../helpers/event-date.helper';

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
      if (!(submissionDate instanceof Date) || !candidateDate) return 0;
      const daysDiff =
        Math.abs(candidateDate.getTime() - submissionDate.getTime()) / 86400000;
      return Math.max(0, 1 - daysDiff / this.DECAY_WINDOW_DAYS);
    } catch (error: unknown) {
      this.logger.error(
        `Date proximity error: ${error instanceof Error ? error.message : String(error)}`,
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
