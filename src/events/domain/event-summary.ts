import { EventDateTime } from '@common';

/**
 * Lightweight projection of an event used outside the persistence layer.
 *
 * This type intentionally excludes persistence-specific fields such as
 * `createdAt`. It represents the minimal information required to identify
 * and display an event when performing similarity comparisons or presenting
 * candidate matches to a submitter.
 *
 * This projection is used by:
 *
 * - The similarity engine
 * - The ingestion pipeline
 * - DTOs returning candidate events to clients
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

  /** Structured datetime information for the event. */
  datetime: EventDateTime;

  /** Venue name as commonly known on campus. */
  venue: string;
}
