import type { BusinessProfileView } from '../domain/business-profile.view.js';
import type { CreateBusinessProfileDto } from '../../delivery/http/dto/create-business-profile.dto.js';
import type { UpdateBusinessProfileDto } from '../../delivery/http/dto/update-business-profile.dto.js';
import type { GetBusinessProfilesFilterDto } from '../../delivery/http/dto/get-business-profiles-filter.dto.js';

export const BUSINESS_PROFILE_REPOSITORY_TOKEN = Symbol('BUSINESS_PROFILE_REPOSITORY_TOKEN');

export interface IBusinessProfileRepository {
  create(ownerId: string, payload: CreateBusinessProfileDto): Promise<BusinessProfileView>;

  update(
    id: string,
    ownerId: string,
    payload: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileView>;

  delete(id: string, ownerId: string): Promise<void>;

  findById(id: string): Promise<BusinessProfileView | null>;

  findBySlug(slug: string): Promise<BusinessProfileView | null>;

  /**
   * Returns only public profiles. Used for discovery endpoints.
   */
  findPublic(filters: GetBusinessProfilesFilterDto): Promise<{
    data: BusinessProfileView[];
    total: number;
  }>;

  /**
   * Returns all profiles owned by a user, regardless of visibility.
   */
  findByOwnerId(ownerId: string): Promise<BusinessProfileView[]>;
}
