/**
 * Represents the commercial price signal of a listing.
 *
 * This is a value object — it carries meaning, not identity.
 *
 * Design: hybrid range + negotiable model.
 *
 * Supported representations:
 *
 *   Fixed price:
 *     minPrice === maxPrice, isNegotiable: false
 *
 *   Price range:
 *     minPrice + maxPrice set, isNegotiable: false
 *     e.g. "₦5,000 – ₦20,000"
 *
 *   Negotiable with floor:
 *     minPrice set, maxPrice null, isNegotiable: true
 *     e.g. "From ₦10,000 (negotiable)"
 *
 *   Fully negotiable (no anchor):
 *     minPrice null, maxPrice null, isNegotiable: true
 *     e.g. "Contact for pricing"
 *
 *   Free / no price signal:
 *     all null, isNegotiable: false
 *
 * Rules:
 *   - currency is required if minPrice or maxPrice is set
 *   - maxPrice must be >= minPrice when both are present
 *   - prices are stored as integers in the smallest currency unit
 *     (kobo for NGN, cents for USD/GBP/EUR) to avoid floating point errors
 */
export interface ListingPrice {
  readonly minPrice: number | null;
  readonly maxPrice: number | null;
  readonly currencyCode: string | null;
  readonly isNegotiable: boolean;
}
