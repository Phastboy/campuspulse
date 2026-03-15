import { Event } from '../entities/event.entity';
import { EventSubmission } from '../domain/event-submission';

/**
 * Port for creating new published events.
 *
 * Consumed exclusively by {@link IngestionService} — the only caller that
 * needs to persist new events. Separated from {@link IEventMutator} so
 * ingestion does not depend on `save` or `remove`, which are event lifecycle
 * operations it has no business calling.
 */
export interface IEventCreator {
  /**
   * Creates and persists a new event from the given submission.
   *
   * Participates in any active transaction automatically via the ORM's
   * Unit of Work — callers do not pass transaction context.
   *
   * @param submission - Normalised domain submission
   * @returns The newly created and persisted event
   */
  create(submission: EventSubmission): Promise<Event>;
}

/** Injection token for {@link IEventCreator}. */
export const EVENT_CREATOR = 'EVENT_CREATOR' as const;
