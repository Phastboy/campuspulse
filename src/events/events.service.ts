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

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: EntityRepository<Event>,
    private readonly em: EntityManager,
  ) {}

  async findAll(query: EventQueryDto): Promise<{
    items: Event[];
    total: number;
    limit: number;
    offset: number;
  }> {
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

    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async findOne(id: string): Promise<Event> {
    this.logger.log(`Finding event by ID: ${id}`);

    const event = await this.eventRepo.findOne({ id });

    if (!event) {
      this.logger.warn(`Event not found: ${id}`);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findByVenue(venue: string): Promise<Event[]> {
    this.logger.log(`Finding events at venue: ${venue}`);

    const events = await this.eventRepo.find({
      venue: { $ilike: `%${venue}%` },
    });

    return events;
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.em.remove(event).flush();
  }

  async update(id: string, updateData: UpdateEventDto): Promise<Event> {
    this.logger.log(`Updating event: ${id}`);

    const event = await this.eventRepo.findOne({ id });

    if (!event) {
      this.logger.warn(`Event not found for update: ${id}`);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    try {
      // Update simple fields if provided
      if (updateData.title !== undefined) {
        event.title = updateData.title;
      }

      if (updateData.venue !== undefined) {
        event.venue = updateData.venue;
      }

      if (updateData.description !== undefined) {
        event.description = updateData.description;
      }

      // Handle datetime updates with proper type narrowing
      if (
        updateData.type ||
        updateData.date ||
        updateData.endTime ||
        updateData.endDate ||
        updateData.startTime
      ) {
        const newType = updateData.type ?? event.datetime.type;

        if (newType === 'specific') {
          // Building a SpecificDateTime
          const current = event.datetime as SpecificDateTime;

          // When switching to specific type, ensure we have a startTime
          if (
            newType !== event.datetime.type &&
            !updateData.startTime &&
            !(current as any).startTime
          ) {
            throw new BadRequestException(
              'startTime is required when creating or updating to a specific datetime event',
            );
          }

          event.datetime = {
            type: 'specific',
            date: updateData.date ? new Date(updateData.date) : current.date,
            startTime: updateData.startTime
              ? new Date(updateData.startTime)
              : (current as SpecificDateTime).startTime,
            endTime: updateData.endTime
              ? new Date(updateData.endTime)
              : (current as SpecificDateTime).endTime,
          };
        } else {
          // Building an AllDayDate
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
    } catch (error) {
      this.logger.error(`Failed to update event ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update event: ${error.message}`);
    }
  }
}
