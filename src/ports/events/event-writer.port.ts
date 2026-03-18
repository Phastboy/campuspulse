import { EventSubmission, EventChanges } from '@application/types';

/**
 * Port for all write operations against the event store.
 *
 * Create, update, and delete are all writes — grouped here because they
 * share the same consumer boundary, not split by operation subtype.
 *
 * - `create` returns the new event's ID only — no full entity materialisation
 *   assumed across all persistence layers.
 * - `update` takes explicit {@link EventChanges} by ID — no entity references,
 *   no change-tracker assumptions.
 * - `delete` takes an ID — adapter locates and removes the record itself.
 */
export interface IEventWriter {
  /** `createdBy` is the authenticated user's ID, or `null` for anonymous submissions. */
  create(submission: EventSubmission, createdBy: string | null): Promise<string>;
  update(id: string, changes: EventChanges): Promise<void>;
  delete(id: string): Promise<void>;
}

export const EVENT_WRITER = 'EVENT_WRITER' as const;
