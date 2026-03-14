import { EventSummary } from '@events/domain/event-summary';

/**
 * Narrow read-only persistence port for similarity candidate retrieval.
 *
 * Returns {@link EventSummary} projections rather than full `Event` ORM
 * entities — the ingestion module has no business depending on the ORM
 * entity class. The repository implementation projects `Event → EventSummary`
 * before returning.
 */
export interface ICandidateRepository {
  /**
   * Returns event summaries whose datetime date falls within the given window.
   *
   * @param from - Start of the window (inclusive)
   * @param to - End of the window (inclusive)
   * @returns Event summaries in the window, unordered
   */
  findCandidatesInWindow(from: Date, to: Date): Promise<EventSummary[]>;
}

/** Injection token for {@link ICandidateRepository}. */
export const CANDIDATE_REPOSITORY = 'CANDIDATE_REPOSITORY' as const;
