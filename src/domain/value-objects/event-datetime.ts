/**
 * A timed event with a specific start time.
 */
export interface SpecificDateTime {
  type: 'specific';
  /** Calendar date of the event. Time component is ignored — use startTime. */
  date: Date;
  /** Exact start time. */
  startTime: Date;
  /** Exact end time. Optional — omit when not published by the organiser. */
  endTime?: Date;
}

/**
 * A full-day event with no specific time.
 * Use for welfare drives, exams, open days, or multi-day events.
 */
export interface AllDayDate {
  type: 'all-day';
  /** Start date. */
  date: Date;
  /** Last date for multi-day spans. Omit for single-day events. */
  endDate?: Date;
}

/**
 * Discriminated union of all supported event datetime shapes.
 *
 * Stored as JSONB in the `events` table. Always narrow on `type` before
 * accessing shape-specific fields.
 *
 * @example
 * function label(dt: EventDateTime): string {
 *   return dt.type === 'specific'
 *     ? dt.startTime.toLocaleTimeString()
 *     : 'All day';
 * }
 */
export type EventDateTime = SpecificDateTime | AllDayDate;
