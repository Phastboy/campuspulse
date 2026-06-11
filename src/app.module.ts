import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
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
import { MailModule } from './mail/mail.module.js';
import { RedisModule } from './shared/redis/redis.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validate: validateConfig,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
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
    MailModule,
    RedisModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
