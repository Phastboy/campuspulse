import { IsString, IsBoolean, IsOptional, IsArray, IsIn } from 'class-validator';
import {
  ATTRIBUTE_TYPES,
  type AttributeType,
} from '../../../../shared/domain/listing.constants.js';

/**
 * Defines a single dynamic attribute rule for a category.
 * Used to validate incoming listing data and generate frontend forms.
 */
export class AttributeDefinitionDto {
  /**
   * Unique key for the attribute used in the JSONB storage.
   * @example "guest_capacity"
   */
  @IsString()
  key!: string;

  /**
   * Human-readable label for the UI.
   * @example "Maximum Guest Capacity"
   */
  @IsString()
  label!: string;

  /**
   * Data type enforcement for this attribute.
   * @example "NUMBER"
   */
  @IsString()
  @IsIn(Object.values(ATTRIBUTE_TYPES))
  type!: AttributeType;

  /**
   * Whether this attribute must be provided when creating a listing.
   * @default false
   */
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = false;

  /**
   * List of permitted values. Required only if type is 'SELECT'.
   * @example ["Lekki", "Ikeja", "Victoria Island"]
   */
  @IsArray()
  @IsOptional()
  options?: string[];
}
