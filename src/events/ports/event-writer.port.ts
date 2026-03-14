import { Event } from '../entities/event.entity';
import { EventSubmission } from '../domain/event-submission';

/**
 * Write-only persistence port for published events.
 *
 * Separated from {@link IEventReader} so write consumers are not forced to
 * depend on query methods they will never call (Interface Segregation).
 *
 * All types are local to the `events` module — no cross-module imports.
 */
export interface IEventWriter {
  /**
   * Creates and persists a new event from the given submission.
   * Participates in any active transaction automatically via the ORM's
   * Unit of Work — callers do not pass transaction context.
   */
  create(submission: EventSubmission): Promise<Event>;

  /**
   * Commits pending mutations on the given event to the database.
   * The caller mutates the entity directly before calling this.
   */
  save(event: Event): Promise<void>;

  /** Permanently removes an event from the database. */
  remove(event: Event): Promise<void>;
}

/** Injection token for {@link IEventWriter}. */
export const EVENT_WRITER = 'EVENT_WRITER' as const;
