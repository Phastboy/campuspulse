import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BUSINESS_PROFILE_REPOSITORY_TOKEN,
  type IBusinessProfileRepository,
} from '../core/ports/business-profile.repository.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateBusinessProfileDto } from '../delivery/http/dto/update-business-profile.dto.js';
import { BusinessProfileResponseDto } from '../delivery/http/dto/business-profile-response.dto.js';
import { BusinessProfileMapper } from '../infrastructure/mappers/business-profile.mapper.js';

@Injectable()
export class UpdateBusinessProfileUseCase {
  constructor(
    @Inject(BUSINESS_PROFILE_REPOSITORY_TOKEN)
    private readonly repository: IBusinessProfileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    id: string,
    accountId: string,
    payload: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { accountId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    const view = await this.repository.update(id, user.id, payload);
    return BusinessProfileMapper.toResponse(view);
  }
}
