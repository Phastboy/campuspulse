/**
 * Port for running a unit of work inside a database transaction.
 *
 * Captures the intent — "run this work atomically" — without binding the
 * caller to any particular ORM or transaction API.
 *
 * The concrete implementation is {@link MikroOrmTransactionManager},
 * registered under the `TRANSACTION_MANAGER` token in {@link EventsModule}.
 */
export interface ITransactionManager {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export const TRANSACTION_MANAGER = 'TRANSACTION_MANAGER' as const;
