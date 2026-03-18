import { IEvent } from '@domain/interfaces';

/**
 * Normalised representation of an event submission flowing through the
 * ingestion pipeline.
 *
 * Derived from {@link IEvent} minus the server-assigned fields that do not
 * exist at submission time. All date fields are hydrated `Date` objects.
 */
export type EventSubmission = Omit<IEvent, 'id' | 'createdAt'>;
