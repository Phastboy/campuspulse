import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { raw } from '@mikro-orm/core';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Event } from '../entities/event.entity';
import { EventQuery } from '../domain/event-query';
import { EventSummary } from '../domain/event-summary';
import { EventSubmission } from '../domain/event-submission';
import { PaginatedEvents } from '../domain/paginated-events';
import { IEventReader } from '../ports/event-reader.port';
import { IEventWriter } from '../ports/event-writer.port';
import { ICandidateRepository } from '../../ingestion/ports/candidate-repository.port';

/**
 * MikroORM implementation of {@link IEventReader}, {@link IEventWriter},
 * and {@link ICandidateRepository}.
 *
 * The only class in the codebase that imports MikroORM. All imports are from
 * the `events` module's own domain or from ingestion ports — no cross-module
 * service or DTO imports.
 *
 * `findCandidatesInWindow` returns {@link EventSummary} projections, honouring
 * the updated {@link ICandidateRepository} contract that no longer exposes the
 * ORM entity to ingestion consumers.
 */
@Injectable()
export class MikroOrmEventRepository
  implements IEventReader, IEventWriter, ICandidateRepository
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

    const total = await qb.clone().count('id', true);

    const items = await qb
      .select('*')
      .orderBy({ [raw(`(e.datetime->>'date')::timestamptz`)]: 'ASC' })
      .limit(query.limit)
      .offset(query.offset)
      .getResult();

    return { items, total, limit: query.limit, offset: query.offset };
  }

  async findById(id: string): Promise<Event | null> {
    return this.repo.findOne({ id });
  }

  async findByVenue(venue: string): Promise<Event[]> {
    return this.repo.find({ venue: { $ilike: `%${venue}%` } });
  }

  // ── ICandidateRepository ──────────────────────────────────────────────────

  async findCandidatesInWindow(from: Date, to: Date): Promise<EventSummary[]> {
    const qb = this.repo.createQueryBuilder('e');
    const events = await qb
      .select('*')
      .where(`(e.datetime->>'date')::timestamptz BETWEEN ? AND ?`, [from, to])
      .getResult();

    // Project to EventSummary — ingestion never receives ORM entities
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      datetime: e.datetime,
      venue: e.venue,
    }));
  }

  // ── IEventWriter ──────────────────────────────────────────────────────────

  async create(submission: EventSubmission): Promise<Event> {
    const event = this.repo.create({ ...submission, createdAt: new Date() });
    await this.em.persist(event).flush();
    return event;
  }

  async save(): Promise<void> {
    await this.em.flush();
  }

  async remove(event: Event): Promise<void> {
    await this.em.remove(event).flush();
  }
}
