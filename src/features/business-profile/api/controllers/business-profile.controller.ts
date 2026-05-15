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
} from '@nestjs/common';
import { CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { CreateBusinessProfileUseCase } from '../../application/use-cases/create-business-profile.use-case.js';
import { DeleteBusinessProfileUseCase } from '../../application/use-cases/delete-business-profile.use-case.js';
import { GetMyBusinessProfilesUseCase } from '../../application/use-cases/get-my-business-profiles.use-case.js';
import { UpdateBusinessProfileUseCase } from '../../application/use-cases/update-business-profile.use-case.js';
import { CreateBusinessProfileDto, UpdateBusinessProfileDto } from '../dto/request.dto.js';
import { BusinessProfileResponseDto } from '../dto/response.dto.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Controller()
export class BusinessProfileController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createBusinessProfile: CreateBusinessProfileUseCase,
    private readonly updateBusinessProfile: UpdateBusinessProfileUseCase,
    private readonly deleteBusinessProfile: DeleteBusinessProfileUseCase,
    private readonly getMyBusinessProfiles: GetMyBusinessProfilesUseCase,
  ) { }

  @Post('businesses')
  async create(
    @CurrentIdentity() identity: RequestIdentity,
    @Body() dto: CreateBusinessProfileDto,
  ): Promise<BusinessProfileResponseDto> {
    const userId = await this.resolveUserId(identity.accountId);

    const profile = await this.createBusinessProfile.execute({
      ownerId: userId,
      name: dto.name,
      businessType: dto.businessType,
      description: dto.description,
      phoneNumber: dto.phoneNumber,
      whatsapp: dto.whatsapp,
      email: dto.email,
      location: dto.location,
    });

    return BusinessProfileResponseDto.from(profile);
  }

  @Patch('businesses/:id')
  async update(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileResponseDto> {
    const userId = await this.resolveUserId(identity.accountId);

    const profile = await this.updateBusinessProfile.execute(id, userId, {
      name: dto.name,
      businessType: dto.businessType,
      description: dto.description,
      phoneNumber: dto.phoneNumber,
      whatsapp: dto.whatsapp,
      email: dto.email,
      location: dto.location,
      isPublic: dto.isPublic,
    });

    return BusinessProfileResponseDto.from(profile);
  }

  @Delete('businesses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentIdentity() identity: RequestIdentity,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = await this.resolveUserId(identity.accountId);
    await this.deleteBusinessProfile.execute(id, userId);
  }

  @Get('users/me/businesses')
  async getMyProfiles(
    @CurrentIdentity() identity: RequestIdentity,
  ): Promise<BusinessProfileResponseDto[]> {
    const userId = await this.resolveUserId(identity.accountId);
    const profiles = await this.getMyBusinessProfiles.execute(userId);
    return profiles.map((p) => BusinessProfileResponseDto.from(p));
  }

  private async resolveUserId(accountId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return user.id;
  }
}

