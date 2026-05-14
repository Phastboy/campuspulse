import { Inject, Injectable } from '@nestjs/common';
import {
  BUSINESS_PROFILE_REPOSITORY_TOKEN,
  type IBusinessProfileRepository,
} from '../core/ports/business-profile.repository.interface.js';
import { GetBusinessProfilesFilterDto } from '../delivery/http/dto/get-business-profiles-filter.dto.js';
import { PaginatedBusinessProfilesResponseDto } from '../delivery/http/dto/business-profile-response.dto.js';
import { BusinessProfileMapper } from '../infrastructure/mappers/business-profile.mapper.js';

@Injectable()
export class DiscoverBusinessProfilesUseCase {
  constructor(
    @Inject(BUSINESS_PROFILE_REPOSITORY_TOKEN)
    private readonly repository: IBusinessProfileRepository,
  ) {}

  async execute(
    filters: GetBusinessProfilesFilterDto,
  ): Promise<PaginatedBusinessProfilesResponseDto> {
    const { data, total } = await this.repository.findPublic(filters);
    return {
      data: data.map(BusinessProfileMapper.toResponse),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }
}
