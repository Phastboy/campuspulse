import { EventDateTime } from '@domain/value-objects';

/**
 * Domain interface for a campus event.
 *
 * The ORM entity ({@link Event}) implements this — domain dictates shape,
 * infrastructure conforms.
 *
 * `createdBy` is nullable so events that pre-date auth remain valid.
 * Ownership checks only apply when `createdBy` is set.
 */
export interface IEvent {
  id: string;
  title: string;
  datetime: EventDateTime;
  venue: string;
  description?: string;
  /** UUID of the user who created this event. Null for pre-auth events. */
  createdBy: string | null;
  createdAt: Date;
}
