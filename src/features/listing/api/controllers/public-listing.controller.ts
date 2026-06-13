import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { Public } from '@odysseon/whoami-adapter-nestjs';
import { DiscoverListingsUseCase } from '../../application/use-cases/discover-listings.use-case.js';
import { GetPublicListingUseCase } from '../../application/use-cases/get-public-listing.use-case.js';
import { GetListingsQueryDto } from '../dto/request.dto.js';
import { ListingResponseDto, PaginatedListingsResponseDto } from '../dto/response.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { IBusinessProfileRepository } from '../../../business-profile/domain/ports/business-profile.repository.port.js';

@ApiTags('Listing Public Surface')
@Public()
@Controller()
export class PublicListingController {
  constructor(
    private readonly discoverListings: DiscoverListingsUseCase,
    private readonly getPublicListing: GetPublicListingUseCase,
    private readonly businessRepo: IBusinessProfileRepository,
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
  @Get('businesses/:businessSlug/listings')
  async discoverByBusiness(
    @Param('businessSlug') businessSlug: string,
    @Query() query: GetListingsQueryDto,
  ): Promise<PaginatedListingsResponseDto> {
    const businessProfileId = await this.resolveBusinessSlug(businessSlug);
    const result = await this.discoverListings.execute({ ...query, businessProfileId });
    return PaginatedListingsResponseDto.from(result);
  }

  private async resolveBusinessSlug(slug: string): Promise<string> {
    const profile = await this.businessRepo.findBySlug(slug);
    
    if (!profile) {
      throw new NotFoundException('Business profile not found.');
    }
    
    return profile.id;
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
