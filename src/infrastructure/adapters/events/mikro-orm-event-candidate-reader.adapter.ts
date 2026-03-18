import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Event } from '@infrastructure/entities/event.entity';
import { EventSummary } from '@application/types';
import { IEventCandidateReader } from '@ports/events/event-candidate-reader.port';

@Injectable()
export class MikroOrmEventCandidateReaderAdapter implements IEventCandidateReader {
  constructor(
    @InjectRepository(Event)
    private readonly repo: EntityRepository<Event>,
  ) {}

  async findCandidatesInWindow(from: Date, to: Date): Promise<EventSummary[]> {
    const events = await this.repo
      .createQueryBuilder('e')
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
}
