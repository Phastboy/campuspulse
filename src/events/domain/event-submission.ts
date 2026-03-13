import { EventDateTime } from '@common/datetime';

/**
 * Internal domain object representing an event submission as it flows
 * through the ingestion pipeline.
 *
 * This is the normalised, typed form of a {@link SubmitEventDto} after
 * its raw string fields (dates, times) have been converted to `Date` objects.
 * It is consumed by the {@link SimilarityEngine} and used to construct
 * an {@link Event} entity when a submission is approved.
 *
 * This type is intentionally minimal — it contains only the fields
 * that the pipeline needs to evaluate and persist. Display-only fields
 * such as `description` are carried on the DTO and applied during
 * entity creation.
 */
export interface EventSubmission {
  /** Human-readable event title. */
  title: string;

  /**
   * Structured datetime built from the DTO's flat date/time string fields.
   * All `Date` values are fully hydrated at this point.
   */
  datetime: EventDateTime;

  /** Venue name as submitted. */
  venue: string;
}
