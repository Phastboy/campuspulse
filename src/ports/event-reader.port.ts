import { IEvent } from '@domain/interfaces';
import { EventQuery } from '@domain/types';
import { PaginatedEvents } from '@domain/types';

/**
 * Read-only persistence port for published events.
 *
 * All types are domain types — no HTTP DTOs, no ORM entities.
 */
export interface IEventReader {
  findAll(query: EventQuery): Promise<PaginatedEvents>;
  findById(id: string): Promise<IEvent | null>;
  findByVenue(venue: string): Promise<IEvent[]>;
}

export const EVENT_READER = 'EVENT_READER' as const;
