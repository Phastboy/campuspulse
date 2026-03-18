/**
 * Port for running a unit of work inside a database transaction.
 */
export interface ITransactionManager {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export const TRANSACTION_MANAGER = 'TRANSACTION_MANAGER' as const;
