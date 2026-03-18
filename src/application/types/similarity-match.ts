import { EventSummary } from './event-summary';

/**
 * Application-layer result of scoring one candidate event against a
 * submission. No framework decorators — plain TypeScript.
 *
 * The controller maps this to {@link ScoredEvent} (the Swagger-decorated
 * HTTP DTO) at the HTTP boundary.
 */
export interface SimilarityMatch {
  event: EventSummary;
  /** Aggregate weighted score in [0, 1]. */
  score: number;
  /** Rule names that individually exceeded the 0.7 match threshold. */
  matches: Record<string, boolean>;
}
