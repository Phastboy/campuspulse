import { EventSummary } from '@application/types';

/**
 * Specialised read port for the similarity engine.
 *
 * Kept separate from {@link IEventReader} by ISP: EventsReadService never
 * needs a candidate window; SimilarityEngine never needs paginated listings.
 */
export interface IEventCandidateReader {
  findCandidatesInWindow(from: Date, to: Date): Promise<EventSummary[]>;
}

export const EVENT_CANDIDATE_READER = 'EVENT_CANDIDATE_READER' as const;
