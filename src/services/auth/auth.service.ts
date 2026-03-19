import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { randomUUID } from 'crypto';
import { type IUserReader, USER_READER } from '@ports/auth/user-reader.port';
import { type IUserWriter, USER_WRITER } from '@ports/auth/user-writer.port';
import {
  type IRefreshTokenStore,
  REFRESH_TOKEN_STORE,
} from '@ports/auth/refresh-token-store.port';
import { AccessTokenPayload, RefreshTokenPayload } from '@application/types';
import { IUser } from '@domain/interfaces';
import { AppConfig } from '@configs/validation';
import {
  loadJwtKeys,
  JWT_ACCESS_TTL_SECONDS,
  JWT_REFRESH_TTL_SECONDS,
} from '@configs/jwt.config';
import { GoogleProfile } from '@infrastructure/auth/google.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly privateKeyPem: string;
  private readonly publicKeyPem: string;
  private readonly issuer: string;

  constructor(
    @Inject(USER_READER) private readonly userReader: IUserReader,
    @Inject(USER_WRITER) private readonly userWriter: IUserWriter,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly tokenStore: IRefreshTokenStore,
    private readonly config: ConfigService<AppConfig>,
  ) {
    const { privateKey, publicKey } = loadJwtKeys();
    this.privateKeyPem = privateKey;
    this.publicKeyPem = publicKey;
    this.issuer = this.config.get('JWT_ISSUER') as string;
  }

  // ── Google login ──────────────────────────────────────────────────────────

  async handleGoogleLogin(profile: GoogleProfile): Promise<TokenPair> {
    let user = await this.userReader.findByGoogleId(profile.googleId);
    if (!user) {
      this.logger.log(`New user via Google: ${profile.email}`);
      user = await this.userWriter.create({
        googleId: profile.googleId,
        email: profile.email,
        username: profile.displayName,
      });
    }
    return this.issueTokenPair(user);
  }

  // ── Token issuance ────────────────────────────────────────────────────────

  async issueTokenPair(user: IUser): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user.id),
      this.signRefreshToken(user.id),
    ]);
    return { accessToken, refreshToken };
  }

  private async signAccessToken(userId: string): Promise<string> {
    const key = await importPKCS8(this.privateKeyPem, 'ES256');
    return new SignJWT({ sub: userId } satisfies AccessTokenPayload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer(this.issuer)
      .setIssuedAt()
      .setExpirationTime(`${JWT_ACCESS_TTL_SECONDS}s`)
      .sign(key);
  }

  private async signRefreshToken(userId: string): Promise<string> {
    const key = await importPKCS8(this.privateKeyPem, 'ES256');
    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + JWT_REFRESH_TTL_SECONDS * 1000);
    await this.tokenStore.save(userId, jti, expiresAt);
    return new SignJWT({ sub: userId, jti } satisfies RefreshTokenPayload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer(this.issuer)
      .setIssuedAt()
      .setExpirationTime(`${JWT_REFRESH_TTL_SECONDS}s`)
      .sign(key);
  }

  // ── Rotation ──────────────────────────────────────────────────────────────

  async rotate(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const record = await this.tokenStore.findValid(payload.jti);
    if (!record)
      throw new UnauthorizedException(
        'Refresh token is invalid or already used',
      );

    await this.tokenStore.delete(payload.jti); // invalidate before issuing new

    const user = await this.userReader.findById(record.userId);
    if (!user) throw new UnauthorizedException('User no longer exists');
    return this.issueTokenPair(user);
  }

  // ── Verification ──────────────────────────────────────────────────────────

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const key = await importSPKI(this.publicKeyPem, 'ES256');
      const { payload } = await jwtVerify(token, key, {
        issuer: this.issuer,
        algorithms: ['ES256'],
      });
      return { sub: payload.sub as string };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const key = await importSPKI(this.publicKeyPem, 'ES256');
      const { payload } = await jwtVerify(token, key, {
        issuer: this.issuer,
        algorithms: ['ES256'],
      });
      return { sub: payload.sub as string, jti: payload.jti as string };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.tokenStore.deleteAllForUser(userId);
    this.logger.log(`User ${userId} logged out from all devices`);
  }
}
