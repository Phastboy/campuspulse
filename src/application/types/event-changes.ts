import { EventDateTime } from '@domain/value-objects';

/**
 * Explicit set of fields that can be changed on an existing event.
 *
 * Used by {@link IEventRepository.update} — the adapter receives a plain
 * data object describing what to change, with no assumption about how the
 * persistence layer tracks or detects mutations.
 *
 * All fields are optional: only the fields present in a given call are
 * written. Fields absent from the call are left unchanged by the adapter.
 *
 * This is intentionally a dedicated type rather than `Partial<IEvent>` so
 * that it survives changes to `IEvent` (e.g. adding `createdAt` or `id`
 * never accidentally becomes an updatable field) and communicates clearly
 * that these are the only fields the application layer is allowed to mutate.
 */
export interface EventChanges {
  title?: string;
  datetime?: EventDateTime;
  venue?: string;
  description?: string;
}
