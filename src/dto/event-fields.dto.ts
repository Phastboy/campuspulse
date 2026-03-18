import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DATETIME_TYPES, type DatetimeType } from '@domain/value-objects';

/**
 * Shared base class for event field definitions.
 *
 * Both {@link SubmitEventDto} (ingestion) and {@link UpdateEventDto} (events)
 * extend this. It exists to prevent those two modules from importing each other
 * — a cross-module DTO dependency that would couple ingestion to events.
 */
export class EventFieldsDto {
  @ApiProperty({ example: 'NACOS Parliamentary Summit 2026' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ enum: DATETIME_TYPES, example: 'specific' })
  @IsIn(DATETIME_TYPES)
  type!: DatetimeType;

  @ApiProperty({ example: '2026-02-28' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: '2026-02-28T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startTime!: string;

  @ApiPropertyOptional({ example: '2026-02-28T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 'ACE Conference Hall, ICT' })
  @IsString()
  @IsNotEmpty()
  venue!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
