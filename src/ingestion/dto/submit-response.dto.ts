import { EventDateTime } from '@common';
import { SubmitEventDto } from './submit-event.dto';

export class SubmitResponseDto {
  action!: 'created' | 'needs_decision';
  message!: string;

  // Only present when action = 'created'
  eventId?: string;

  // Only present when action = 'needs_decision'
  similar?: Array<{
    event: {
      id: string;
      title: string;
      datetime: EventDateTime;
      venue: string;
    };
    score: number;
    matches: Record<string, boolean>;
    ruleScores?: Record<string, number>; // Optional, for debugging
  }>;

  // Only present when action = 'needs_decision'
  originalSubmission?: SubmitEventDto;
}
