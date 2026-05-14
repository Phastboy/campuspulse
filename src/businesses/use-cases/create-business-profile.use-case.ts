import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BUSINESS_PROFILE_REPOSITORY_TOKEN,
  type IBusinessProfileRepository,
} from '../core/ports/business-profile.repository.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateBusinessProfileDto } from '../delivery/http/dto/create-business-profile.dto.js';
import { BusinessProfileResponseDto } from '../delivery/http/dto/business-profile-response.dto.js';
import { BusinessProfileMapper } from '../infrastructure/mappers/business-profile.mapper.js';

@Injectable()
export class CreateBusinessProfileUseCase {
  constructor(
    @Inject(BUSINESS_PROFILE_REPOSITORY_TOKEN)
    private readonly repository: IBusinessProfileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    accountId: string,
    payload: CreateBusinessProfileDto,
  ): Promise<BusinessProfileResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { accountId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    const view = await this.repository.create(user.id, payload);
    return BusinessProfileMapper.toResponse(view);
  }
}
