import { Event } from '@events/entities/event.entity';

/**
 * Extracts a representative date from an Event by inspecting its datetime and createdAt fields.
 *
 * Handles multiple shapes: an object with a `date` property (string, `Date`, or numeric timestamp), a date string, or a `Date` instance. If no date can be extracted, logs a warning and falls back to the current date.
 *
 * @param event - The event object to extract the date from
 * @returns A `Date` representing the event's datetime or `createdAt`; if neither yields a date, the current date is returned
 */
export function getComparableDateFromEvent(event: Event): Date {
  // If datetime is an object with a date property (from JSONB)
  if (event.datetime && typeof event.datetime === 'object') {
    if ('date' in event.datetime) {
      const dateValue = (event.datetime as any).date;

      // Handle string date
      if (typeof dateValue === 'string') {
        return new Date(dateValue);
      }

      // Handle Date object
      if (dateValue instanceof Date) {
        return dateValue;
      }

      // Handle timestamp number
      if (typeof dateValue === 'number') {
        return new Date(dateValue);
      }
    }

    // If the whole object is a date string
    if (typeof event.datetime === 'string') {
      return new Date(event.datetime);
    }
  }

  // If datetime is directly a Date
  if (event.datetime instanceof Date) {
    return event.datetime;
  }

  // Fallback to createdAt or current date
  if (event.createdAt instanceof Date) {
    return event.createdAt;
  }

  this.logger?.warn?.(
    `Could not extract date from event ${event.id}, using current date`,
  );
  return new Date();
}

/**
 * Determines whether two dates fall on the same calendar day.
 *
 * @returns `true` if both dates represent the same calendar day, `false` otherwise.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() === d2.getTime();
}
