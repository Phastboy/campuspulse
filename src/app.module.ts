import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from './configs/validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { StorageModule } from './storage/storage.module.js';
import { UsersModule } from './users/users.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ListingsModule } from './listings/listings.module.js';
import { BusinessesModule } from './businesses/businesses.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validate: validateConfig,
    }),
    PrismaModule,
    AuthModule,
    StorageModule.register(),
    UsersModule,
    CategoriesModule,
    ListingsModule,
    BusinessesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
