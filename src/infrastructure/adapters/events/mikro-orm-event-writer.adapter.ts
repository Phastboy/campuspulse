import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Event } from '@infrastructure/entities/event.entity';
import { EventSubmission, EventChanges } from '@application/types';
import { IEventWriter } from '@ports/events/event-writer.port';

@Injectable()
export class MikroOrmEventWriterAdapter implements IEventWriter {
  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
    private readonly em: EntityManager,
  ) {}

  async create(submission: EventSubmission): Promise<string> {
    const event = this.repo.create({ ...submission, createdAt: new Date() });
    await this.em.persist(event).flush();
    return event.id;
  }

  async update(id: string, changes: EventChanges): Promise<void> {
    const event = await this.repo.findOne({ id });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    this.em.assign(event, changes);
    await this.em.flush();
  }

  async delete(id: string): Promise<void> {
    const event = await this.repo.findOne({ id });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    await this.em.remove(event).flush();
  }
}
