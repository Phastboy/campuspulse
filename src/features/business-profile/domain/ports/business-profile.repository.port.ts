import { BusinessProfile } from '../types/business-profile.entity.js';
import {
  CreateBusinessProfileInput,
  DiscoverBusinessesInput,
  PaginatedBusinessSummaries,
  UpdateBusinessProfileBrandingInput,
  UpdateBusinessProfileInput,
} from '../types/business-profile.types.js';

/**
 * Port: persistence contract for business profiles.
 *
 * Defined in Zone 0 (domain).
 * Implemented in Zone 3 (infrastructure — Prisma adapter).
 *
 * Abstract class so it survives TypeScript erasure and can be used
 * as a NestJS injection token without a separate symbol.
 */
export abstract class IBusinessProfileRepository {
  abstract create(input: CreateBusinessProfileInput, slug: string): Promise<BusinessProfile>;

  abstract findById(id: string): Promise<BusinessProfile | null>;

  abstract findBySlug(slug: string): Promise<BusinessProfile | null>;

  /**
   * Check whether a slug is already taken.
   * Used before persisting to enforce the uniqueness invariant.
   */
  abstract isSlugTaken(slug: string): Promise<boolean>;

  abstract findByOwner(ownerId: string): Promise<BusinessProfile[]>;

  /**
   * Apply safe field updates.
   * Does not touch ownership, slug, or verification status.
   */
  abstract update(id: string, input: UpdateBusinessProfileInput): Promise<BusinessProfile>;

  /**
   * Apply branding asset updates.
   * Separate from update() — branding goes through the upload pipeline.
   */
  abstract updateBranding(
    id: string,
    input: UpdateBusinessProfileBrandingInput,
  ): Promise<BusinessProfile>;

  abstract delete(id: string): Promise<void>;

  /**
   * Public discovery query.
   * Must return only public profiles.
   */
  abstract discover(input: DiscoverBusinessesInput): Promise<PaginatedBusinessSummaries>;
}

