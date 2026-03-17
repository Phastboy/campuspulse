import { ScoredEvent } from './similarity.dto';
import { SubmitEventDto } from './submit-event.dto';

export class NeedsDecisionResult {
  readonly action!: 'needs_decision';
  message!: string;
  similar!: ScoredEvent[];
  originalSubmission!: SubmitEventDto;
}
