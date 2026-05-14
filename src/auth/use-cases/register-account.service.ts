import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import { moduleToken } from '@odysseon/whoami-adapter-nestjs';
import type { PasswordMethods } from '@odysseon/whoami-core/password';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from '../dto/index.js';

@Injectable()
export class RegisterAccountUseCase {
  private readonly logger = new Logger(RegisterAccountUseCase.name);

  constructor(
    @Inject(moduleToken('password'))
    private readonly passwordAuth: PasswordMethods,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: RegisterDto) {
    // 1. Create Identity (Executes outside domain transaction)
    const { account } = await this.passwordAuth.registerWithPassword({
      email: dto.email,
      password: dto.password,
    });

    try {
      // 2. Create Domain User
      const user = await this.prisma.user.create({
        data: {
          accountId: account.id,
          name: dto.name,
        },
      });

      return {
        accountId: account.id,
        userId: user.id,
        email: account.email,
        name: user.name,
        createdAt: account.createdAt,
      };
    } catch (error: unknown) {
      // 3. COMPENSATING ROLLBACK
      this.logger.warn(`Registration failed for ${account.email}. Rolling back identity creation.`);

      await this.prisma.account
        .delete({ where: { id: account.id } })
        .catch((err) =>
          this.logger.error(`FATAL: Failed to rollback orphaned account ${account.id}`, err),
        );

      // check for Prisma unique constraint violation
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }
}
