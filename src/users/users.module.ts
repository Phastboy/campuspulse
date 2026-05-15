import { Module } from '@nestjs/common';
import { UsersController } from './delivery/http/users.controller.js';
import { UsersService } from './use-cases/users.service.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { USER_REPOSITORY_TOKEN } from './core/ports/user.repository.interface.js';
import { UploadUserAvatarUseCase } from './use-cases/upload-user-avatar.use-case.js';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UploadUserAvatarUseCase,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
