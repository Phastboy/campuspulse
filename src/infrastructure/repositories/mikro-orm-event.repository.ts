import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { raw } from '@mikro-orm/core';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Event } from '@infrastructure/entities/event.entity';
import { IEvent } from '@domain/interfaces';
import {
  EventQuery,
  EventSummary,
  EventSubmission,
  PaginatedEvents,
} from '@domain/types';
import { IEventReader } from '@ports/event-reader.port';
import { IEventCreator } from '@ports/event-creator.port';
import { IEventMutator } from '@ports/event-mutator.port';
import { ICandidateRepository } from '@ports/candidate-repository.port';

/**
 * MikroORM implementation of all four event persistence ports.
 *
 * This is the only class in the codebase that imports MikroORM.
 * Registered under four separate tokens so each consumer receives only the
 * interface it needs (Interface Segregation Principle).
 *
 * Swapping the ORM means rewriting this class and nothing else.
 */
@Injectable()
export class MikroOrmEventRepository
  implements IEventReader, IEventCreator, IEventMutator, ICandidateRepository
{
  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
    private readonly em: EntityManager,
  ) {}

  // ── IEventReader ──────────────────────────────────────────────────────────

  async findAll(query: EventQuery): Promise<PaginatedEvents> {
    const qb = this.repo.createQueryBuilder('e');

    if (query.fromDate) {
      qb.andWhere(`(e.datetime->>'date')::timestamptz >= ?`, [query.fromDate]);
    }
    if (query.toDate) {
      qb.andWhere(`(e.datetime->>'date')::timestamptz <= ?`, [query.toDate]);
    }
    if (query.type) {
      qb.andWhere(`e.datetime->>'type' = ?`, [query.type]);
    }

    const total = await qb.clone().count('id', true).getCount();
    const items = await qb
      .select('*')
      .orderBy({ [raw(`(e.datetime->>'date')::timestamptz`)]: 'ASC' })
      .limit(query.limit)
      .offset(query.offset)
      .getResult();

    return { items, total, limit: query.limit, offset: query.offset };
  }

  async findById(id: string): Promise<IEvent | null> {
    return this.repo.findOne({ id });
  }

  async findByVenue(venue: string): Promise<IEvent[]> {
    return this.repo.find({ venue: { $ilike: `%${venue}%` } });
  }

  // ── ICandidateRepository ──────────────────────────────────────────────────

  async findCandidatesInWindow(from: Date, to: Date): Promise<EventSummary[]> {
    const qb = this.repo.createQueryBuilder('e');
    const events = await qb
      .select('*')
      .where(`(e.datetime->>'date')::timestamptz BETWEEN ? AND ?`, [from, to])
      .getResult();

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      datetime: e.datetime,
      venue: e.venue,
    }));
  }

  // ── IEventCreator ─────────────────────────────────────────────────────────

  async create(submission: EventSubmission): Promise<IEvent> {
    const event = this.repo.create({ ...submission, createdAt: new Date() });
    await this.em.persist(event).flush();
    return event;
  }

  // ── IEventMutator ─────────────────────────────────────────────────────────

  async save(): Promise<void> {
    await this.em.flush();
  }

  async remove(event: IEvent): Promise<void> {
    await this.em.remove(event).flush();
  }
}
