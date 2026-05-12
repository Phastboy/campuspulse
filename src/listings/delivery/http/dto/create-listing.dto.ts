import { IsString, IsNumber, IsObject, IsNotEmpty, IsOptional, Min } from 'class-validator';

/**
 * Payload for creating a new listing.
 * Combines static relational data with a dynamic attributes blob.
 */
export class CreateListingDto {
  /**
   * The primary display name of the listing.
   * @example "Civic Centre Panorama Hall"
   */
  @IsString()
  @IsNotEmpty()
  title!: string;

  /**
   * A detailed narrative describing the listing.
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * ID of the Category that defines the allowed attributes for this listing.
   */
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  /**
   * The baseline price for the listing.
   * @example 250000.00
   */
  @IsNumber()
  @Min(0)
  basePrice!: number;

  /**
   * ISO currency code.
   * @default "NGN"
   */
  @IsString()
  @IsOptional()
  currency: string = 'NGN';

  /**
   * Dynamic characteristics of the listing.
   * Must match the schema defined by the category's Blueprint.
   * @example { "capacity": 500, "location": "Lekki", "has_generator": true }
   */
  @IsObject()
  @IsNotEmpty()
  attributes!: Record<string, any>;
}
