import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '@services/auth/auth.service';
import { JwtAuthGuard } from '@infrastructure/http/jwt-auth.guard';
import { GoogleOAuthGuard } from '@infrastructure/http/google-oauth.guard';
import { CurrentUser } from '@infrastructure/http/current-user.decorator';
import { type AccessTokenPayload } from '@application/types';
import { ApiResponse as AppApiResponse } from '@dto/api-response.dto';
import { GoogleProfile } from '@infrastructure/auth/google.strategy';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  googleLogin(): void {
    /* guard handles redirect */
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — issues token pair' })
  @ApiResponse({ status: 200 })
  async googleCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res({ passthrough: true }) res: Response,
  ): Promise<AppApiResponse<{ accessToken: string }>> {
    const { accessToken, refreshToken } =
      await this.authService.handleGoogleLogin(req.user);
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...COOKIE_BASE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return AppApiResponse.ok({ accessToken });
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AppApiResponse<{ accessToken: string }>> {
    const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('No refresh token provided');

    const { accessToken, refreshToken } = await this.authService.rotate(token);
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...COOKIE_BASE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return AppApiResponse.ok({ accessToken });
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  @ApiResponse({ status: 204 })
  async logout(
    @CurrentUser() user: AccessTokenPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(user.sub);
    res.clearCookie(REFRESH_COOKIE, COOKIE_BASE);
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the decoded access token payload' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  me(
    @CurrentUser() user: AccessTokenPayload,
  ): AppApiResponse<AccessTokenPayload> {
    return AppApiResponse.ok(user);
  }
}
