import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Event } from './entities/event.entity';
import { EventQuery } from './domain/event-query';
import { PaginatedEvents } from './domain/paginated-events';
import { InvalidDatetimeError } from './domain/invalid-datetime.error';
import { UpdateEventDto } from './dto/update-event.dto';
import { type IEventReader, EVENT_READER } from './ports/event-reader.port';
import { type IEventWriter, EVENT_WRITER } from './ports/event-writer.port';
import { EventDateTimeAssembler } from './mappers/event-datetime.assembler';

/**
 * Application service for published event operations.
 *
 * Translates HTTP-layer types (DTOs) into domain-layer types (EventQuery)
 * before calling ports — the port interface stays clean of HTTP concerns.
 * Catches {@link InvalidDatetimeError} from the domain assembler and
 * re-throws as {@link BadRequestException} — HTTP translation happens here,
 * at the boundary, not inside domain logic.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject(EVENT_READER)
    private readonly eventReader: IEventReader,
    @Inject(EVENT_WRITER)
    private readonly eventWriter: IEventWriter,
    private readonly datetimeAssembler: EventDateTimeAssembler,
  ) {}

  async findAll(query: EventQuery): Promise<PaginatedEvents> {
    this.logger.log(`Finding events with query: ${JSON.stringify(query)}`);
    const result = await this.eventReader.findAll(query);
    this.logger.log(
      `Found ${result.items.length} events (total: ${result.total})`,
    );
    return result;
  }

  async findOne(id: string): Promise<Event> {
    this.logger.log(`Finding event by ID: ${id}`);
    const event = await this.eventReader.findById(id);

    if (!event) {
      this.logger.warn(`Event not found: ${id}`);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findByVenue(venue: string): Promise<Event[]> {
    this.logger.log(`Finding events at venue: ${venue}`);
    return this.eventReader.findByVenue(venue);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventWriter.remove(event);
  }

  async update(id: string, updateData: UpdateEventDto): Promise<Event> {
    this.logger.log(`Updating event: ${id}`);

    const event = await this.eventReader.findById(id);
    if (!event) {
      this.logger.warn(`Event not found for update: ${id}`);
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    try {
      if (updateData.title !== undefined) event.title = updateData.title;
      if (updateData.venue !== undefined) event.venue = updateData.venue;
      if (updateData.description !== undefined)
        event.description = updateData.description;

      const hasDatetimeUpdate =
        updateData.type ||
        updateData.date ||
        updateData.startTime ||
        updateData.endTime ||
        updateData.endDate;

      if (hasDatetimeUpdate) {
        event.datetime = this.datetimeAssembler.applyUpdate(
          event.datetime,
          updateData,
        );
      }

      await this.eventWriter.save(event);
      this.logger.log(`Event ${id} updated successfully`);
      return event;
    } catch (error: unknown) {
      // Translate domain errors to HTTP errors at this boundary
      if (error instanceof InvalidDatetimeError) {
        throw new BadRequestException(error.message);
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update event ${id}: ${message}`);
      throw new BadRequestException(`Failed to update event: ${message}`);
    }
  }
}
