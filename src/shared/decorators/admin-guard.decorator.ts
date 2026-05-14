import { applyDecorators, UseGuards } from '@nestjs/common';
import { PlatformRole } from '../../../generated/prisma/client.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from '../guards/roles.guard.js';

export function AdminGuard() {
  return applyDecorators(Roles(PlatformRole.ADMIN), UseGuards(RolesGuard));
}
