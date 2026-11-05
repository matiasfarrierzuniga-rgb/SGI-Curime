import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { AuthenticatedUser } from '../../domain/entities/auth-user';
import { isCanonicalRoleCode } from '../../domain/policies/canonical-role-catalog';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    // Legacy role names never confer authorization during RBAC V2 cutover.
    // New protected operations must use CapabilityGuard, not this transition guard.
    return Boolean(
      user &&
        user.canAccessErp &&
        isCanonicalRoleCode(user.role) &&
        requiredRoles.every(isCanonicalRoleCode) &&
        requiredRoles.includes(user.role),
    );
  }
}
