import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';
import { getComparableDateFromEvent, isSameDay } from '../helpers/event-date.helper'; // Fixed path

@Injectable()
export class ExactMatchRule implements SimilarityRule {
  name = 'exact';
  weight = 1.0;

  calculate(context: SimilarityContext): number {
    const titleMatch =
      context.submission.title.toLowerCase().trim() ===
      context.candidate.title.toLowerCase().trim();

    const venueMatch =
      context.submission.venue.toLowerCase().trim() ===
      context.candidate.venue.toLowerCase().trim();

    // submission.datetime vs candidate.datetime
    const submissionDate = context.submission.datetime.date;
    const candidateDate = getComparableDateFromEvent(context.candidate);
    const dateMatch = isSameDay(submissionDate, candidateDate);

    return titleMatch && venueMatch && dateMatch ? 1 : 0;
  }

  isApplicable(context: SimilarityContext): boolean {
    return true;
  }
}
