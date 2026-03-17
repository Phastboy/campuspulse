import { IEvent } from '@domain/interfaces';

/**
 * Port for mutating existing published events.
 *
 * Consumed exclusively by {@link EventsService}. Separated from
 * {@link IEventCreator} so lifecycle operations are not exposed to ingestion.
 */
export interface IEventMutator {
  save(event: IEvent): Promise<void>;
  remove(event: IEvent): Promise<void>;
}

export const EVENT_MUTATOR = 'EVENT_MUTATOR' as const;
