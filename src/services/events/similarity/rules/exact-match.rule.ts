import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../similarity-rule.interface';
import {
  getComparableDateFromSummary,
  isSameDay,
} from '../helpers/event-date.helper';

@Injectable()
export class ExactMatchRule implements SimilarityRule {
  readonly name = 'exact';
  readonly weight = 1.0;

  calculate(context: SimilarityContext): number {
    const titleMatch =
      context.submission.title.toLowerCase().trim() ===
      context.candidate.title.toLowerCase().trim();
    const venueMatch =
      context.submission.venue.toLowerCase().trim() ===
      context.candidate.venue.toLowerCase().trim();
    const candidateDate = getComparableDateFromSummary(context.candidate);
    if (!candidateDate) return 0;
    return titleMatch &&
      venueMatch &&
      isSameDay(context.submission.datetime.date, candidateDate)
      ? 1
      : 0;
  }

  isApplicable(): boolean {
    return true;
  }
}
