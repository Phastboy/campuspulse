import { IEvent } from '@domain/interfaces';

/**
 * Lightweight read-only projection of a persisted event.
 *
 * Derived from {@link IEvent} by dropping the persistence-specific fields
 * (`description` and `createdAt`) that are irrelevant to identity comparison
 * and similarity scoring. Using `Omit` keeps this type automatically in sync
 * if `IEvent` gains or loses fields.
 *
 * Used by the similarity engine when presenting candidate matches, and in
 * {@link ScoredEvent} results returned to the client.
 *
 * ⚠️ When originating from a database JSONB query, `Date` fields inside
 * `datetime` may arrive as ISO strings. Use {@link getComparableDateFromSummary}
 * when a reliable `Date` is required.
 */
export type EventSummary = Omit<IEvent, 'description' | 'createdAt'>;
