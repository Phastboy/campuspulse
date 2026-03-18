import { IEvent } from '@domain/interfaces';
import { EventQuery, PaginatedEvents } from '@application/types';

/**
 * Port for all read operations against the event store.
 */
export interface IEventReader {
  findAll(query: EventQuery): Promise<PaginatedEvents>;
  findById(id: string): Promise<IEvent | null>;
  findByVenue(venue: string): Promise<IEvent[]>;
}

export const EVENT_READER = 'EVENT_READER' as const;
