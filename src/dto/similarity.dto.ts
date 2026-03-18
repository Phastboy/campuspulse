import { ApiProperty } from '@nestjs/swagger';
import { type EventSummary } from '@application/types';

/**
 * HTTP projection of {@link SimilarityMatch} for API responses.
 *
 * Carries `@ApiProperty` decorators for Swagger documentation.
 * Used **only** in the controller layer when serialising a
 * `needs_decision` outcome into the HTTP response.
 * Internal scoring logic works with {@link SimilarityMatch} exclusively.
 */
export class ScoredEvent {
  @ApiProperty({
    description: 'The candidate event that may match the submission.',
  })
  event!: EventSummary;

  @ApiProperty({
    description:
      'Aggregate similarity score [0–1]. Candidates below 0.3 are discarded.',
    minimum: 0,
    maximum: 1,
    example: 0.87,
  })
  score!: number;

  @ApiProperty({
    description:
      'Rules that scored above the 0.7 threshold. Keys: title | venue | date.',
    example: { title: true, venue: true },
  })
  matches!: Record<string, boolean>;
}
