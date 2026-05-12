import { Inject, Injectable } from '@nestjs/common';
import {
  LISTING_REPOSITORY_TOKEN,
  type IListingRepository,
} from '../core/ports/listing.repository.interface.js';
import { GetListingsFilterDto } from '../delivery/http/dto/get-listings-filter.dto.js';
import { PaginatedListingsResponseDto } from '../delivery/http/dto/listing-response.dto.js';

@Injectable()
export class DiscoverListingsUseCase {
  constructor(
    @Inject(LISTING_REPOSITORY_TOKEN)
    private readonly repository: IListingRepository,
  ) {}

  async execute(filters: GetListingsFilterDto): Promise<PaginatedListingsResponseDto> {
    const { data, total } = await this.repository.findMany(filters);

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }
}
