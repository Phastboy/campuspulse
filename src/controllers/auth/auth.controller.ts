import {
  Controller,
  Get,
  Post,
  Req,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from '@services/auth/auth.service';
import { JwtAuthGuard } from '@infrastructure/http/jwt-auth.guard';
import { GoogleOAuthGuard } from '@infrastructure/http/google-oauth.guard';
import { CurrentUser } from '@infrastructure/http/current-user.decorator';
import { type AccessTokenPayload } from '@application/types';
import { ApiResponse as AppApiResponse } from '@dto/api-response.dto';
import { GoogleProfile } from '@infrastructure/auth/google.strategy';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

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
  ): Promise<AppApiResponse<{ accessToken: string; refreshToken: string }>> {
    const tokens = await this.authService.handleGoogleLogin(req.user);
    return AppApiResponse.ok(tokens);
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new token pair' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  async refresh(
    @Body() body: RefreshTokenDto,
  ): Promise<AppApiResponse<{ accessToken: string; refreshToken: string }>> {
    if (!body.refreshToken)
      throw new UnauthorizedException('No refresh token provided');
    const tokens = await this.authService.rotate(body.refreshToken);
    return AppApiResponse.ok(tokens);
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  @ApiResponse({ status: 204 })
  async logout(@CurrentUser() user: AccessTokenPayload): Promise<void> {
    await this.authService.logout(user.sub);
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
