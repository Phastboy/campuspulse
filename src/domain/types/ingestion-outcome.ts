import { SimilarityMatch } from './similarity-match';
import { EventSubmission } from './event-submission';

/**
 * Domain-level outcome of a clean submission — new event created.
 * Mapped to {@link CreatedResult} DTO at the controller.
 */
export interface CreatedOutcome {
  action: 'created';
  eventId: string;
  message: string;
}

/**
 * Domain-level outcome when the submission is an exact duplicate.
 * Mapped to {@link LinkedResult} DTO at the controller.
 */
export interface LinkedOutcome {
  action: 'linked';
  eventId: string;
  message: string;
}

/**
 * Domain-level outcome when similar (but not exact) events exist.
 * The submitter must resolve via `POST /ingestion/confirm`.
 * Mapped to {@link NeedsDecisionResult} DTO at the controller.
 *
 * `originalSubmission` is typed as {@link EventSubmission} — the normalised
 * domain form of the submission. The client echoes these fields back in the
 * confirm request. Using the domain type here avoids importing a DTO into
 * the domain layer and eliminates the unsafe cast that was previously needed.
 */
export interface NeedsDecisionOutcome {
  action: 'needs_decision';
  message: string;
  similar: SimilarityMatch[];
  originalSubmission: EventSubmission;
}

/** Discriminated union of all domain-level ingestion outcomes. */
export type IngestionOutcome =
  | CreatedOutcome
  | LinkedOutcome
  | NeedsDecisionOutcome;
