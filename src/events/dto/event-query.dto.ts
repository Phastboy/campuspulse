import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import type { EventCategory, LocationTag, EventStatus } from '../entities/event.entity';

export class EventQueryDto {
  @ApiPropertyOptional({
    enum: ['tech', 'academic', 'entertainment', 'sports', 'welfare', 'online', 'other'],
    description: 'Filter by category'
  })
  @IsEnum(['tech', 'academic', 'entertainment', 'sports', 'welfare', 'online', 'other'])
  @IsOptional()
  category?: EventCategory;

  @ApiPropertyOptional({
    description: 'Filter events from this date (ISO format)',
    example: '2026-03-01'
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter events until this date (ISO format)',
    example: '2026-03-31'
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    enum: ['pending', 'live', 'cancelled', 'postponed'],
    description: 'Filter by status'
  })
  @IsEnum(['pending', 'live', 'cancelled', 'postponed'])
  @IsOptional()
  status?: EventStatus;

  @ApiPropertyOptional({
    enum: ['on-campus', 'off-campus', 'online'],
    description: 'Filter by location type'
  })
  @IsEnum(['on-campus', 'off-campus', 'online'])
  @IsOptional()
  location?: LocationTag;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    default: 20
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    minimum: 0,
    default: 0
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}
