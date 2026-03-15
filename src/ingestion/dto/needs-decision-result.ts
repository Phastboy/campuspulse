import { ScoredEvent } from './similarity.dto';
import { SubmitEventDto } from './submit-event.dto';

/**
 * Result returned when similar events exist but the pipeline cannot
 * automatically determine if they are duplicates.
 *
 * The client must resolve the ambiguity via `POST /ingestion/confirm`.
 * Pass `originalSubmission` unchanged to that endpoint along with a `decision`.
 */
export class NeedsDecisionResult {
  readonly action!: 'needs_decision';
  message!: string;
  similar!: ScoredEvent[];
  originalSubmission!: SubmitEventDto;
}
