import { Event } from '../entities/event.entity';

/**
 * Port for mutating existing published events.
 *
 * Consumed exclusively by {@link EventsService}, which updates and removes
 * events that already exist. Separated from {@link IEventCreator} so
 * lifecycle operations are not exposed to the ingestion pipeline.
 */
export interface IEventMutator {
  /**
   * Commits pending mutations on the given event to the database.
   *
   * The caller mutates the entity directly before calling this —
   * MikroORM's Unit of Work tracks the changes automatically.
   *
   * @param event - The mutated event to persist
   */
  save(event: Event): Promise<void>;

  /**
   * Permanently removes an event from the database.
   *
   * @param event - The event to delete
   */
  remove(event: Event): Promise<void>;
}

/** Injection token for {@link IEventMutator}. */
export const EVENT_MUTATOR = 'EVENT_MUTATOR' as const;
