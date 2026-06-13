import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import { IListingRepository } from '../../domain/ports/listing.repository.port.js';
import { CreateListingInput } from '../../domain/types/listing.types.js';
import { Listing } from '../../domain/types/listing.entity.js';
import { ICategoryRepository } from '../../../category/domain/ports/category.repository.port.js';
import { ValidateListingAttributesService } from '../services/validate-listing-attributes.service.js';

@Injectable()
export class CreateListingUseCase {
  constructor(
    private readonly repo: IListingRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly attributeValidator: ValidateListingAttributesService,
  ) {}

  async execute(input: CreateListingInput): Promise<Listing> {
    const category = await this.categoryRepo.findById(input.categoryId);

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (!category.isActive) {
      throw new BadRequestException('Cannot create a listing under an inactive category.');
    }

    if (!category.parentId) {
      throw new BadRequestException('Listings must be assigned to a specific leaf category, not a root category.');
    }

    if (input.attributes) {
      await this.attributeValidator.validate(input.categoryId, input.attributes);
    }

    const slug = await this.deriveUniqueSlug(input.businessProfileId, input.title);
    return this.repo.create(input, slug);
  }

  private async deriveUniqueSlug(businessProfileId: string, title: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true });

    if (!(await this.repo.isSlugTaken(businessProfileId, base))) {
      return base;
    }

    for (let i = 0; i < 5; i++) {
      const candidate = `${base}-${Math.random().toString(36).slice(2, 7)}`;
      if (!(await this.repo.isSlugTaken(businessProfileId, candidate))) {
        return candidate;
      }
    }

    throw new ConflictException('Could not generate a unique slug. Please try a different title.');
  }
}
