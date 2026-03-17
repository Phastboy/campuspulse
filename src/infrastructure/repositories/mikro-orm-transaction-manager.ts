import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ITransactionManager } from '@ports/transaction-manager.port';

/**
 * MikroORM implementation of {@link ITransactionManager}.
 *
 * Wraps `EntityManager.transactional()` behind the ORM-agnostic interface.
 * Callers express intent ("run this atomically") without importing MikroORM.
 */
@Injectable()
export class MikroOrmTransactionManager implements ITransactionManager {
  constructor(private readonly em: EntityManager) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.em.transactional(work);
  }
}
