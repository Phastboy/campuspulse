import { EventDateTime } from '@common';
import { EventSummary } from '@events/domain/event-summary';

/**
 * The raw shape of a JSONB `datetime` field as it arrives from PostgreSQL.
 *
 * MikroORM does not hydrate nested `Date` objects inside JSONB — `date`,
 * `startTime`, and `endTime` arrive as ISO strings at runtime. This type
 * models what we actually receive so we can handle it without casting to `any`.
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
 * Extracts a representative `Date` from an {@link EventSummary} for use in
 * similarity scoring and duplicate detection.
 *
 * MikroORM returns JSONB fields as plain objects, not hydrated class instances,
 * so `datetime.date` may arrive as a string rather than a `Date`. This helper
 * handles all observed runtime shapes defensively.
 *
 * **ISP / LSP note:** the parameter was previously typed as the full `Event`
 * ORM entity. It is now typed as {@link EventSummary} — the minimal projection
 * that rules and the engine actually need. This decouples the helper (and all
 * callers) from the MikroORM entity, and from `createdAt` specifically.
 * The fallback to `createdAt` has been removed; if `datetime.date` cannot
 * be parsed the function returns `null` and callers decide how to handle it.
 *
 * @param summary - The event summary to extract a date from
 * @returns A valid `Date` representing when the event occurs, or `null` if unparseable
 */
export function getComparableDateFromSummary(
  summary: EventSummary,
): Date | null {
  if (summary.datetime && typeof summary.datetime === 'object') {
    const raw = summary.datetime as unknown as RawDatetimeJson;

    if ('date' in raw) {
      return parseDateValue(raw.date);
    }
  }

  return null;
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
