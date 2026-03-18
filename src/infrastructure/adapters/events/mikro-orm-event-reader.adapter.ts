import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { raw } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Event } from '@infrastructure/entities/event.entity';
import { IEvent } from '@domain/interfaces';
import { EventQuery, PaginatedEvents } from '@application/types';
import { IEventReader } from '@ports/events/event-reader.port';

@Injectable()
export class MikroOrmEventReaderAdapter implements IEventReader {
  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
  ) {}

  async findAll(query: EventQuery): Promise<PaginatedEvents> {
    const qb = this.repo.createQueryBuilder('e');
    if (query.fromDate)
      qb.andWhere(`(e.datetime->>'date')::timestamptz >= ?`, [query.fromDate]);
    if (query.toDate)
      qb.andWhere(`(e.datetime->>'date')::timestamptz <= ?`, [query.toDate]);
    if (query.type)
      qb.andWhere(`e.datetime->>'type' = ?`, [query.type]);

    const total = await qb.clone().count('id', true).getCount();
    const items = await qb
      .select('*')
      .orderBy({ [raw(`(e.datetime->>'date')::timestamptz`)]: 'ASC' })
      .limit(query.limit)
      .offset(query.offset)
      .getResult();

    return { items, total, limit: query.limit, offset: query.offset };
  }

  findById(id: string): Promise<IEvent | null> {
    return this.repo.findOne({ id });
  }

  findByVenue(venue: string): Promise<IEvent[]> {
    return this.repo.find({ venue: { $ilike: `%${venue}%` } });
  }
}
