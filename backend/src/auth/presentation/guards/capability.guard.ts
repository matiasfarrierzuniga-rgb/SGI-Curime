import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { hasCapability } from '../capabilities/capability-policy';
import { CAPABILITIES_KEY } from '../decorators/require-capabilities.decorator';
import type { AuthenticatedUser } from '../../domain/entities/auth-user';

@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredCapabilities = this.reflector.getAllAndOverride<string[]>(
      CAPABILITIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredCapabilities?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    return Boolean(
      user &&
        requiredCapabilities.every((capability) =>
          hasCapability(user.role, capability),
        ),
    );
  }
}
