import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DATETIME_TYPES, type DatetimeType } from '../constants';
import {
  IsString,
  IsOptional,
  IsDateString,
  ValidateIf,
  IsIn,
  IsNotEmpty,
} from 'class-validator';

/**
 * Base class carrying the shared field definitions for event date/time and
 * location fields.
 *
 * **Why this exists:** both {@link SubmitEventDto} (ingestion) and
 * {@link UpdateEventDto} (events) need these fields. Without a shared base,
 * one module must import from the other — a boundary violation. This base
 * lives in `common/` so neither feature module depends on the other.
 *
 * This class is not used directly as a request body — use the concrete
 * subclasses instead.
 */
export class EventFieldsDto {
  @ApiProperty({
    description:
      'Event title as the organiser named it — used in duplicate detection.',
    example: 'NACOS Parliamentary Summit 2026',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    enum: DATETIME_TYPES,
    description:
      'Datetime shape. `specific` requires startTime; `all-day` uses only date.',
    example: 'specific',
  })
  @IsIn(DATETIME_TYPES)
  type!: DatetimeType;

  @ApiProperty({
    description: 'Primary event date (ISO 8601).',
    example: '2026-02-28',
  })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    description: 'Start time (ISO 8601). Required when type is `specific`.',
    example: '2026-02-28T10:00:00.000Z',
  })
  @ValidateIf((o: EventFieldsDto) => o.type === 'specific')
  @IsNotEmpty()
  @IsDateString()
  startTime!: string;

  @ApiPropertyOptional({
    description: 'End time (ISO 8601). Optional for specific events.',
    example: '2026-02-28T13:00:00.000Z',
  })
  @ValidateIf((o: EventFieldsDto) => o.type === 'specific')
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'End date for multi-day all-day events.',
    example: '2026-03-01',
  })
  @ValidateIf((o: EventFieldsDto) => o.type === 'all-day')
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Venue name as commonly known on campus.',
    example: 'ACE Conference Hall, ICT',
  })
  @IsString()
  venue!: string;

  @ApiPropertyOptional({
    description: 'Optional event description shown on the detail page.',
    example: 'Free for NACOS freshers · ₦2,000 regular admission.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
