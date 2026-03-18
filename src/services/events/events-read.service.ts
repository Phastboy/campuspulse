import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IEvent } from '@domain/interfaces';
import { EventQuery, PaginatedEvents } from '@application/types';
import {
  type IEventReader,
  EVENT_READER,
} from '@ports/events/event-reader.port';

@Injectable()
export class EventsReadService {
  private readonly logger = new Logger(EventsReadService.name);

  constructor(
    @Inject(EVENT_READER) private readonly eventReader: IEventReader,
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
}
