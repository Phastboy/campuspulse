import { EventDateTime } from '@domain/value-objects';

/**
 * Domain interface for a campus event.
 *
 * The ORM entity ({@link Event}) implements this interface — the domain
 * dictates the shape; infrastructure conforms to it.
 */
export interface IEvent {
  id: string;
  title: string;
  datetime: EventDateTime;
  venue: string;
  description?: string;
  createdAt: Date;
}
