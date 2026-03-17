import { EventSummary } from '@domain/types';

/**
 * Narrow read-only port for similarity candidate retrieval.
 *
 * Returns {@link EventSummary} projections — ingestion has no business
 * depending on the full ORM entity. The repository handles the projection.
 */
export interface ICandidateRepository {
  findCandidatesInWindow(from: Date, to: Date): Promise<EventSummary[]>;
}

export const CANDIDATE_REPOSITORY = 'CANDIDATE_REPOSITORY' as const;
