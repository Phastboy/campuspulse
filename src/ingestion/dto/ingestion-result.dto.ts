import { SubmitEventDto } from '../dto/submit-event.dto';
import { ScoredEvent } from './similarity.dto';

/**
 * Result returned when the ingestion pipeline creates a new event.
 */
export class CreatedResult {
  readonly action!: 'created';

  /** Human-readable outcome description. */
  message!: string;

  /** UUID of the newly created event. */
  eventId!: string;
}

/**
 * Result returned when the submission is linked to an existing event.
 *
 * This occurs in two cases:
 * - An exact match (score 1.0) was found during initial submission
 * - The submitter confirmed `decision: "duplicate"` during the confirm step
 * - The submitter selected `decision: "new"` but an exact match was found anyway
 */
export class LinkedResult {
  readonly action!: 'linked';

  /** Human-readable outcome description. */
  message!: string;

  /** UUID of the existing event this submission was linked to. */
  eventId!: string;
}

/**
 * Result returned when the pipeline detects similar events but cannot
 * determine whether they are duplicates without human input.
 *
 * The client must call `POST /ingestion/confirm` to resolve the decision.
 * The `originalSubmission` field should be passed unchanged to that endpoint.
 */
export class NeedsDecisionResult {
  readonly action!: 'needs_decision';

  /** Human-readable explanation of why confirmation is required. */
  message!: string;

  /** Candidate events that may match the submission, ordered by score descending. */
  similar!: ScoredEvent[];

  /**
   * Echo of the original submission payload.
   *
   * Pass this unchanged to `POST /api/ingestion/confirm` along with
   * a `decision` field to resolve the ambiguity.
   */
  originalSubmission!: SubmitEventDto;
}

/**
 * Discriminated union of all possible outcomes from the ingestion pipeline.
 *
 * Use the `action` field as a discriminator to narrow the type and access
 * shape-specific fields safely.
 *
 * @example
 * switch (result.action) {
 *   case 'created':
 *     redirect(`/events/${result.eventId}`);
 *     break;
 *   case 'linked':
 *     showToast(`Already exists — showing existing event`);
 *     redirect(`/events/${result.eventId}`);
 *     break;
 *   case 'needs_decision':
 *     showSimilarEventsDialog(result.similar, result.originalSubmission);
 *     break;
 * }
 */
export type IngestionResult =
  | CreatedResult
  | LinkedResult
  | NeedsDecisionResult;
