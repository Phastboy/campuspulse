import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '@odysseon/whoami-adapter-nestjs';
import { DiscoverBusinessesUseCase } from '../../application/use-cases/discover-businesses.use-case.js';
import { GetPublicBusinessProfileUseCase } from '../../application/use-cases/get-public-business-profile.use-case.js';
import { GetTagsUseCase } from '../../application/use-cases/get-tags.use-case.js';
import { GetBusinessesQueryDto } from '../dto/request.dto.js';
import { BusinessProfileResponseDto, PaginatedBusinessesResponseDto } from '../dto/response.dto.js';
import { TagDto } from '../dto/tag.dto.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('businesses public access')
@Public()
@Controller('businesses')
export class PublicBusinessProfileController {
  constructor(
    private readonly discoverBusinesses: DiscoverBusinessesUseCase,
    private readonly getPublicBusinessProfile: GetPublicBusinessProfileUseCase,
    private readonly getTags: GetTagsUseCase,
  ) {}

  @Get()
  async discover(@Query() query: GetBusinessesQueryDto): Promise<PaginatedBusinessesResponseDto> {
    const result = await this.discoverBusinesses.execute(query);
    return PaginatedBusinessesResponseDto.from(result);
  }

  @Get('tags/all')
  async getAllTags(): Promise<TagDto[]> {
    const tags = await this.getTags.execute();
    return tags.map((t) => TagDto.from(t));
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<BusinessProfileResponseDto> {
    const profile = await this.getPublicBusinessProfile.execute(slug);
    return BusinessProfileResponseDto.from(profile);
  }
}
