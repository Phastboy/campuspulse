import { IEvent } from '@domain/interfaces';
import { EventQuery, PaginatedEvents } from '@application/types';

export interface IEventReader {
  findAll(query: EventQuery): Promise<PaginatedEvents>;
  findById(id: string): Promise<IEvent | null>;
  findByVenue(venue: string): Promise<IEvent[]>;
}

export const EVENT_READER = 'EVENT_READER' as const;
