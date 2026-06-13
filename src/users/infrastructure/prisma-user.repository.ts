import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IUserRepository } from '../core/ports/user.repository.interface.js';
import { UpdateUserProfileDto } from '../delivery/http/dto/update-user-profile.dto.js';
import { UserEntity } from '../core/domain/user.types.js';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAccountId(accountId: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      include: {
        account: true,
      },
    });

    if (!user) return null;

    return { ...user, role: user.role };
  }

  async updateProfile(accountId: string, payload: UpdateUserProfileDto): Promise<UserEntity> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { accountId },
        data: {
          ...(payload.name !== undefined && { name: payload.name }),
          ...(payload.avatarUrl !== undefined && { avatarUrl: payload.avatarUrl }),
          ...(payload.avatarId !== undefined && { avatarId: payload.avatarId }),
          ...(payload.phoneNumber !== undefined && { phoneNumber: payload.phoneNumber }),
        },
      });

      return { ...updatedUser, role: updatedUser.role };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025' // Prisma "Record to update not found" code
      ) {
        throw new NotFoundException('User profile not found for this account.');
      }
      throw error;
    }
  }
}
