import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule, JwtAuthGuard } from '@odysseon/auth';
import { EventsModule } from './events.module';
import mikroOrmConfig from '@configs/mikro-orm.config';
import { validateConfig, type AppConfig } from '@configs/validation';
import { MikroOrmUserRepository } from '@infrastructure/adapters/auth/mikro-orm-user.repository';
import { MikroOrmRefreshTokenRepository } from '@infrastructure/adapters/auth/mikro-orm-refresh-token.repository';
import { User } from '@infrastructure/entities/user.entity';
import { RefreshToken } from '@infrastructure/entities/refresh-token.entity';
import { AuthController } from '@controllers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validate: validateConfig,
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    AuthModule.forRootAsync({
      imports: [ConfigModule, MikroOrmModule.forFeature([User, RefreshToken])],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService<AppConfig>) => ({
        jwt: {
          type: 'asymmetric' as const,
          privateKey: cfg.get('JWT_PRIVATE_KEY') as string,
          publicKey: cfg.get('JWT_PUBLIC_KEY') as string,
          accessToken: { expiresIn: '15m', algorithm: 'ES256' },
          refreshToken: { expiresIn: '7d' },
        },
        google: {
          clientID: cfg.get('GOOGLE_CLIENT_ID') as string,
          clientSecret: cfg.get('GOOGLE_CLIENT_SECRET') as string,
          callbackURL: cfg.get('GOOGLE_CALLBACK_URL') as string,
        },
      }),
      userRepository: MikroOrmUserRepository,
      refreshTokenRepository: MikroOrmRefreshTokenRepository,
      enabledCapabilities: ['google'],
    }),
    EventsModule,
  ],
  providers: [
    // Every route protected by default — use @Public() from @odysseon/auth to opt out.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  controllers: [AuthController],
})
export class AppModule {}
