import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, IsDateString, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EventCategory, EventStatus, LocationTag, PricingTag, RsvpStatus } from '../entities/event.entity';

export class EventQueryDto {
  @ApiPropertyOptional({
    enum: EventCategory,
    description: 'Filter by event category'
  })
  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @ApiPropertyOptional({
    enum: EventStatus,
    description: 'Filter by event status'
  })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiPropertyOptional({
    enum: LocationTag,
    description: 'Filter by location type'
  })
  @IsEnum(LocationTag)
  @IsOptional()
  location?: LocationTag;

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

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['date', 'views', 'title'],
    default: 'date'
  })
  @IsEnum(['date', 'views', 'title'])
  @IsOptional()
  sortBy?: 'date' | 'views' | 'title' = 'date';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc'
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ enum: PricingTag, description: 'Filter by pricing type' })
  @IsEnum(PricingTag)
  @IsOptional()
  pricingTag?: PricingTag;

  @ApiPropertyOptional({ enum: RsvpStatus, description: 'Filter by RSVP requirement type' })
  @IsEnum(RsvpStatus)
  @IsOptional()
  rsvpStatus?: RsvpStatus;

  @ApiPropertyOptional({ description: 'Search events by title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by organizer name' })
  @IsString()
  @IsOptional()
  organizer?: string;

  // === Views / Popularity ===
  @ApiPropertyOptional({ description: 'Minimum number of views' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minViews?: number;

  @ApiPropertyOptional({ description: 'Maximum number of views' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxViews?: number;

  // === Soft Delete ===
  @ApiPropertyOptional({ description: 'Include soft-deleted events' })
  @IsBoolean()
  @IsOptional()
  includeDeleted?: boolean;
}
