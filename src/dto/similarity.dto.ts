import { ApiProperty } from '@nestjs/swagger';
import { type EventSummary } from '@domain/types';

export class ScoredEvent {
  @ApiProperty()
  event!: EventSummary;

  @ApiProperty({ minimum: 0, maximum: 1, example: 0.87 })
  score!: number;

  @ApiProperty({ example: { title: true, venue: true } })
  matches!: Record<string, boolean>;
}
