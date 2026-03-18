import { SimilarityMatch } from './similarity-match';
import { EventSubmission } from './event-submission';

export interface CreatedOutcome {
  action: 'created';
  eventId: string;
  message: string;
}

export interface LinkedOutcome {
  action: 'linked';
  eventId: string;
  message: string;
}

export interface NeedsDecisionOutcome {
  action: 'needs_decision';
  message: string;
  similar: SimilarityMatch[];
  originalSubmission: EventSubmission;
}

/** Discriminated union of all application-layer ingestion outcomes. */
export type IngestionOutcome =
  | CreatedOutcome
  | LinkedOutcome
  | NeedsDecisionOutcome;
