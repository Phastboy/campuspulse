import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  LISTING_REPOSITORY_TOKEN,
  type IListingRepository,
} from '../core/ports/listing.repository.interface.js';
import { ListingResponseDto } from '../delivery/http/dto/listing-response.dto.js';

/**
 * Business logic for retrieving the full details of a specific listing.
 * Used for the 'Details' or 'Product' page.
 */
@Injectable()
export class GetListingDetailUseCase {
  constructor(
    @Inject(LISTING_REPOSITORY_TOKEN)
    private readonly repository: IListingRepository,
  ) {}

  /**
   * Executes the retrieval of a single listing by its slug.
   *
   * @param slug - The unique URL-friendly identifier.
   * @returns The complete listing including all dynamic attributes and relations.
   * @throws NotFoundException if the listing does not exist.
   */
  async execute(slug: string): Promise<ListingResponseDto> {
    const listing = await this.repository.findBySlug(slug);

    if (!listing) {
      throw new NotFoundException(`Listing with slug "${slug}" not found.`);
    }

    return listing;
  }
}
