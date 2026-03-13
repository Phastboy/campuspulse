import { ApiProperty } from '@nestjs/swagger';
import { type EventSummary } from '@events/domain/event-summary';

/**
 * A candidate event returned by the similarity engine when a submitted event
 * may already exist in the system.
 *
 * Presented to the submitter when `POST /api/ingestion/submit` returns
 * `action: "needs_decision"`. The submitter uses this to decide whether to
 * link their submission to an existing event or create a new one.
 *
 * Internal rule-level scores are intentionally excluded — they are engine
 * diagnostics and have no meaning to the submitter.
 *
 * @example
 * {
 *   "event": {
 *     "id": "a1b2c3d4-...",
 *     "title": "NACOS Freshers Night 2026",
 *     "datetime": { "type": "specific", "date": "2026-02-28T00:00:00.000Z", "startTime": "2026-02-28T19:00:00.000Z" },
 *     "venue": "Trust Hall"
 *   },
 *   "score": 0.87,
 *   "matches": { "title": true, "venue": true }
 * }
 */
export class ScoredEvent {
  /**
   * The candidate event that may match the submission.
   * Contains only the fields needed to identify and display the event.
   */
  @ApiProperty({
    description: 'The candidate event that may match the submission.',
    example: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      title: 'NACOS Freshers Night 2026',
      datetime: {
        type: 'specific',
        date: '2026-02-28T00:00:00.000Z',
        startTime: '2026-02-28T19:00:00.000Z',
      },
      venue: 'Trust Hall',
    },
  })
  event!: EventSummary;

  /**
   * Aggregate similarity score in the range [0, 1].
   *
   * Computed as a weighted average across all applicable similarity rules
   * (title, venue, date proximity). A score of `1.0` means an exact match
   * across all three dimensions — in that case the engine auto-links and this
   * object never reaches the client. Only candidates scoring above `0.3` are
   * returned.
   */
  @ApiProperty({
    description:
      'Aggregate similarity score [0–1]. Candidates below 0.3 are discarded.',
    example: 0.87,
    minimum: 0,
    maximum: 1,
  })
  score!: number;

  /**
   * Similarity dimensions that individually exceeded the `0.7` threshold.
   * Keys are rule names (`title`, `venue`, `date`); value is always `true`.
   *
   * A dimension is absent from this map if its score was below `0.7`,
   * even if the aggregate score is high.
   *
   * @example { "title": true, "venue": true }
   */
  @ApiProperty({
    description:
      'Rules that scored above the 0.7 threshold. Keys: title | venue | date.',
    example: { title: true, venue: true },
  })
  matches!: Record<string, boolean>;
}
