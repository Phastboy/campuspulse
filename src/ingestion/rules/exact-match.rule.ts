import { Injectable } from '@nestjs/common';
import {
  SimilarityRule,
  SimilarityContext,
} from '../interfaces/similarity-rule.interface';
import {
  getComparableDateFromEvent,
  isSameDay,
} from '../helpers/event-date.helper';

/**
 * Short-circuit similarity rule that detects identical events.
 *
 * Returns `1.0` (exact match) when the submission and candidate share the
 * same normalised title, the same normalised venue, and fall on the same
 * calendar day. Returns `0` otherwise.
 *
 * This rule receives special treatment in {@link SimilarityEngine}: when it
 * returns `1.0`, scoring stops immediately and the candidate is returned as
 * a definitive duplicate — no other rules are evaluated. This is enforced by
 * naming this rule `"exact"`, which the engine checks explicitly.
 *
 * Normalisation applied before comparison:
 * - Lowercased
 * - Trimmed of leading/trailing whitespace
 */
@Injectable()
export class ExactMatchRule implements SimilarityRule {
  readonly name: string = 'exact';
  readonly weight: number = 1.0;

  /**
   * Computes an exact-match score for the given submission/candidate pair.
   *
   * @param context - Scoring context containing the submission and candidate
   * @returns `1` if all three dimensions match exactly; `0` otherwise
   */
  calculate(context: SimilarityContext): number {
    const titleMatch =
      context.submission.title.toLowerCase().trim() ===
      context.candidate.title.toLowerCase().trim();

    const venueMatch =
      context.submission.venue.toLowerCase().trim() ===
      context.candidate.venue.toLowerCase().trim();

    const submissionDate = context.submission.datetime.date;
    const candidateDate = getComparableDateFromEvent(context.candidate);
    const dateMatch = isSameDay(submissionDate, candidateDate);

    return titleMatch && venueMatch && dateMatch ? 1 : 0;
  }

  /**
   * This rule is always applicable — it has no preconditions.
   *
   * @returns Always `true`
   */
  isApplicable(_context: SimilarityContext): boolean {
    return true;
  }
}
