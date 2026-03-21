import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import {
  AuthService,
  GoogleOAuthGuard,
  CurrentUser,
  Public,
  type AuthResponse,
  type RequestUser,
  type AuthenticatedRequest,
} from '@odysseon/auth';
import { ApiResponse as AppApiResponse } from '@dto/api-response.dto';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  googleLogin(): void {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — issues token pair' })
  @ApiResponse({ status: 200, description: 'Token pair + user' })
  @ApiResponse({
    status: 401,
    description: 'Email not from @student.oauife.edu.ng',
  })
  async googleCallback(
    @Req() req: AuthenticatedRequest,
  ): Promise<AppApiResponse<AuthResponse>> {
    const result = await this.authService.handleGoogleCallback(req.user);
    return AppApiResponse.ok(result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token — returns new token pair' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'New token pair. Old token is now invalid.',
  })
  @ApiResponse({ status: 401, description: 'Token invalid or already used' })
  async refresh(
    @Body() body: RefreshTokenDto,
  ): Promise<AppApiResponse<AuthResponse>> {
    const result = await this.authService.rotateRefreshToken(body.refreshToken);
    return AppApiResponse.ok(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  @ApiResponse({ status: 204 })
  async logout(@CurrentUser() user: RequestUser): Promise<void> {
    await this.authService.logout(user.userId);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the decoded token payload' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401 })
  me(@CurrentUser() user: RequestUser): AppApiResponse<RequestUser> {
    return AppApiResponse.ok(user);
  }
}
