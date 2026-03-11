import { EventDateTime } from '@common/datetime';

export interface EventSubmission {
  title: string;
  datetime: EventDateTime;
  venue: string;
}
