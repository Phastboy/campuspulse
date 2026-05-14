import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BUSINESS_PROFILE_REPOSITORY_TOKEN,
  type IBusinessProfileRepository,
} from '../core/ports/business-profile.repository.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class DeleteBusinessProfileUseCase {
  constructor(
    @Inject(BUSINESS_PROFILE_REPOSITORY_TOKEN)
    private readonly repository: IBusinessProfileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, accountId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { accountId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    return this.repository.delete(id, user.id);
  }
}
