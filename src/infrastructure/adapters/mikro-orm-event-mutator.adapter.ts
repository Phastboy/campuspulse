import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { IEvent } from '@domain/interfaces';
import { IEventMutator } from '@ports/event-mutator.port';

/**
 * MikroORM adapter for {@link IEventMutator}.
 * Flushes mutations and removes existing event records.
 */
@Injectable()
export class MikroOrmEventMutatorAdapter implements IEventMutator {
  constructor(private readonly em: EntityManager) {}

  async save(_event: IEvent): Promise<void> {
    await this.em.flush();
  }

  async remove(event: IEvent): Promise<void> {
    await this.em.remove(event).flush();
  }
}
