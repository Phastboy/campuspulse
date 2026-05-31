import { BusinessProfile } from '../types/business-profile.entity.js';
import {
  CreateBusinessProfileInput,
  DiscoverBusinessesInput,
  PaginatedBusinessSummaries,
  UpdateBusinessProfileInput,
} from '../types/business-profile.types.js';

export abstract class IBusinessProfileRepository {
  abstract create(input: CreateBusinessProfileInput, slug: string): Promise<BusinessProfile>;
  abstract findById(id: string): Promise<BusinessProfile | null>;
  abstract findBySlug(slug: string): Promise<BusinessProfile | null>;
  abstract isSlugTaken(slug: string): Promise<boolean>;
  abstract findByOwner(ownerId: string): Promise<BusinessProfile[]>;
  abstract update(id: string, input: UpdateBusinessProfileInput): Promise<BusinessProfile>;
  abstract delete(id: string): Promise<void>;
  abstract discover(input: DiscoverBusinessesInput): Promise<PaginatedBusinessSummaries>;
}
