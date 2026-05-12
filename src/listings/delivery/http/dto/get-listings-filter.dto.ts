import { IsOptional, IsString, IsInt, Min, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for searching and filtering the discovery catalog.
 */
export class GetListingsFilterDto {
  /**
   * Filter by category slug.
   * @example "event-centres"
   */
  @IsOptional()
  @IsString()
  category?: string;

  /**
   * Minimum price threshold.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  /**
   * Maximum price threshold.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  /**
   * General keyword search for title or description.
   * @example "Ballroom"
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Deep-filtering on dynamic attributes.
   * Format: attributes[key]=value
   * @example { "location": "Lekki", "capacity": 500 }
   */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  /**
   * Results page number.
   * @default 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  /**
   * Number of items per page.
   * @default 20
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;
}
