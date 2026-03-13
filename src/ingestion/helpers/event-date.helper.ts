import { EventDateTime } from '@common';
import { Event } from '@events/entities/event.entity';

/**
 * The raw shape of a JSONB `datetime` field as it arrives from PostgreSQL.
 *
 * MikroORM does not hydrate nested `Date` objects inside JSONB — the `date`,
 * `startTime`, and `endTime` values arrive as ISO strings. This type
 * reflects what we actually receive at runtime so we can handle it without
 * casting to `any`.
 */
type RawDatetimeJson = {
  type: EventDateTime['type'];
  date: Date | string | number;
  startTime?: Date | string | number;
  endTime?: Date | string | number;
  endDate?: Date | string | number;
};

/**
 * Normalises a raw JSONB date value (string, number, or Date) to a `Date`.
 * Returns `null` if the value cannot be parsed.
 */
function parseDateValue(
  value: Date | string | number | undefined,
): Date | null {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Extracts a representative `Date` from an `Event` for use in similarity
 * scoring and duplicate detection.
 *
 * MikroORM returns JSONB fields as plain objects, not hydrated class instances,
 * so `datetime.date` may arrive as a string rather than a `Date`. This helper
 * handles all observed runtime shapes defensively.
 *
 * Falls back to `createdAt` if `datetime.date` cannot be parsed, and to
 * `new Date()` as a last resort (logged as a warning at the call site).
 *
 * @param event - The event to extract a date from
 * @returns A valid `Date` representing when the event occurs
 */
export function getComparableDateFromEvent(event: Event): Date {
  if (event.datetime && typeof event.datetime === 'object') {
    const raw = event.datetime as unknown as RawDatetimeJson;

    if ('date' in raw) {
      const parsed = parseDateValue(raw.date);
      if (parsed) return parsed;
    }
  }

  if (event.createdAt instanceof Date) {
    return event.createdAt;
  }

  return new Date();
}

/**
 * Returns `true` if both dates fall on the same calendar day, regardless of time.
 *
 * @param date1 - First date
 * @param date2 - Second date
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() === d2.getTime();
}
