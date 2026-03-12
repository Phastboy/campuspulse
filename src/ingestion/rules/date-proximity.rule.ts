import { Injectable, Logger } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';
import { getComparableDateFromEvent } from '../helpers/event-date.helper';

@Injectable()
export class DateProximityRule implements SimilarityRule {
  name = 'date';
  weight = 0.2;
  private readonly logger = new Logger(DateProximityRule.name);

  calculate(context: SimilarityContext): number {
    try {
      this.logger.debug(
        `Calculating date proximity for candidate: ${context.candidate.id}`,
      );

      // submission uses 'datetime', candidate uses 'datetime'
      const submissionDate = context.submission.datetime.date;
      const candidateDate = getComparableDateFromEvent(context.candidate);

      // Validate that we have actual Date objects
      if (!(submissionDate instanceof Date)) {
        this.logger.error(
          `Submission date is not a Date: ${typeof submissionDate}`,
        );
        return 0;
      }

      if (!(candidateDate instanceof Date)) {
        this.logger.error(
          `Candidate date is not a Date: ${typeof candidateDate} - value: ${JSON.stringify(candidateDate)}`,
        );
        return 0; // Return 0 score instead of throwing
      }

      this.logger.debug(`Submission date: ${submissionDate.toISOString()}`);
      this.logger.debug(`Candidate date: ${candidateDate.toISOString()}`);

      const dateDiff = Math.abs(
        candidateDate.getTime() - submissionDate.getTime(),
      );
      const daysDiff = dateDiff / (24 * 60 * 60 * 1000);

      this.logger.debug(`Date difference: ${daysDiff.toFixed(2)} days`);

      const score = Math.max(0, 1 - daysDiff / 7);

      this.logger.debug(`Date proximity score: ${score.toFixed(3)}`);

      return score;
    } catch (error) {
      const err = error as Error;

      this.logger.error(`Failed to calculate date proximity`);
      this.logger.error(`Candidate ID: ${context.candidate.id}`);
      this.logger.error(`Submission date: ${context.submission.datetime.date}`);
      this.logger.error(`Error: ${err.message}`);
      this.logger.error(`Stack: ${err.stack}`);

      // Return 0 instead of throwing - rule fails gracefully
      return 0;
    }
  }

  isApplicable(context: SimilarityContext): boolean {
    try {
      const submissionDate = context.submission.datetime.date;
      const isApplicable =
        submissionDate instanceof Date && !isNaN(submissionDate.getTime());

      this.logger.debug(`DateProximityRule isApplicable: ${isApplicable}`);

      return isApplicable;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error checking applicability: ${err.message}`);
      return false;
    }
  }
}
