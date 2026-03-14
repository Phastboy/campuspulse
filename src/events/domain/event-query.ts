import { DatetimeType } from '@common/constants';

/**
 * Domain-level query parameters for filtering published events.
 *
 * This type is used by {@link IEventReader} — the port interface — so it
 * must live in `domain/` and not reference HTTP-layer types like
 * `EventQueryDto`. The HTTP DTO maps to this type before calling the port.
 *
 * All fields are optional; omitting them returns all events without filtering.
 */
export interface EventQuery {
  /** Include events on or after this ISO date string. */
  fromDate?: string;

  /** Include events on or before this ISO date string. */
  toDate?: string;

  /** Filter by datetime shape. */
  type?: DatetimeType;

  /** Maximum number of results to return. */
  limit: number;

  /** Number of results to skip. */
  offset: number;
}
