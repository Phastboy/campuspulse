import { Inject, Injectable } from '@nestjs/common';
import {
  LISTING_REPOSITORY_TOKEN,
  type IListingRepository,
} from '../core/ports/listing.repository.interface.js';
import { CategoriesService } from '../../categories/use-cases/categories.service.js';
import { CreateListingDto } from '../delivery/http/dto/create-listing.dto.js';
import { ListingResponseDto } from '../delivery/http/dto/listing-response.dto.js';

@Injectable()
export class CreateListingUseCase {
  constructor(
    @Inject(LISTING_REPOSITORY_TOKEN)
    private readonly repository: IListingRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async execute(accountId: string, payload: CreateListingDto): Promise<ListingResponseDto> {
    // 1. Cross-Domain Validation
    // We delegate the "heavy lifting" of attribute checking to the Category domain.
    await this.categoriesService.validateAttributes(payload.categoryId, payload.attributes);

    return this.repository.create(accountId, payload);
  }
}
