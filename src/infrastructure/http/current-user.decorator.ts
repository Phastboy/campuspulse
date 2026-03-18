import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from './jwt-auth.guard';
import { AccessTokenPayload } from '@application/types';

/**
 * Extracts the decoded token payload from a JWT-guarded request.
 * Only valid on routes protected by {@link JwtAuthGuard}.
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AccessTokenPayload =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
