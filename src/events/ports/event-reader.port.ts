import { Event } from '../entities/event.entity';
import { EventQuery } from '../domain/event-query';
import { PaginatedEvents } from '../domain/paginated-events';

/**
 * Read-only persistence port for published events.
 *
 * All types used in this interface are domain types — no HTTP DTOs, no
 * service imports, no ORM classes. This ensures the port is a stable
 * abstraction that can be implemented by any persistence technology.
 */
export interface IEventReader {
  /**
   * Returns a paginated, date-filtered list of published events ordered by
   * event date ascending.
   *
   * @param query - Domain-level filter and pagination parameters
   */
  findAll(query: EventQuery): Promise<PaginatedEvents>;

  /**
   * Returns a single event by its UUID, or `null` if not found.
   */
  findById(id: string): Promise<Event | null>;

  /**
   * Returns all events whose venue partially matches the given string
   * (case-insensitive).
   */
  findByVenue(venue: string): Promise<Event[]>;
}

/** Injection token for {@link IEventReader}. */
export const EVENT_READER = 'EVENT_READER' as const;
