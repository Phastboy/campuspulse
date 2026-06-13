import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { DeleteBusinessProfileUseCase } from '../../application/use-cases/delete-business-profile.use-case.js';
import { GetMyBusinessProfilesUseCase } from '../../application/use-cases/get-my-business-profiles.use-case.js';
import { UpdateBusinessProfileUseCase } from '../../application/use-cases/update-business-profile.use-case.js';
import { CreateBusinessDraftUseCase } from '../../application/use-cases/create-business-draft.use-case.js';
import { RequestDraftVerificationUseCase } from '../../application/use-cases/request-draft-verification.use-case.js';
import { VerifyDraftAndPublishUseCase } from '../../application/use-cases/verify-draft-and-publish.use-case.js';
import { SetOperatingHoursUseCase } from '../../application/use-cases/set-operating-hours.use-case.js';
import { SetBusinessTagsUseCase } from '../../application/use-cases/set-business-tags.use-case.js';
import { GetDashboardStatsUseCase } from '../../application/use-cases/get-dashboard-stats.use-case.js';
import { CreateBusinessProfileDto, UpdateBusinessProfileDto } from '../dto/request.dto.js';
import { BusinessProfileResponseDto, DashboardStatsResponseDto } from '../dto/response.dto.js';
import { SetOperatingHoursDto } from '../dto/operating-hours.dto.js';
import { SetTagsDto } from '../dto/tag.dto.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('businesses management')
@Controller()
export class BusinessProfileController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createBusinessDraft: CreateBusinessDraftUseCase,
    private readonly requestDraftVerification: RequestDraftVerificationUseCase,
    private readonly verifyDraftAndPublish: VerifyDraftAndPublishUseCase,
    private readonly updateBusinessProfile: UpdateBusinessProfileUseCase,
    private readonly deleteBusinessProfile: DeleteBusinessProfileUseCase,
    private readonly getMyBusinessProfiles: GetMyBusinessProfilesUseCase,
    private readonly setOperatingHours: SetOperatingHoursUseCase,
    private readonly setBusinessTags: SetBusinessTagsUseCase,
    private readonly getDashboardStats: GetDashboardStatsUseCase,
  ) {}

  @Post('businesses/drafts')
  async createDraft(
    @CurrentIdentity() identity: RequestIdentity,
    @Body() dto: CreateBusinessProfileDto,
  ) {
    const { id: userId } = await this.resolveUser(identity.accountId);
    return await this.createBusinessDraft.execute(userId, dto as any);
  }

  @Post('businesses/drafts/:id/request-verification')
  @HttpCode(HttpStatus.OK)
  async requestVerification(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
  ) {
    const { id: userId } = await this.resolveUser(identity.accountId);
    return await this.requestDraftVerification.execute(id, userId);
  }

  @Post('businesses/drafts/:id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyDraft(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
    @Body('otp') otp: string,
  ): Promise<BusinessProfileResponseDto> {
    const { id: userId } = await this.resolveUser(identity.accountId);
    const profile = await this.verifyDraftAndPublish.execute(id, userId, otp);
    return BusinessProfileResponseDto.from(profile);
  }

  @Patch('businesses/:id')
  async update(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileResponseDto> {
    const { id: userId } = await this.resolveUser(identity.accountId);

    const profile = await this.updateBusinessProfile.execute(id, userId, {
      ...dto,
    });

    return BusinessProfileResponseDto.from(profile);
  }

  @Delete('businesses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
  ): Promise<void> {
    const { id: userId } = await this.resolveUser(identity.accountId);
    await this.deleteBusinessProfile.execute(id, userId);
  }

  @Get('users/me/businesses')
  async getMyProfiles(
    @CurrentIdentity() identity: RequestIdentity,
  ): Promise<BusinessProfileResponseDto[]> {
    const { id: userId } = await this.resolveUser(identity.accountId);
    const profiles = await this.getMyBusinessProfiles.execute(userId);
    return profiles.map((p) => BusinessProfileResponseDto.from(p));
  }

  @Get('businesses/:id/dashboard-stats')
  async getStats(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
  ): Promise<DashboardStatsResponseDto> {
    const { id: userId } = await this.resolveUser(identity.accountId);
    const stats = await this.getDashboardStats.execute(id, userId);
    return stats;
  }

  @Put('businesses/:id/hours')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateHours(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
    @Body() dto: SetOperatingHoursDto,
  ): Promise<void> {
    const { id: userId, isAdmin } = await this.resolveUser(identity.accountId);
    await this.setOperatingHours.execute(id, dto.hours, userId, isAdmin);
  }

  @Put('businesses/:id/tags')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateTags(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
    @Body() dto: SetTagsDto,
  ): Promise<void> {
    const { id: userId, isAdmin } = await this.resolveUser(identity.accountId);
    await this.setBusinessTags.execute(id, dto.tagIds, userId, isAdmin);
  }

  private async resolveUser(accountId: string): Promise<{ id: string; isAdmin: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return {
      id: user.id,
      isAdmin: user.role === 'ADMIN',
    };
  }
}
