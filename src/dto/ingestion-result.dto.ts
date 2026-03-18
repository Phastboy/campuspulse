import { ScoredEvent } from './similarity.dto';
import { EventSubmission } from '@application/types';

/**
 * HTTP response shape when the pipeline publishes a new event.
 */
export class CreatedResult {
  readonly action!: 'created';
  message!: string;
  eventId!: string;
}

/**
 * HTTP response shape when the submission is linked to an existing event.
 *
 * Occurs when:
 * - An exact match (score 1.0) was found during initial submission
 * - The submitter confirmed `decision: "duplicate"`
 * - The submitter chose `"new"` but an exact match was found anyway (trust model)
 */
export class LinkedResult {
  readonly action!: 'linked';
  message!: string;
  eventId!: string;
}

/**
 * HTTP response shape when similar events exist but the pipeline cannot
 * automatically determine if they are duplicates.
 *
 * `originalSubmission` is typed as {@link EventSubmission} — the normalised
 * domain form of the submission (with hydrated `Date` objects). The client
 * echoes these fields back in the confirm request. Using the domain type
 * avoids a lossy re-serialisation of `Date` objects back to ISO strings and
 * keeps the type consistent end-to-end without casting.
 *
 * `similar` contains {@link ScoredEvent} — the Swagger-decorated HTTP
 * projection of {@link SimilarityMatch}. The mapping happens in
 * {@link IngestionController} before this object is returned.
 */
export class NeedsDecisionResult {
  readonly action!: 'needs_decision';
  message!: string;
  similar!: ScoredEvent[];
  originalSubmission!: EventSubmission;
}

/**
 * Discriminated union of all possible HTTP response shapes from the ingestion
 * pipeline. Narrow on `action` to access shape-specific fields.
 */
export type IngestionResult =
  | CreatedResult
  | LinkedResult
  | NeedsDecisionResult;
