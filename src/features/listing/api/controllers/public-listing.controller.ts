import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '@odysseon/whoami-adapter-nestjs';
import { DiscoverListingsUseCase } from '../../application/use-cases/discover-listings.use-case.js';
import { GetPublicListingUseCase } from '../../application/use-cases/get-public-listing.use-case.js';
import { GetListingsQueryDto } from '../dto/request.dto.js';
import { ListingResponseDto, PaginatedListingsResponseDto } from '../dto/response.dto.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Listing Public Surface')
@Public()
@Controller()
export class PublicListingController {
  constructor(
    private readonly discoverListings: DiscoverListingsUseCase,
    private readonly getPublicListing: GetPublicListingUseCase,
  ) {}

  /**
   * GET /listings
   * Global discovery — all published listings across all businesses.
   */
  @Get('listings')
  async discover(@Query() query: GetListingsQueryDto): Promise<PaginatedListingsResponseDto> {
    const result = await this.discoverListings.execute(query);
    return PaginatedListingsResponseDto.from(result);
  }

  /**
   * GET /businesses/:businessSlug/listings
   * Discovery scoped to a specific business profile.
   */
  @Get('businesses/:businessProfileId/listings')
  async discoverByBusiness(
    @Param('businessProfileId') businessProfileId: string,
    @Query() query: GetListingsQueryDto,
  ): Promise<PaginatedListingsResponseDto> {
    const result = await this.discoverListings.execute({ ...query, businessProfileId });
    return PaginatedListingsResponseDto.from(result);
  }

  /**
   * GET /listings/:slug
   * Public listing detail page.
   */
  @Get('listings/:slug')
  async getBySlug(@Param('slug') slug: string): Promise<ListingResponseDto> {
    const listing = await this.getPublicListing.execute(slug);
    return ListingResponseDto.from(listing);
  }
}
