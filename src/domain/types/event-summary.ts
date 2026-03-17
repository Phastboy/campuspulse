import { EventDateTime } from '@common/datetime';

/**
 * Lightweight read-only projection of an {@link Event} entity.
 *
 * Used wherever only identity and display information is needed — specifically
 * by the similarity engine when presenting candidate matches and in
 * {@link ScoredEvent} results returned to the client.
 *
 * Excludes persistence fields (`createdAt`) so the ingestion module never
 * depends on the ORM entity or its decorator metadata.
 *
 * ⚠️ When originating from a database JSONB query, `Date` fields inside
 * `datetime` may arrive as ISO strings. Use {@link getComparableDateFromSummary}
 * when a reliable `Date` is required.
 */
export interface EventSummary {
  id: string;
  title: string;
  datetime: EventDateTime;
  venue: string;
}
