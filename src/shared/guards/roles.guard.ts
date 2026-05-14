import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import { PlatformRole } from "../../../generated/prisma/client.js";
import type { RequestIdentity } from "@odysseon/whoami-adapter-nestjs";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{
      whoami?: { identity: RequestIdentity };
    }>();

    const accountId = request.whoami?.identity?.accountId;
    if (!accountId) {
      throw new ForbiddenException("Authentication required to verify roles");
    }

    // Lookup the single role from the User model
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: { role: true },
    });

    if (!user) throw new ForbiddenException("User profile not found");

    // Simple check: Is the user's role one of the roles allowed for this endpoint?
    const hasPermission = requiredRoles.includes(user.role);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: [${requiredRoles.join(", ")}]`,
      );
    }

    return true;
  }
}
