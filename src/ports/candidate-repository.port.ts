import { EventSummary } from '@application/types';

export interface ICandidateRepository {
  findCandidatesInWindow(from: Date, to: Date): Promise<EventSummary[]>;
}

export const CANDIDATE_REPOSITORY = 'CANDIDATE_REPOSITORY' as const;
