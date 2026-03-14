import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ITransactionManager } from '../../common/ports/transaction-manager.port';

/**
 * MikroORM implementation of {@link ITransactionManager}.
 *
 * Wraps `EntityManager.transactional()` behind the ORM-agnostic
 * {@link ITransactionManager} interface. Callers express intent ("run this
 * atomically") without importing anything from MikroORM.
 *
 * Registered in {@link EventsModule} under the `TRANSACTION_MANAGER` token.
 */
@Injectable()
export class MikroOrmTransactionManager implements ITransactionManager {
  constructor(private readonly em: EntityManager) {}

  /**
   * Executes `work` inside a MikroORM transaction.
   * Commits on success, rolls back and re-throws on failure.
   */
  run<T>(work: () => Promise<T>): Promise<T> {
    return this.em.transactional(work);
  }
}
