import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { raw } from '@mikro-orm/core';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Event } from './entities/event.entity';
import { EventQueryDto } from './dto/event-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AllDayDate, SpecificDateTime } from '@common';

/** Shape returned by {@link EventsService.findAll}. */
export interface PaginatedEvents {
  items: Event[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Service responsible for all published event operations.
 *
 * Events in this service are already live — they have passed through the
 * ingestion pipeline (or been created directly by a curator). This service
 * does not handle submission or moderation; that is the responsibility of
 * {@link IngestionService}.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: EntityRepository<Event>,
    private readonly em: EntityManager,
  ) {}

  /**
   * Returns a paginated, optionally filtered list of published events.
   *
   * Results are ordered by event date ascending. All filter parameters are
   * optional — omitting them returns all events.
   *
   * @param query - Date range, type filter, and pagination options
   * @returns Paginated result with items, total count, limit, and offset
   */
  async findAll(query: EventQueryDto): Promise<PaginatedEvents> {
    this.logger.log(`Finding events with query: ${JSON.stringify(query)}`);

    const qb = this.eventRepo.createQueryBuilder('e');

    if (query.fromDate) {
      qb.andWhere(`(e.datetime->>'date')::timestamptz >= ?`, [query.fromDate]);
    }
    if (query.toDate) {
      qb.andWhere(`(e.datetime->>'date')::timestamptz <= ?`, [query.toDate]);
    }
    if (query.type) {
      qb.andWhere(`e.datetime->>'type' = ?`, [query.type]);
    }

    const total = await qb.clone().count('id', true);

    const items = await qb
      .select('*')
      .orderBy({ [raw(`(e.datetime->>'date')::timestamptz`)]: 'ASC' })
      .limit(query.limit)
      .offset(query.offset)
      .getResult();

    this.logger.log(`Found ${items.length} events (total: ${total})`);

    return { items, total, limit: query.limit, offset: query.offset };
  }

  /**
   * Returns a single event by its UUID.
   *
   * @param id - The event's UUID
   * @returns The matching event
   * @throws {NotFoundException} When no event exists with the given ID
   */
  async findOne(id: string): Promise<Event> {
    this.logger.log(`Finding event by ID: ${id}`);

    const event = await this.eventRepo.findOne({ id });

    if (!event) {
      this.logger.warn(`Event not found: ${id}`);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**
   * Returns all events whose venue name matches the given string.
   *
   * Uses a case-insensitive partial match — `"trust"` will match `"Trust Hall"`.
   *
   * @param venue - Partial or full venue name to search for
   * @returns All matching events (may be empty)
   */
  async findByVenue(venue: string): Promise<Event[]> {
    this.logger.log(`Finding events at venue: ${venue}`);
    return this.eventRepo.find({ venue: { $ilike: `%${venue}%` } });
  }

  /**
   * Permanently deletes an event from the database.
   *
   * This is a hard delete — there is no soft-delete or recovery mechanism.
   * Prefer updating `description` to note a cancellation rather than deleting,
   * so students who already saved the event still find a record.
   *
   * @param id - UUID of the event to delete
   * @throws {NotFoundException} When no event exists with the given ID
   */
  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.em.remove(event).flush();
  }

  /**
   * Applies a partial update to an existing event.
   *
   * Only fields present in `updateData` are modified. Datetime updates
   * require the full datetime shape to be re-specified — partial datetime
   * patching (e.g. changing only `venue`) is safe and leaves `datetime`
   * untouched.
   *
   * When switching from `all-day` to `specific`, `startTime` must be provided.
   *
   * @param id - UUID of the event to update
   * @param updateData - Fields to update (all optional)
   * @returns The updated event
   * @throws {NotFoundException} When no event exists with the given ID
   * @throws {BadRequestException} When switching to `specific` type without a `startTime`
   */
  async update(id: string, updateData: UpdateEventDto): Promise<Event> {
    this.logger.log(`Updating event: ${id}`);

    const event = await this.eventRepo.findOne({ id });

    if (!event) {
      this.logger.warn(`Event not found for update: ${id}`);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    try {
      if (updateData.title !== undefined) event.title = updateData.title;
      if (updateData.venue !== undefined) event.venue = updateData.venue;
      if (updateData.description !== undefined) {
        event.description = updateData.description;
      }

      const hasDatetimeUpdate =
        updateData.type ||
        updateData.date ||
        updateData.endTime ||
        updateData.endDate ||
        updateData.startTime;

      if (hasDatetimeUpdate) {
        const newType = updateData.type ?? event.datetime.type;

        if (newType === 'specific') {
          const current = event.datetime as SpecificDateTime;

          // Guard: switching from all-day to specific requires a startTime
          const isSwitchingType = newType !== event.datetime.type;
          const hasStartTime = !!updateData.startTime || !!current.startTime;
          if (isSwitchingType && !hasStartTime) {
            throw new BadRequestException(
              'startTime is required when switching to a specific datetime event',
            );
          }

          event.datetime = {
            type: 'specific',
            date: updateData.date ? new Date(updateData.date) : current.date,
            startTime: updateData.startTime
              ? new Date(updateData.startTime)
              : current.startTime,
            endTime: updateData.endTime
              ? new Date(updateData.endTime)
              : current.endTime,
          };
        } else {
          const current = event.datetime as AllDayDate;
          event.datetime = {
            type: 'all-day',
            date: updateData.date ? new Date(updateData.date) : current.date,
            endDate: updateData.endDate
              ? new Date(updateData.endDate)
              : current.endDate,
          };
        }
      }

      await this.em.flush();
      this.logger.log(`Event ${id} updated successfully`);
      return event;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update event ${id}: ${message}`);
      throw new BadRequestException(`Failed to update event: ${message}`);
    }
  }
}
