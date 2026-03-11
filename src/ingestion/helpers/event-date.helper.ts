import { Event } from '@events/entities/event.entity';

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

  this.logger?.warn?.(`Could not extract date from event ${event.id}, using current date`);
  return new Date();
}

export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() === d2.getTime();
}
