import {
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  MinLength,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { type DynamicAttributes } from "../../../core/domain/listing.view.js";
import { MediaDto } from "../../../../shared/dto/media.dto.js";
import { Type } from "class-transformer";

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Updated to match the new schema field 'priceMin'
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  /**
   * New field to support price ranges or caps
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  /**
   * When provided, this will be validated against the
   * Category Blueprint before saving.
   */
  @IsOptional()
  @IsObject()
  attributes?: DynamicAttributes;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  media?: MediaDto[];
}
