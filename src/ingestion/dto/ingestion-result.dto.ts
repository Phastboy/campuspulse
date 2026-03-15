import { CreatedResult } from './created-result';
import { LinkedResult } from './linked-result';
import { NeedsDecisionResult } from './needs-decision-result';

export { CreatedResult, LinkedResult, NeedsDecisionResult };

/**
 * Discriminated union of all possible outcomes from the ingestion pipeline.
 *
 * Narrow on `action` to access shape-specific fields safely:
 *
 * @example
 * switch (result.action) {
 *   case 'created':        redirect(`/events/${result.eventId}`); break;
 *   case 'linked':         redirect(`/events/${result.eventId}`); break;
 *   case 'needs_decision': showDialog(result.similar, result.originalSubmission); break;
 * }
 */
export type IngestionResult =
  | CreatedResult
  | LinkedResult
  | NeedsDecisionResult;
