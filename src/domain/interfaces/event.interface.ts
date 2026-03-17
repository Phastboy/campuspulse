import { EventDateTime } from '@common/datetime';

/**
 * Domain interface for a campus event.
 *
 * Defines the contract that every event entity must satisfy, independent of
 * any persistence technology. The ORM entity ({@link Event}) implements this
 * interface — the domain dictates the shape, infrastructure conforms to it.
 *
 * This keeps the domain layer in control: if the ORM entity ever diverges from
 * what domain logic expects, TypeScript catches it at compile time.
 */
export interface IEvent {
  /** Unique identifier (UUID). */
  id: string;

  /** Human-readable event title. */
  title: string;

  /**
   * Structured datetime stored as a discriminated union.
   * Narrow on `datetime.type` before accessing shape-specific fields.
   */
  datetime: EventDateTime;

  /** Venue name as commonly known on campus. */
  venue: string;

  /** Optional free-text description. */
  description?: string;

  /** Timestamp of record creation. */
  createdAt: Date;
}
