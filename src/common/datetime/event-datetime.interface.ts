/**
 * A timed event with a known start time.
 *
 * Use this shape when the event has a specific start time — concerts, talks,
 * football matches, online spaces. `endTime` is optional; omit it when the
 * organiser has not published a finish time.
 *
 * @example
 * {
 *   type: "specific",
 *   date: new Date("2026-02-28"),
 *   startTime: new Date("2026-02-28T20:00:00Z"),
 *   endTime: new Date("2026-02-28T23:00:00Z")
 * }
 */
export interface SpecificDateTime {
  type: 'specific';

  /** Calendar date of the event (time component is ignored; use startTime). */
  date: Date;

  /** Exact start time of the event. */
  startTime: Date;

  /**
   * Exact end time. Optional — omit when the organiser has not specified one.
   * The event detail page will not show an end time if this is absent.
   */
  endTime?: Date;
}

/**
 * A full-day event with no specific time.
 *
 * Use this shape for welfare drives, exams, open-day events, or any event
 * that runs for a full day or spans multiple days without a specified time.
 *
 * @example
 * // Single-day event
 * { type: "all-day", date: new Date("2026-02-28") }
 *
 * @example
 * // Multi-day event
 * { type: "all-day", date: new Date("2026-03-01"), endDate: new Date("2026-03-05") }
 */
export interface AllDayDate {
  type: 'all-day';

  /** Start date of the event. */
  date: Date;

  /**
   * Last date of the event for multi-day spans.
   * Omit for single-day all-day events.
   */
  endDate?: Date;
}

/**
 * Discriminated union of all supported event datetime shapes.
 *
 * Stored as JSONB in the `events` table. Use the `type` discriminator to
 * narrow to the specific shape before accessing type-specific fields.
 *
 * @example
 * function getStartLabel(dt: EventDateTime): string {
 *   if (dt.type === 'specific') return dt.startTime.toLocaleTimeString();
 *   return 'All day';
 * }
 */
export type EventDateTime = SpecificDateTime | AllDayDate;
