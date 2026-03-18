import { IEvent } from '@domain/interfaces';

export interface IEventMutator {
  save(event: IEvent): Promise<void>;
  remove(event: IEvent): Promise<void>;
}

export const EVENT_MUTATOR = 'EVENT_MUTATOR' as const;
