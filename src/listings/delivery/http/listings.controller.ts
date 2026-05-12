import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListingsService } from '../../use-cases/listings.service.js';
import { GetListingsFilterDto } from './dto/get-listings-filter.dto.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { ListingResponseDto, PaginatedListingsResponseDto } from './dto/listing-response.dto.js';
import { Public, CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search and filter listings' })
  @ApiResponse({ status: 200, type: PaginatedListingsResponseDto })
  async getListings(@Query() filters: GetListingsFilterDto): Promise<PaginatedListingsResponseDto> {
    return this.listingsService.discoverListings(filters);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get full listing details by slug' })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async getListing(@Param('slug') slug: string): Promise<ListingResponseDto> {
    return this.listingsService.getListingBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({ status: 201, type: ListingResponseDto })
  async createListing(
    @Body() payload: CreateListingDto,
    @CurrentIdentity() identity: RequestIdentity,
  ): Promise<ListingResponseDto> {
    return this.listingsService.createListing(identity.accountId, payload);
  }
}
