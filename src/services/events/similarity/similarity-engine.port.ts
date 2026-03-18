import { EventSubmission, SimilarityMatch } from '@application/types';

/**
 * Port for the duplicate-detection engine.
 *
 * Lives alongside the similarity subsystem — it describes what the engine
 * does, scoped entirely to the events write concern.
 */
export interface ISimilarityEngine {
  findSimilar(submission: EventSubmission): Promise<SimilarityMatch[]>;
}

export const SIMILARITY_ENGINE = 'SIMILARITY_ENGINE' as const;
