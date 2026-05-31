import { Currency } from './currency.enum.js';
import { ListingStatus } from './listing-status.enum.js';

// ---------------------------------------------------------------------------
// Price input
// ---------------------------------------------------------------------------

export interface ListingPriceInput {
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly currency?: Currency;
  readonly isNegotiable: boolean;
}

// ---------------------------------------------------------------------------
// Use case inputs
// ---------------------------------------------------------------------------

/**
 * Input to create a new listing.
 * Slug is derived from title by the use case — not provided by the caller.
 * Status defaults to DRAFT.
 */
export interface CreateListingInput {
  readonly businessProfileId: string;
  readonly title: string;
  readonly description?: string;
  readonly price?: ListingPriceInput;
}

/**
 * Input to update an existing listing.
 * All fields optional — callers supply only what changes.
 * businessProfileId and slug are not updatable.
 */
export interface UpdateListingInput {
  readonly title?: string;
  readonly description?: string;
  readonly price?: ListingPriceInput;
}

/**
 * Input to transition listing lifecycle state.
 * Separated from UpdateListingInput because status transitions
 * have their own rules and will eventually carry validation logic.
 */
export interface TransitionListingStatusInput {
  readonly status: ListingStatus;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/**
 * Full listing representation.
 * Used for owner-facing detail views.
 */
export interface ListingView {
  readonly id: string;
  readonly businessProfileId: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly status: ListingStatus;
  readonly minPrice: number | null;
  readonly maxPrice: number | null;
  readonly currency: Currency | null;
  readonly isNegotiable: boolean;
  readonly coverUrl: string | null;
  readonly categoryId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Lightweight summary for discovery surfaces.
 * Intentionally minimal — enough to render a listing card.
 */
export interface ListingSummary {
  readonly id: string;
  readonly businessProfileId: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly minPrice: number | null;
  readonly maxPrice: number | null;
  readonly currency: Currency | null;
  readonly isNegotiable: boolean;
  readonly coverUrl: string | null;
  readonly categoryId: string | null;
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export interface DiscoverListingsInput {
  readonly businessProfileId?: string;
  readonly currency?: Currency;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly isNegotiable?: boolean;
  readonly search?: string;
  readonly status?: ListingStatus;
  /** Filter by an exact leaf categoryId */
  readonly categoryId?: string;
  /** Filter by root category slug — returns all listings in any leaf under that root */
  readonly rootSlug?: string;
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedListingSummaries {
  readonly items: ListingSummary[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
