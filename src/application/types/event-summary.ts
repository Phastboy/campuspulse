import { IEvent } from '@domain/interfaces';

/**
 * Lightweight read-only projection of a persisted event for use in
 * similarity scoring and client-facing candidate lists.
 *
 * Derived from {@link IEvent} minus persistence-specific fields that are
 * irrelevant to identity comparison.
 *
 * ⚠️ When originating from a JSONB query, `Date` fields inside `datetime`
 * may arrive as ISO strings. Use {@link getComparableDateFromSummary}.
 */
export type EventSummary = Omit<IEvent, 'description' | 'createdAt'>;
