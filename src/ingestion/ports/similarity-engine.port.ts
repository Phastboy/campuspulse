import { EventSubmission } from '@events/domain';
import { ScoredEvent } from '../dto/similarity.dto';

/**
 * Port for the duplicate-detection engine consumed by {@link IngestionService}.
 *
 * {@link IngestionService} depends on this interface rather than on the
 * concrete {@link SimilarityEngine} class. This isolates the pipeline
 * orchestration logic from scoring implementation details and makes the
 * pipeline trivially testable — swap the implementation with a stub.
 *
 * The concrete implementation is {@link SimilarityEngine}, registered under
 * the `SIMILARITY_ENGINE` injection token in {@link IngestionModule}.
 */
export interface ISimilarityEngine {
  /**
   * Finds existing events that are similar to the given submission.
   *
   * Returns candidates above the similarity threshold sorted by score
   * descending. An empty array means no similar events were found.
   *
   * @param submission - The normalised event submission to compare against
   * @returns Similar events with aggregate scores and dimension-level match flags
   */
  findSimilar(submission: EventSubmission): Promise<ScoredEvent[]>;
}

/** Injection token for {@link ISimilarityEngine}. */
export const SIMILARITY_ENGINE = 'SIMILARITY_ENGINE' as const;
