import { DatetimeType } from '@common/constants';

/**
 * Domain-level query parameters for filtering published events.
 *
 * Used by {@link IEventReader} — the port interface — so it must be a domain
 * type with no HTTP-layer imports. The controller maps {@link EventQueryDto}
 * to this type at the HTTP boundary before calling the service.
 */
export interface EventQuery {
  fromDate?: string;
  toDate?: string;
  type?: DatetimeType;
  limit: number;
  offset: number;
}
