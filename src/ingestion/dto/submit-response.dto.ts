import { EventDateTime } from '@common';
import { SubmitEventDto } from './submit-event.dto';

export class SubmitResponseDto {
  /**
   * - 'created': A new event was created
   * - 'needs_decision': Similar events found, user must decide
   * - 'linked': Submission matched an existing event exactly and was auto-linked
   */
  action!: 'created' | 'needs_decision' | 'linked';

  message!: string;

  // Present when action = 'created' or 'linked'
  eventId?: string;

  // Present when action = 'needs_decision'
  similar?: Array<{
    event: {
      id: string;
      title: string;
      datetime: EventDateTime;
      venue: string;
    };
    score: number;
    matches: Record<string, boolean>;
    ruleScores?: Record<string, number>;
  }>;

  // Present when action = 'needs_decision'
  originalSubmission?: SubmitEventDto;
}
