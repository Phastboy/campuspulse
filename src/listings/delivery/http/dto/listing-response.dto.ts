/**
 * Metadata for the category of a listing.
 */
export class ListingCategoryResponseDto {
  /** @example "cl_cat_123" */
  id!: string;

  /** @example "Event Centres" */
  name!: string;

  /** @example "event-centres" */
  slug!: string;
}

/**
 * Standardized media asset response.
 */
export class ListingMediaResponseDto {
  /** @example "https://cdn.com/image.jpg" */
  url!: string;

  /** @example 0 */
  order!: number;
}

/**
 * Data shape for a listing in a discovery list or search result.
 */
export class ListingResponseDto {
  /** @example "cl_list_999" */
  id!: string;

  /** @example "grand-ballroom" */
  slug!: string;

  /** @example "Grand Ballroom" */
  title!: string;

  /** @example 150000 */
  basePrice!: number;

  /** @example "NGN" */
  currency!: string;

  /**
   * Category-specific dynamic attributes.
   * @example { "capacity": 500, "location": "Lekki" }
   */
  attributes!: Record<string, any>;

  /** Metadata for the category */
  category!: ListingCategoryResponseDto;

  /** Array of media assets */
  media!: ListingMediaResponseDto[];
}

/**
 * Paginated wrapper for discovery results.
 */
export class PaginatedListingsResponseDto {
  /** Array of listing data */
  data!: ListingResponseDto[];

  /** @example 100 */
  total!: number;

  /** @example 1 */
  page!: number;

  /** @example 20 */
  limit!: number;
}
