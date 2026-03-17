import { IEvent } from '@domain/interfaces';

/**
 * Paginated result returned by {@link IEventReader.findAll}.
 *
 * Lives in `domain/types/` because it is a shared contract between the port
 * interface, the repository implementation, and the service — defining it
 * inside any one of those would create an upward import.
 */
export interface PaginatedEvents {
  items: IEvent[];
  total: number;
  limit: number;
  offset: number;
}
