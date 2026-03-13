import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventDateTime } from '@common';
import { DATETIME_TYPES, type DatetimeType } from '@common/constants';
import { EventSubmission } from '@events/domain';
import {
  IsString,
  IsOptional,
  IsDateString,
  ValidateIf,
  IsIn,
  IsNotEmpty,
} from 'class-validator';

/**
 * Payload for submitting a new event to the ingestion pipeline.
 *
 * Supports two datetime shapes via the `type` discriminator:
 * - `specific` — a timed event with a required `startTime`
 * - `all-day`  — a full-day event with an optional `endDate` for multi-day spans
 *
 * @example
 * // Timed event
 * {
 *   "title": "NACOS Parliamentary Summit 2026",
 *   "type": "specific",
 *   "date": "2026-02-28",
 *   "startTime": "2026-02-28T10:00:00.000Z",
 *   "venue": "ACE Conference Hall, ICT"
 * }
 *
 * @example
 * // All-day event
 * {
 *   "title": "OAU Exam Food Relief & Iftar 2026",
 *   "type": "all-day",
 *   "date": "2026-02-28",
 *   "venue": "SUB Car Park"
 * }
 */
export class SubmitEventDto {
  /**
   * Human-readable event title as it should appear on the platform.
   * Should match the organiser's own name for the event to improve
   * duplicate detection accuracy.
   */
  @ApiProperty({
    description:
      'Event title as the organiser named it — used in duplicate detection.',
    example: 'NACOS Parliamentary Summit 2026',
  })
  @IsString()
  title!: string;

  /**
   * Datetime shape selector.
   * - `specific` requires `startTime`; `endTime` is optional
   * - `all-day` requires only `date`; `endDate` is optional for multi-day events
   */
  @ApiProperty({
    enum: DATETIME_TYPES,
    description:
      'Datetime shape. `specific` requires startTime; `all-day` uses only date.',
    example: 'specific',
  })
  @IsIn(DATETIME_TYPES)
  type!: DatetimeType;

  /**
   * The primary date of the event in ISO 8601 format.
   * For `specific` events this is the calendar date; time comes from `startTime`.
   * For `all-day` events this is the start date.
   */
  @ApiProperty({
    description:
      'Primary event date (ISO 8601). Time component is ignored — use startTime for specific events.',
    example: '2026-02-28',
  })
  @IsDateString()
  date!: string;

  /**
   * Event start time as a full ISO 8601 datetime string.
   * Required when `type` is `specific`. Ignored for `all-day` events.
   *
   * @example "2026-02-28T10:00:00.000Z"
   */
  @ApiPropertyOptional({
    description: 'Start time (ISO 8601). Required when type is `specific`.',
    example: '2026-02-28T10:00:00.000Z',
  })
  @ValidateIf((o: SubmitEventDto) => o.type === 'specific')
  @IsNotEmpty()
  @IsDateString()
  startTime!: string;

  /**
   * Event end time. Optional even for `specific` events.
   * When omitted, the event detail page will not show an end time.
   *
   * @example "2026-02-28T13:00:00.000Z"
   */
  @ApiPropertyOptional({
    description: 'End time (ISO 8601). Optional for specific events.',
    example: '2026-02-28T13:00:00.000Z',
  })
  @ValidateIf((o: SubmitEventDto) => o.type === 'specific')
  @IsOptional()
  @IsDateString()
  endTime?: string;

  /**
   * Last date of the event for multi-day all-day events.
   * Only relevant when `type` is `all-day`. Omit for single-day events.
   *
   * @example "2026-03-01"
   */
  @ApiPropertyOptional({
    description:
      'End date for multi-day all-day events. Only relevant when type is `all-day`.',
    example: '2026-03-01',
  })
  @ValidateIf((o: SubmitEventDto) => o.type === 'all-day')
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Venue name as it is commonly known on campus.
   * Used by the venue similarity rule — consistent naming improves
   * duplicate detection (e.g. "Trust Hall" not "the hall near Moremi").
   */
  @ApiProperty({
    description:
      'Venue name as commonly known on campus. Consistent naming improves duplicate detection.',
    example: 'ACE Conference Hall, ICT',
  })
  @IsString()
  venue!: string;

  /**
   * Optional free-text description shown on the event detail page.
   * May include pricing info, dress code, registration links, etc.
   */
  @ApiPropertyOptional({
    description: 'Optional event description shown on the detail page.',
    example: 'Free for NACOS freshers · ₦2,000 regular admission.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Converts this DTO into the internal {@link EventSubmission} domain object
   * used by the ingestion pipeline and similarity engine.
   */
  toEventSubmission(): EventSubmission {
    return {
      title: this.title,
      datetime: this.toEventDateTime(),
      venue: this.venue,
    };
  }

  /**
   * Builds the structured {@link EventDateTime} from the flat DTO fields.
   * Used both by {@link toEventSubmission} and when updating an existing event.
   */
  toEventDateTime(): EventDateTime {
    if (this.type === 'specific') {
      return {
        type: 'specific',
        date: new Date(this.date),
        startTime: new Date(this.startTime),
        endTime: this.endTime ? new Date(this.endTime) : undefined,
      };
    }

    return {
      type: 'all-day',
      date: new Date(this.date),
      endDate: this.endDate ? new Date(this.endDate) : undefined,
    };
  }
}
