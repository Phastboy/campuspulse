import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '@services/auth/auth.service';
import { AccessTokenPayload } from '@application/types';

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

/**
 * Validates the ES256 access token from `Authorization: Bearer <token>`.
 * Attaches decoded payload to `request.user` on success.
 * Trusts the token until expiry — no DB lookup per request.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearer(req);
    if (!token) throw new UnauthorizedException('No access token provided');
    req.user = await this.authService.verifyAccessToken(token);
    return true;
  }

  private extractBearer(req: Request): string | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
