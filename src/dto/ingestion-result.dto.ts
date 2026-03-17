import { CreatedResult } from './created-result';
import { LinkedResult } from './linked-result';
import { NeedsDecisionResult } from './needs-decision-result';

export { CreatedResult, LinkedResult, NeedsDecisionResult };

/**
 * Discriminated union of all possible ingestion pipeline outcomes.
 * Narrow on `action` to access shape-specific fields.
 */
export type IngestionResult =
  | CreatedResult
  | LinkedResult
  | NeedsDecisionResult;
