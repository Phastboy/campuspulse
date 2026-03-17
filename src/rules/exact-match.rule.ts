import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '@similarity/similarity-rule.interface';
import {
  getComparableDateFromSummary,
  isSameDay,
} from '@helpers/event-date.helper';

/**
 * Short-circuit rule that detects identical events.
 *
 * Returns 1.0 when submission and candidate share the same normalised title,
 * venue, and calendar day. A score of 1.0 stops all further scoring for that
 * candidate in {@link SimilarityEngine}.
 */
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
    const dateMatch = isSameDay(
      context.submission.datetime.date,
      candidateDate,
    );
    return titleMatch && venueMatch && dateMatch ? 1 : 0;
  }

  isApplicable(): boolean {
    return true;
  }
}
