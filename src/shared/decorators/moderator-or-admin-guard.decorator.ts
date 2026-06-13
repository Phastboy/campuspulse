import { applyDecorators, UseGuards } from '@nestjs/common';
import { PlatformRole } from '../../../generated/prisma/client.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from '../guards/roles.guard.js';

export function ModeratorOrAdminGuard() {
  return applyDecorators(Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN), UseGuards(RolesGuard));
}
