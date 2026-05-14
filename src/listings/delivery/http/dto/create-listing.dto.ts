import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsObject,
  IsNotEmpty,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { MediaDto } from '../../../../shared/dto/media.dto.js';

/**
 * Payload for creating a new listing.
 * Now requires a businessProfileId to establish commercial ownership.
 */
export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  /**
   * The commercial identity posting this listing.
   */
  @IsString()
  @IsNotEmpty()
  businessProfileId!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  /**
   * Minimum price or fixed price.
   * @example 1200000
   */
  @IsNumber()
  @Min(0)
  minPrice!: number;

  /**
   * Optional maximum price for price ranges.
   * @example 1500000
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @IsString()
  @IsOptional()
  currency: string = 'NGN';

  /**
   * Must match the schema defined by the category's Blueprint.
   */
  @IsObject()
  @IsNotEmpty()
  attributes!: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  media?: MediaDto[];
}
