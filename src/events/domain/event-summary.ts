import { EventDateTime } from '@common';

/**
 * Lightweight read-only projection of an {@link Event} entity.
 *
 * Used outside the persistence layer wherever only identifying and
 * display information is needed — specifically by the similarity engine
 * when presenting candidate matches to submitters, and in
 * {@link ScoredEvent} results returned to the client.
 *
 * Excludes persistence-specific fields (`createdAt`) and mutable fields
 * not relevant to identity comparison.
 *
 * @example
 * {
 *   id: "a1b2c3d4-...",
 *   title: "NACOS Freshers Night 2026",
 *   datetime: {
 *     type: "specific",
 *     date: new Date("2026-02-28"),
 *     startTime: new Date("2026-02-28T19:00:00Z")
 *   },
 *   venue: "Trust Hall"
 * }
 */
export interface EventSummary {
  /** Unique identifier of the event. */
  id: string;

  /** Human-readable event title. */
  title: string;

  /**
   * Structured datetime for this event.
   *
   * ⚠️ When this summary originates from a database query, `Date` fields
   * inside `datetime` may arrive as ISO strings due to JSONB deserialisation.
   * Use {@link getComparableDateFromEvent} if you need a reliable `Date`.
   */
  datetime: EventDateTime;

  /** Venue name as commonly known on campus. */
  venue: string;
}
