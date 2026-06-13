import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IBusinessProfileRepository } from '../../domain/ports/business-profile.repository.port.js';
import { ITagRepository } from '../../domain/ports/tag.repository.port.js';

const MAX_TAGS_PER_BUSINESS = 5;

@Injectable()
export class SetBusinessTagsUseCase {
  constructor(
    private readonly businessRepo: IBusinessProfileRepository,
    private readonly tagRepo: ITagRepository,
  ) {}

  /**
   * Replaces tags for a business profile.
   * Only the business owner or an admin can update the tags.
   */
  async execute(
    businessId: string,
    tagIds: string[],
    requesterId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const business = await this.businessRepo.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business profile not found.');
    }

    if (business.ownerId !== requesterId && !isAdmin) {
      throw new ForbiddenException('Only the business owner can manage tags.');
    }

    // Ensure unique tags (ignore duplicates in the payload)
    const uniqueTagIds = Array.from(new Set(tagIds));

    if (uniqueTagIds.length > MAX_TAGS_PER_BUSINESS) {
      throw new BadRequestException(
        `A business profile can have a maximum of ${MAX_TAGS_PER_BUSINESS} tags.`,
      );
    }

    // Validate that all tags actually exist in the database
    if (uniqueTagIds.length > 0) {
      const existingTags = await this.tagRepo.findByIds(uniqueTagIds);
      if (existingTags.length !== uniqueTagIds.length) {
        throw new BadRequestException('One or more tag IDs provided do not exist.');
      }
    }

    await this.businessRepo.setTags(businessId, uniqueTagIds);
  }
}
