import { SpecificDateTime } from './event-datetime.interface.js';

export function assertHasTime(date: unknown): asserts date is SpecificDateTime {
  if (!date || typeof date !== 'object') {
    throw new Error('Invalid date');
  }

  if (!('type' in date) || (date as any).type !== 'specific') {
    throw new Error('Date must include specific time');
  }
}
