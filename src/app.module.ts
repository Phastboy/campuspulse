import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from './configs/validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { StorageModule } from './storage/storage.module.js';
import { UsersModule } from './users/users.module.js';
import { BusinessProfileModule } from './features/business-profile/business-profile.module.js';
import { TagModule } from './features/tag/tag.module.js';

import { ListingModule } from './features/listing/listing.module.js';
import { MediaModule } from './features/media/media.module.js';
import { CategoryModule } from './features/category/category.module.js';
import { ReviewModule } from './features/review/review.module.js';
import { StoreTourModule } from './features/store-tour/store-tour.module.js';

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
    CategoryModule,
    TagModule,
    BusinessProfileModule,
    ListingModule,
    MediaModule,

    ReviewModule,
    StoreTourModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
