import { IEvent } from '@domain/interfaces';
import { EventSubmission } from '@domain/types';

/**
 * Port for creating new published events.
 *
 * Consumed exclusively by {@link IngestionService}. Separated from
 * {@link IEventMutator} so ingestion cannot call `save` or `remove`.
 */
export interface IEventCreator {
  create(submission: EventSubmission): Promise<IEvent>;
}

export const EVENT_CREATOR = 'EVENT_CREATOR' as const;
