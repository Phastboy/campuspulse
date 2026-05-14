import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BUSINESS_PROFILE_REPOSITORY_TOKEN,
  type IBusinessProfileRepository,
} from '../core/ports/business-profile.repository.interface.js';
import {
  LISTING_REPOSITORY_TOKEN,
  type IListingRepository,
} from '../../listings/core/ports/listing.repository.interface.js';
import { ListingResponseDto } from '../../listings/delivery/http/dto/listing-response.dto.js';

@Injectable()
export class GetBusinessListingsUseCase {
  constructor(
    @Inject(BUSINESS_PROFILE_REPOSITORY_TOKEN)
    private readonly businessRepository: IBusinessProfileRepository,
    @Inject(LISTING_REPOSITORY_TOKEN)
    private readonly listingRepository: IListingRepository,
  ) {}

  async execute(slug: string): Promise<ListingResponseDto[]> {
    const profile = await this.businessRepository.findBySlug(slug);

    if (!profile || !profile.isPublic) {
      throw new NotFoundException(`Business profile "${slug}" not found`);
    }

    const listings = await this.listingRepository.findByBusinessProfileId(profile.id);

    // ListingView is structurally identical to ListingResponseDto — cast is safe.
    // If they diverge, introduce a ListingMapper.toResponse here.
    return listings;
  }
}
