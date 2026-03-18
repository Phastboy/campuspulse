import { IEvent } from '@domain/interfaces';

/**
 * Paginated result returned by {@link IEventReader.findAll}.
 */
export interface PaginatedEvents {
  items: IEvent[];
  total: number;
  limit: number;
  offset: number;
}
