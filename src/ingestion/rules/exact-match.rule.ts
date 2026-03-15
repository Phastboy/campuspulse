import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';
import {
  getComparableDateFromSummary,
  isSameDay,
} from '../helpers/event-date.helper';

/**
 * Short-circuit rule that detects identical events.
 *
 * Returns `1.0` when the submission and candidate share the same normalised
 * title, the same normalised venue, and fall on the same calendar day.
 * Returns `0` otherwise.
 *
 * Receives special treatment in {@link SimilarityEngine}: a score of `1.0`
 * stops all further scoring for that candidate immediately — no other rules
 * are evaluated. This is enforced by the rule's name being `"exact"`.
 */
@Injectable()
export class ExactMatchRule implements SimilarityRule {
  readonly name: string = 'exact';
  readonly weight: number = 1.0;

  calculate(context: SimilarityContext): number {
    const titleMatch =
      context.submission.title.toLowerCase().trim() ===
      context.candidate.title.toLowerCase().trim();

    const venueMatch =
      context.submission.venue.toLowerCase().trim() ===
      context.candidate.venue.toLowerCase().trim();

    const submissionDate = context.submission.datetime.date;
    const candidateDate = getComparableDateFromSummary(context.candidate);

    if (!candidateDate) return 0;

    const dateMatch = isSameDay(submissionDate, candidateDate);

    return titleMatch && venueMatch && dateMatch ? 1 : 0;
  }

  isApplicable(): boolean {
    return true;
  }
}
