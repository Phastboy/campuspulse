import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BUSINESS_PROFILE_REPOSITORY_TOKEN,
  type IBusinessProfileRepository,
} from '../core/ports/business-profile.repository.interface.js';
import { BusinessProfileResponseDto } from '../delivery/http/dto/business-profile-response.dto.js';
import { BusinessProfileMapper } from '../infrastructure/mappers/business-profile.mapper.js';

@Injectable()
export class GetBusinessProfileBySlugUseCase {
  constructor(
    @Inject(BUSINESS_PROFILE_REPOSITORY_TOKEN)
    private readonly repository: IBusinessProfileRepository,
  ) {}

  async execute(slug: string): Promise<BusinessProfileResponseDto> {
    const profile = await this.repository.findBySlug(slug);

    if (!profile) throw new NotFoundException(`Business profile "${slug}" not found`);
    if (!profile.isPublic) throw new NotFoundException(`Business profile "${slug}" not found`);

    return BusinessProfileMapper.toResponse(profile);
  }
}
