import { EventSubmission, SimilarityMatch } from '@domain/types';

/**
 * Port for the duplicate-detection engine consumed by {@link IngestionService}.
 *
 * Returns {@link SimilarityMatch} — a plain domain type with no HTTP or
 * framework decorators. The controller maps matches to {@link ScoredEvent}
 * (the Swagger-decorated DTO) at the HTTP boundary.
 */
export interface ISimilarityEngine {
  findSimilar(submission: EventSubmission): Promise<SimilarityMatch[]>;
}

export const SIMILARITY_ENGINE = 'SIMILARITY_ENGINE' as const;
