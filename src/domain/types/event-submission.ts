import { EventDateTime } from '@common/datetime';

/**
 * Normalised domain object representing an event submission as it flows
 * through the ingestion pipeline.
 *
 * Produced by {@link EventDateTimeMapper} from a {@link SubmitEventDto};
 * consumed by {@link SimilarityEngine} and {@link IEventCreator}.
 * All date fields are hydrated `Date` objects at this point, never raw strings.
 */
export interface EventSubmission {
  title: string;
  datetime: EventDateTime;
  venue: string;
}
