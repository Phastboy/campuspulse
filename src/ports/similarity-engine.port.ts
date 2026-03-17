import { EventSubmission } from '@domain/types';
import { ScoredEvent } from '@dto/similarity.dto';

/**
 * Port for the duplicate-detection engine consumed by {@link IngestionService}.
 *
 * {@link IngestionService} depends on this interface rather than on the
 * concrete {@link SimilarityEngine}, isolating pipeline orchestration from
 * scoring implementation details.
 */
export interface ISimilarityEngine {
  findSimilar(submission: EventSubmission): Promise<ScoredEvent[]>;
}

export const SIMILARITY_ENGINE = 'SIMILARITY_ENGINE' as const;
