import { CreateListingDto } from '../../delivery/http/dto/create-listing.dto.js';
import { GetListingsFilterDto } from '../../delivery/http/dto/get-listings-filter.dto.js';
import { ListingView } from '../domain/listing.view.js';

/**
 * Unique token for NestJS dependency injection.
 */
export const LISTING_REPOSITORY_TOKEN = Symbol('LISTING_REPOSITORY_TOKEN');

/**
 * Interface defining the persistence contract for listings.
 * Implementation-agnostic to support future infrastructure migrations.
 */
export interface IListingRepository {
  /**
   * Persists a new listing and returns the domain-mapped view.
   * Handles the initial attachment of media and category relations.
   */
  create(ownerId: string, payload: CreateListingDto, slug: string): Promise<ListingView>;

  /**
   * Retrieves a paginated list of listings based on standard and dynamic filters.
   */
  findMany(filters: GetListingsFilterDto): Promise<{
    data: ListingView[];
    total: number;
  }>;

  /**
   * Fetches a detailed listing by its unique slug.
   */
  findBySlug(slug: string): Promise<ListingView | null>;

  /**
   * Fetches a listing by its ID.
   */
  findById(id: string): Promise<ListingView | null>;
}
