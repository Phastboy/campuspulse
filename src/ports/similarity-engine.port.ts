import { EventSubmission, SimilarityMatch } from '@application/types';

export interface ISimilarityEngine {
  findSimilar(submission: EventSubmission): Promise<SimilarityMatch[]>;
}

export const SIMILARITY_ENGINE = 'SIMILARITY_ENGINE' as const;
