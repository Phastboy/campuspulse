import { Injectable } from '@nestjs/common';
import { CreateListingUseCase } from './create-listing.use-case.js';
import { DiscoverListingsUseCase } from './discover-listings.use-case.js';
import { GetListingDetailUseCase } from './get-listing-detail.use-case.js';
import { CreateListingDto } from '../delivery/http/dto/create-listing.dto.js';
import { GetListingsFilterDto } from '../delivery/http/dto/get-listings-filter.dto.js';
import {
  ListingResponseDto,
  PaginatedListingsResponseDto,
} from '../delivery/http/dto/listing-response.dto.js';

@Injectable()
export class ListingsService {
  constructor(
    private readonly createUseCase: CreateListingUseCase,
    private readonly discoverUseCase: DiscoverListingsUseCase,
    private readonly getDetailUseCase: GetListingDetailUseCase,
  ) {}

  /**
   * Orchestrates the creation of a listing.
   */
  async createListing(accountId: string, payload: CreateListingDto): Promise<ListingResponseDto> {
    return this.createUseCase.execute(accountId, payload);
  }

  /**
   * Orchestrates the discovery loop.
   */
  async discoverListings(filters: GetListingsFilterDto): Promise<PaginatedListingsResponseDto> {
    return this.discoverUseCase.execute(filters);
  }

  /**
   * Orchestrates fetching a single detailed listing.
   */
  async getListingBySlug(slug: string): Promise<ListingResponseDto> {
    return await this.getDetailUseCase.execute(slug);
  }
}
