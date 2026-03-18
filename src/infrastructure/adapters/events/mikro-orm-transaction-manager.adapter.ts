import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ITransactionManager } from '@ports/transaction-manager.port';

@Injectable()
export class MikroOrmTransactionManagerAdapter implements ITransactionManager {
  constructor(private readonly em: EntityManager) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.em.transactional(work);
  }
}
