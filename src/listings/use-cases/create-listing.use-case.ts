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

    // 2. Slug Generation
    const slug = this.generateSlug(payload.title);

    // 3. Persistence
    return this.repository.create(accountId, payload, slug);
  }

  private generateSlug(title: string): string {
    return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
  }
}
