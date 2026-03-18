import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Event } from '@infrastructure/entities/event.entity';
import { IEvent } from '@domain/interfaces';
import { EventSubmission } from '@application/types';
import { IEventCreator } from '@ports/event-creator.port';

/**
 * MikroORM adapter for {@link IEventCreator}.
 * Persists new events produced by the ingestion pipeline.
 */
@Injectable()
export class MikroOrmEventCreatorAdapter implements IEventCreator {
  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
    private readonly em: EntityManager,
  ) {}

  async create(submission: EventSubmission): Promise<IEvent> {
    const event = this.repo.create({ ...submission, createdAt: new Date() });
    await this.em.persist(event).flush();
    return event;
  }
}
