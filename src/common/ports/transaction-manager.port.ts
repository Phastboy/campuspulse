/**
 * Port for running a unit of work inside a database transaction.
 *
 * **Why this exists:**
 * {@link IngestionService} previously injected MikroORM's `EntityManager`
 * directly and called `em.transactional()` — a concrete ORM primitive leaking
 * into an otherwise ORM-agnostic service. That is both a DIP violation (high-level
 * module depending on a low-level detail) and an LSP violation (the interface
 * could not be substituted without pulling in MikroORM).
 *
 * This port captures the intent — "run this work atomically" — without
 * binding the caller to any particular ORM or transaction API.
 *
 * The concrete implementation is {@link MikroOrmTransactionManager},
 * registered under the `TRANSACTION_MANAGER` injection token in
 * {@link EventsModule}.
 *
 * @example
 * // In a service:
 * const event = await this.transactionManager.run(async () => {
 *   return this.eventWriter.create(submission);
 * });
 */
export interface ITransactionManager {
  /**
   * Executes `work` inside a database transaction.
   *
   * If `work` throws, the transaction is rolled back and the error re-thrown.
   * If `work` resolves, the transaction is committed and its return value
   * is returned to the caller.
   *
   * @param work - An async function to execute atomically
   * @returns The value returned by `work`
   */
  run<T>(work: () => Promise<T>): Promise<T>;
}

/** Injection token for {@link ITransactionManager}. */
export const TRANSACTION_MANAGER = 'TRANSACTION_MANAGER' as const;
