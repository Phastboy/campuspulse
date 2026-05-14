import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BUSINESS_PROFILE_REPOSITORY_TOKEN,
  type IBusinessProfileRepository,
} from '../core/ports/business-profile.repository.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BusinessProfileResponseDto } from '../delivery/http/dto/business-profile-response.dto.js';
import { BusinessProfileMapper } from '../infrastructure/mappers/business-profile.mapper.js';

@Injectable()
export class GetMyBusinessProfilesUseCase {
  constructor(
    @Inject(BUSINESS_PROFILE_REPOSITORY_TOKEN)
    private readonly repository: IBusinessProfileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(accountId: string): Promise<BusinessProfileResponseDto[]> {
    const user = await this.prisma.user.findUnique({ where: { accountId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    const profiles = await this.repository.findByOwnerId(user.id);
    return profiles.map(BusinessProfileMapper.toResponse);
  }
}
