import { IEvent } from '@domain/interfaces';
import { EventSubmission } from '@application/types';

export interface IEventCreator {
  create(submission: EventSubmission): Promise<IEvent>;
}

export const EVENT_CREATOR = 'EVENT_CREATOR' as const;
