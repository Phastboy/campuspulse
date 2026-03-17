import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IEvent } from '@domain/interfaces';
import { EventQuery, PaginatedEvents } from '@domain/types';
import { InvalidDatetimeError } from '@domain/errors';
import { UpdateEventDto } from '@dto/update-event.dto';
import { type IEventReader, EVENT_READER } from '@ports/event-reader.port';
import { type IEventMutator, EVENT_MUTATOR } from '@ports/event-mutator.port';
import { EventDateTimeAssembler } from '@mappers/event-datetime.assembler';

/**
 * Application service for published event operations.
 *
 * Depends on {@link IEventReader} and {@link IEventMutator} via port tokens.
 * Never imports from infrastructure directly.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject(EVENT_READER) private readonly eventReader: IEventReader,
    @Inject(EVENT_MUTATOR) private readonly eventMutator: IEventMutator,
    private readonly datetimeAssembler: EventDateTimeAssembler,
  ) {}

  async findAll(query: EventQuery): Promise<PaginatedEvents> {
    this.logger.log(`Finding events: ${JSON.stringify(query)}`);
    return this.eventReader.findAll(query);
  }

  async findOne(id: string): Promise<IEvent> {
    const event = await this.eventReader.findById(id);
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    return event;
  }

  async findByVenue(venue: string): Promise<IEvent[]> {
    return this.eventReader.findByVenue(venue);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventMutator.remove(event);
  }

  async update(id: string, updateData: UpdateEventDto): Promise<IEvent> {
    const event = await this.eventReader.findById(id);
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

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

      await this.eventMutator.save(event);
      return event;
    } catch (error: unknown) {
      if (error instanceof InvalidDatetimeError) {
        throw new BadRequestException(error.message);
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to update event: ${message}`);
    }
  }
}
