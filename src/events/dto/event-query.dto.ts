import { IsOptional, IsInt, Min, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { DATETIME_TYPES, type DatetimeType } from '@common/constants';

/**
 * Query parameters for `GET /api/events`.
 *
 * All fields are optional. When omitted, events are returned without filtering.
 * Results are always ordered by event date ascending.
 *
 * @example
 * // All events on a specific day
 * GET /api/events?fromDate=2026-02-28&toDate=2026-02-28
 *
 * @example
 * // Paginate timed events
 * GET /api/events?type=specific&limit=10&offset=0
 */
export class EventQueryDto {
  /** Include events on or after this ISO date. */
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  /** Include events on or before this ISO date. */
  @IsOptional()
  @IsDateString()
  toDate?: string;

  /**
   * Filter by datetime shape.
   * `specific` returns timed events; `all-day` returns full-day events.
   */
  @IsOptional()
  @IsIn(DATETIME_TYPES)
  type?: DatetimeType;

  /** Maximum number of results to return. Defaults to 20. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  /** Number of results to skip. Defaults to 0. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
