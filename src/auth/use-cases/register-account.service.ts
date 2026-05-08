import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { moduleToken } from '@odysseon/whoami-adapter-nestjs';
import type { PasswordMethods } from '@odysseon/whoami-core/password';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from '../dto/index.js';

@Injectable()
export class RegisterAccountUseCase {
  constructor(
    @Inject(moduleToken('password'))
    private readonly passwordAuth: PasswordMethods,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: RegisterDto) {
    // We use a transaction to ensure that if the User creation fails,
    // we don't end up with an "orphaned" Account.
    return this.prisma.$transaction(async (tx) => {
      try {
        // 1. Create the identity record via Whoami
        const { account } = await this.passwordAuth.registerWithPassword({
          email: dto.email,
          password: dto.password,
        });

        // 2. Create the domain User linked to that account
        const user = await tx.user.create({
          data: {
            accountId: account.id,
            name: dto.name,
            role: 'VENUE_OWNER',
          },
        });

        return {
          accountId: account.id,
          userId: user.id,
          email: account.email,
          name: user.name,
        };
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
        throw error;
      }
    });
  }
}
