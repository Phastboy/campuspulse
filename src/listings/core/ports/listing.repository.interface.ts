import { CreateListingDto } from '../../delivery/http/dto/create-listing.dto.js';
import { GetListingsFilterDto } from '../../delivery/http/dto/get-listings-filter.dto.js';
import { UpdateListingDto } from '../../delivery/http/dto/update-listing.dto.js';
import { ListingView } from '../domain/listing.view.js';

export const LISTING_REPOSITORY_TOKEN = Symbol('LISTING_REPOSITORY_TOKEN');

export interface IListingRepository {
  create(ownerId: string, payload: CreateListingDto): Promise<ListingView>;

  update(id: string, accountId: string, data: UpdateListingDto): Promise<ListingView>;

  delete(id: string, accountId: string): Promise<void>;

  findMany(filters: GetListingsFilterDto): Promise<{
    data: ListingView[];
    total: number;
  }>;

  findBySlug(slug: string): Promise<ListingView | null>;

  findById(id: string): Promise<ListingView | null>;

  /**
   * Returns published listings belonging to a business profile.
   * Used by the business discovery surface — read-only, no ownership check.
   */
  findByBusinessProfileId(businessProfileId: string): Promise<ListingView[]>;
}
