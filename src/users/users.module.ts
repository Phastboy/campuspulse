import { Module } from '@nestjs/common';
import { UsersController } from './delivery/http/users.controller.js';
import { UsersService } from './use-cases/users.service.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { USER_REPOSITORY_TOKEN } from './core/ports/user.repository.interface.js';
import { BusinessesModule } from '../businesses/businesses.module.js';

@Module({
  imports: [BusinessesModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
