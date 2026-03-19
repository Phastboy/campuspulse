import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PassportModule } from '@nestjs/passport';
import { User } from '@infrastructure/entities/user.entity';
import { RefreshToken } from '@infrastructure/entities/refresh-token.entity';
import { MikroOrmUserReaderAdapter } from '@infrastructure/adapters/auth/mikro-orm-user-reader.adapter';
import { MikroOrmUserWriterAdapter } from '@infrastructure/adapters/auth/mikro-orm-user-writer.adapter';
import { MikroOrmRefreshTokenStoreAdapter } from '@infrastructure/adapters/auth/mikro-orm-refresh-token-store.adapter';
import { GoogleStrategy } from '@infrastructure/auth/google.strategy';
import { JwtAuthGuard } from '@infrastructure/http/jwt-auth.guard';
import { AuthService } from '@services/auth/auth.service';
import { AuthController } from '@controllers/auth/auth.controller';
import { USER_READER } from '@ports/auth/user-reader.port';
import { USER_WRITER } from '@ports/auth/user-writer.port';
import { REFRESH_TOKEN_STORE } from '@ports/auth/refresh-token-store.port';

@Module({
  imports: [PassportModule, MikroOrmModule.forFeature([User, RefreshToken])],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtAuthGuard,
    MikroOrmUserReaderAdapter,
    MikroOrmUserWriterAdapter,
    MikroOrmRefreshTokenStoreAdapter,
    { provide: USER_READER, useExisting: MikroOrmUserReaderAdapter },
    { provide: USER_WRITER, useExisting: MikroOrmUserWriterAdapter },
    {
      provide: REFRESH_TOKEN_STORE,
      useExisting: MikroOrmRefreshTokenStoreAdapter,
    },
  ],
  /** Export AuthService and JwtAuthGuard so other modules can protect routes. */
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
