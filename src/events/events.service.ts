import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { wrap } from '@mikro-orm/core';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: EntityRepository<Event>,
    private readonly em: EntityManager,
  ) { }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    // Create entity instance first, then assign
    const event = new Event();

    // Assign all DTO properties
    Object.assign(event, {
      ...createEventDto,
      date: new Date(createEventDto.date),
      // status defaults to 'pending' in entity
      // createdAt/updatedAt are handled by entity hooks
    });

    await this.em.persist(event).flush();
    return event;
  }

  async findAll(query: EventQueryDto): Promise<{ items: Event[]; total: number }> {
    const qb = this.eventRepository.createQueryBuilder('e');

    // Apply filters
    if (query.category) {
      qb.andWhere({ category: query.category });
    }

    if (query.status) {
      qb.andWhere({ status: query.status });
    } else {
      // Default to showing only live events if no status specified
      qb.andWhere({ status: 'live' });
    }

    if (query.location) {
      qb.andWhere({ locationTag: query.location });
    }

    if (query.fromDate || query.toDate) {
      if (query.fromDate && query.toDate) {
        qb.andWhere({
          date: {
            $gte: new Date(query.fromDate),
            $lte: new Date(query.toDate),
          },
        });
      } else if (query.fromDate) {
        qb.andWhere({ date: { $gte: new Date(query.fromDate) } });
      } else if (query.toDate) {
        qb.andWhere({ date: { $lte: new Date(query.toDate) } });
      }
    }

    // Get total count
    const totalCount = await qb.clone().count('id', true);

    // Apply pagination and ordering
    const items = await qb
      .orderBy({ date: 'ASC' })
      .limit(query.limit, query.offset)
      .getResult();

    return {
      items,
      total: totalCount,
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ id });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findUpcomingThisWeek(): Promise<Event[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Reset time parts for accurate date comparison
    today.setHours(0, 0, 0, 0);
    nextWeek.setHours(23, 59, 59, 999);

    return await this.eventRepository.find({
      date: {
        $gte: today,
        $lte: nextWeek,
      },
      status: 'live',
    }, {
      orderBy: { date: 'ASC' },
    });
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    // Create update object with date conversion if present
    const updateData: any = { ...updateEventDto };
    if (updateEventDto.date) {
      updateData.date = new Date(updateEventDto.date);
    }

    wrap(event).assign(updateData);
    await this.em.flush();

    return event;
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.em.remove(event).flush();
  }

  async getEventStats(): Promise<any[]> {
    const knex = this.em.getKnex();

    const stats = await knex('event')
      .select('category')
      .count('id as count')
      .min('date as next_event')
      .groupBy('category');

    return stats;
  }
}
