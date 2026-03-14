import { Event } from '../entities/event.entity';

/**
 * Paginated result returned by {@link IEventReader.findAll}.
 *
 * Lives in `domain/` because it is a shared contract between the port
 * interface, the repository implementation, and the service — it must not
 * be defined inside any single one of those layers.
 */
export interface PaginatedEvents {
  items: Event[];
  total: number;
  limit: number;
  offset: number;
}
