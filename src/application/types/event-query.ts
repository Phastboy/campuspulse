import { DatetimeType } from '@domain/value-objects';

/**
 * Application-layer query parameters for filtering published events.
 *
 * Used by {@link IEventReader}. The controller maps {@link EventQueryDto}
 * to this type at the HTTP boundary.
 */
export interface EventQuery {
  fromDate?: string;
  toDate?: string;
  type?: DatetimeType;
  limit: number;
  offset: number;
}
