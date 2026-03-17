import { EventSummary } from './event-summary';

/**
 * Domain-level result of scoring one candidate event against a submission.
 *
 * Produced by {@link SimilarityEngine} and consumed by {@link IngestionService}.
 * Contains no framework decorators — it is a plain domain type. The controller
 * maps this to {@link ScoredEvent} (the HTTP DTO with Swagger decorators) at
 * the HTTP boundary.
 */
export interface SimilarityMatch {
  /** The candidate event that was scored. */
  event: EventSummary;

  /**
   * Aggregate similarity score in [0, 1].
   * A score of 1.0 means an exact match — the engine auto-links and this
   * result never reaches the HTTP layer.
   */
  score: number;

  /**
   * Scoring dimensions that individually exceeded the 0.7 threshold.
   * Keys are rule names (`title`, `venue`, `date`); value is always `true`.
   */
  matches: Record<string, boolean>;
}
