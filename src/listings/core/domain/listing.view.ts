import { MediaType } from "../../../shared/domain/listing.constants.js";

/**
 * The allowed scalar values for any dynamic attribute,
 * strictly derived from the Category Blueprint (STRING, NUMBER, BOOLEAN, SELECT).
 */
export type AttributeValue = string | number | boolean | string[] | null;

/**
 * A strictly bounded record representing the polymorphic JSONB column.
 * Eliminates 'any' and forces consumers to handle the expected domain types.
 */
export type DynamicAttributes = Record<string, AttributeValue>;

export interface ListingView {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  basePrice: number;
  currency: string;
  isVerified: boolean;

  /**
   * Strictly bounded dynamic data.
   * No 'any' allowed.
   */
  attributes: DynamicAttributes;

  category: {
    id: string;
    name: string;
    slug: string;
  };

  media: {
    url: string;
    type: MediaType;
    order: number;
  }[];

  createdAt: Date;
}
