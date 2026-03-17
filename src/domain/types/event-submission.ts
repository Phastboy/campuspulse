import { IEvent } from '@domain/interfaces';

/**
 * Normalised domain object representing an event submission as it flows
 * through the ingestion pipeline.
 *
 * Derived from {@link IEvent} by dropping the server-assigned fields (`id`,
 * `createdAt`) that do not exist at submission time. Using
 * `Omit` keeps this type automatically in sync if `IEvent` changes.
 *
 * Produced by {@link EventDateTimeMapper} from a {@link SubmitEventDto}.
 * All date fields are hydrated `Date` objects at this point — never raw strings.
 */
export type EventSubmission = Omit<IEvent, 'id' | 'createdAt'>;
