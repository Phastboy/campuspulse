import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IListingRepository } from '../../domain/ports/listing.repository.port.js';
import { UpdateListingInput } from '../../domain/types/listing.types.js';
import { Listing } from '../../domain/types/listing.entity.js';
import { IBusinessProfileRepository } from '../../../business-profile/domain/ports/business-profile.repository.port.js';
import { ICategoryRepository } from '../../../category/domain/ports/category.repository.port.js';
import { ValidateListingAttributesService } from '../services/validate-listing-attributes.service.js';

@Injectable()
export class UpdateListingUseCase {
  constructor(
    private readonly listingRepo: IListingRepository,
    private readonly businessRepo: IBusinessProfileRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly attributeValidator: ValidateListingAttributesService,
  ) {}

  async execute(id: string, requesterId: string, input: UpdateListingInput): Promise<Listing> {
    const listing = await this.listingRepo.findById(id);

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    await this.assertOwnership(listing.businessProfileId, requesterId);

    if (input.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId);

      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      if (!category.isActive) {
        throw new BadRequestException('Cannot update a listing to an inactive category.');
      }

      if (!category.parentId) {
        throw new BadRequestException('Listings must be assigned to a specific leaf category, not a root category.');
      }
    }

    if (input.attributes) {
      const targetCategoryId = input.categoryId ?? listing.categoryId;
      if (!targetCategoryId) {
        throw new BadRequestException('Cannot set attributes on a listing without a category.');
      }
      await this.attributeValidator.validate(targetCategoryId, input.attributes);
    }

    return this.listingRepo.update(id, input);
  }

  private async assertOwnership(businessProfileId: string, requesterId: string): Promise<void> {
    const profile = await this.businessRepo.findById(businessProfileId);

    if (!profile) {
      throw new NotFoundException('Business profile not found.');
    }

    if (profile.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this business profile.');
    }
  }
}
