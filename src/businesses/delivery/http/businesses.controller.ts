import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { CreateBusinessProfileUseCase } from '../../use-cases/create-business-profile.use-case.js';
import { UpdateBusinessProfileUseCase } from '../../use-cases/update-business-profile.use-case.js';
import { DeleteBusinessProfileUseCase } from '../../use-cases/delete-business-profile.use-case.js';
import { DiscoverBusinessProfilesUseCase } from '../../use-cases/discover-business-profiles.use-case.js';
import { GetBusinessProfileBySlugUseCase } from '../../use-cases/get-business-profile-by-slug.use-case.js';
import { GetMyBusinessProfilesUseCase } from '../../use-cases/get-my-business-profiles.use-case.js';
import { GetBusinessListingsUseCase } from '../../use-cases/get-business-listings.use-case.js';
import { CreateBusinessProfileDto } from './dto/create-business-profile.dto.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';
import { GetBusinessProfilesFilterDto } from './dto/get-business-profiles-filter.dto.js';
import {
  BusinessProfileResponseDto,
  PaginatedBusinessProfilesResponseDto,
} from './dto/business-profile-response.dto.js';
import { ListingResponseDto } from '../../../listings/delivery/http/dto/listing-response.dto.js';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly createUseCase: CreateBusinessProfileUseCase,
    private readonly updateUseCase: UpdateBusinessProfileUseCase,
    private readonly deleteUseCase: DeleteBusinessProfileUseCase,
    private readonly discoverUseCase: DiscoverBusinessProfilesUseCase,
    private readonly getBySlugUseCase: GetBusinessProfileBySlugUseCase,
    private readonly getMyProfilesUseCase: GetMyBusinessProfilesUseCase,
    private readonly getBusinessListingsUseCase: GetBusinessListingsUseCase,
  ) {}

  @Public()
  @Get()
  async discover(
    @Query() filters: GetBusinessProfilesFilterDto,
  ): Promise<PaginatedBusinessProfilesResponseDto> {
    return this.discoverUseCase.execute(filters);
  }

  @Public()
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<BusinessProfileResponseDto> {
    return this.getBySlugUseCase.execute(slug);
  }

  @Public()
  @Get(':slug/listings')
  async getListings(@Param('slug') slug: string): Promise<ListingResponseDto[]> {
    return this.getBusinessListingsUseCase.execute(slug);
  }

  @Post()
  async create(
    @Body() payload: CreateBusinessProfileDto,
    @CurrentIdentity() identity: RequestIdentity,
  ): Promise<BusinessProfileResponseDto> {
    return this.createUseCase.execute(identity.accountId, payload);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateBusinessProfileDto,
    @CurrentIdentity() identity: RequestIdentity,
  ): Promise<BusinessProfileResponseDto> {
    return this.updateUseCase.execute(id, identity.accountId, payload);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentIdentity() identity: RequestIdentity,
  ): Promise<void> {
    return this.deleteUseCase.execute(id, identity.accountId);
  }
}
