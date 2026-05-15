import { BusinessType } from './business-type.enum.js';
import { VerificationStatus } from './verification-status.enum.js';

/**
 * Input to create a new business profile.
 * Slug is NOT provided by the caller — it is derived from name by the use case.
 */
export interface CreateBusinessProfileInput {
  readonly ownerId: string;
  readonly name: string;
  readonly businessType: BusinessType;
  readonly description?: string;
  readonly phoneNumber?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  readonly location?: string;
}

/**
 * Input to update an existing business profile.
 * Ownership and slug are not updatable through this type.
 * All fields are optional — callers supply only what changes.
 */
export interface UpdateBusinessProfileInput {
  readonly name?: string;
  readonly businessType?: BusinessType;
  readonly description?: string;
  readonly phoneNumber?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  readonly location?: string;
  readonly isPublic?: boolean;
}

/**
 * Input to update branding assets.
 * Separated from UpdateBusinessProfileInput because branding
 * goes through the upload pipeline, not the PATCH endpoint.
 */
export interface UpdateBusinessProfileBrandingInput {
  readonly logoUrl?: string;
  readonly logoId?: string;
  readonly bannerUrl?: string;
  readonly bannerId?: string;
}

/**
 * Full public-facing representation of a business profile.
 * Used when rendering a complete storefront page.
 */
export interface BusinessProfileView {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly slug: string;
  readonly businessType: BusinessType;
  readonly isPublic: boolean;
  readonly verificationStatus: VerificationStatus;
  readonly description: string | null;
  readonly logoUrl: string | null;
  readonly bannerUrl: string | null;
  readonly phoneNumber: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly location: string | null;
  readonly createdAt: Date;
}

/**
 * Lightweight summary used in discovery/listing results.
 * Intentionally omits contact details and branding internals.
 */
export interface BusinessSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly businessType: BusinessType;
  readonly verificationStatus: VerificationStatus;
  readonly description: string | null;
  readonly logoUrl: string | null;
  readonly location: string | null;
}

/**
 * Query parameters for the discovery surface.
 */
export interface DiscoverBusinessesInput {
  readonly businessType?: BusinessType;
  readonly verificationStatus?: VerificationStatus;
  readonly search?: string;
  readonly page: number;
  readonly limit: number;
}

/**
 * Paginated discovery result.
 */
export interface PaginatedBusinessSummaries {
  readonly items: BusinessSummary[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
