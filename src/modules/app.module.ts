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
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Loads a JWT key: env var takes precedence; falls back to reading the
 * PEM file from `keys/` for local development.
 *
 * Throws a clear startup error if neither source is available.
 */
function loadJwtKey(envValue: string | undefined, filename: string): string {
  if (envValue) return envValue;
  const filePath = resolve(process.cwd(), 'keys', filename);
  if (existsSync(filePath)) return readFileSync(filePath, 'utf8');
  throw new Error(
    `JWT key not found. Set ${filename === 'private.pem' ? 'JWT_PRIVATE_KEY' : 'JWT_PUBLIC_KEY'} ` +
      `env var, or run \`pnpm keys:generate\` to create keys/${filename}.`,
  );
}

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
          privateKey: loadJwtKey(cfg.get('JWT_PRIVATE_KEY'), 'private.pem'),
          publicKey: loadJwtKey(cfg.get('JWT_PUBLIC_KEY'), 'public.pem'),
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
