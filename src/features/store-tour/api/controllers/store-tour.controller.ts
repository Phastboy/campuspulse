import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentIdentity, Public } from '@odysseon/whoami-adapter-nestjs';
import type { RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreateStoreTourUseCase } from '../../application/use-cases/create-store-tour.use-case.js';
import { UpdateStoreTourUseCase } from '../../application/use-cases/update-store-tour.use-case.js';
import { DeleteStoreTourUseCase } from '../../application/use-cases/delete-store-tour.use-case.js';
import { GetStoreTourUseCase } from '../../application/use-cases/get-store-tour.use-case.js';
import { GetBusinessStoreToursUseCase } from '../../application/use-cases/get-business-store-tours.use-case.js';
import { CreateStoreTourDto, UpdateStoreTourDto } from '../dto/request.dto.js';
import { StoreTourResponseDto, PaginatedStoreToursResponseDto } from '../dto/response.dto.js';
import { StoreTourStatus } from '../../domain/types/store-tour.entity.js';

import { ModeratorOrAdminGuard } from '../../../../shared/decorators/moderator-or-admin-guard.decorator.js';

@ApiTags('Store Tours')
@Controller()
export class StoreTourController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createStoreTour: CreateStoreTourUseCase,
    private readonly updateStoreTour: UpdateStoreTourUseCase,
    private readonly deleteStoreTour: DeleteStoreTourUseCase,
    private readonly getStoreTour: GetStoreTourUseCase,
    private readonly getBusinessStoreTours: GetBusinessStoreToursUseCase,
  ) {}

  @Post('business-profiles/:businessProfileId/store-tours')
  @ModeratorOrAdminGuard()
  async create(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('businessProfileId') businessProfileId: string,
    @Body() dto: CreateStoreTourDto,
  ): Promise<StoreTourResponseDto> {
    const createdById = await this.resolveUserId(identity.accountId);
    const tour = await this.createStoreTour.execute({
      businessProfileId,
      title: dto.title,
      ...(dto.summary !== undefined && { summary: dto.summary }),
      visitDate: new Date(dto.visitDate),
      ...(dto.highlights !== undefined && { highlights: dto.highlights }),
      createdById,
    });
    return StoreTourResponseDto.from(tour);
  }

  @Public()
  @Get('business-profiles/:businessProfileId/store-tours')
  async listByBusiness(
    @Param('businessProfileId') businessProfileId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: StoreTourStatus,
  ): Promise<PaginatedStoreToursResponseDto> {
    const pageNum = parseInt(page ?? '1', 10);
    const limitNum = parseInt(limit ?? '20', 10);
    const paginated = await this.getBusinessStoreTours.execute({
      businessProfileId,
      ...(status !== undefined && { status }),
      page: isNaN(pageNum) ? 1 : pageNum,
      limit: isNaN(limitNum) ? 20 : limitNum,
    });
    return PaginatedStoreToursResponseDto.from(paginated);
  }

  @Public()
  @Get('store-tours/:id')
  async get(@Param('id') id: string): Promise<StoreTourResponseDto> {
    const tour = await this.getStoreTour.execute(id);
    return StoreTourResponseDto.from(tour);
  }

  @Patch('store-tours/:id')
  @ModeratorOrAdminGuard()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreTourDto,
  ): Promise<StoreTourResponseDto> {
    const tour = await this.updateStoreTour.execute(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.summary !== undefined && { summary: dto.summary }),
      ...(dto.visitDate !== undefined && { visitDate: new Date(dto.visitDate) }),
      ...(dto.highlights !== undefined && { highlights: dto.highlights }),
      ...(dto.status !== undefined && { status: dto.status }),
    });
    return StoreTourResponseDto.from(tour);
  }

  @Delete('store-tours/:id')
  @ModeratorOrAdminGuard()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteStoreTour.execute(id);
  }

  private async resolveUserId(accountId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user.id;
  }
}
