import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ITransactionManager } from '@ports/transaction-manager.port';

/**
 * MikroORM adapter for {@link ITransactionManager}.
 * Wraps EntityManager.transactional() behind the ORM-agnostic port interface.
 */
@Injectable()
export class MikroOrmTransactionManagerAdapter implements ITransactionManager {
  constructor(private readonly em: EntityManager) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.em.transactional(work);
  }
}
