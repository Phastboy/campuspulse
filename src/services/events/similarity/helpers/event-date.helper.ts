import { EventDateTime } from '@domain/value-objects';
import { EventSummary } from '@application/types';

type RawDatetimeJson = {
  type: EventDateTime['type'];
  date: Date | string | number;
  startTime?: Date | string | number;
  endTime?: Date | string | number;
  endDate?: Date | string | number;
};

function parseDateValue(value: Date | string | number | undefined): Date | null {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function getComparableDateFromSummary(summary: EventSummary): Date | null {
  if (summary.datetime && typeof summary.datetime === 'object') {
    const raw = summary.datetime as unknown as RawDatetimeJson;
    if ('date' in raw) return parseDateValue(raw.date);
  }
  return null;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() === d2.getTime();
}
