import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { hasPersistedCapability } from '../capabilities/capability-policy';
import {
  CAPABILITY_BY_BODY_VALUE_KEY,
  type CapabilityByBodyValueRequirement,
} from '../decorators/require-capability-by-body-value.decorator';
import { CAPABILITIES_KEY } from '../decorators/require-capabilities.decorator';
import type { AuthenticatedUser } from '../../domain/entities/auth-user';

function isBodyValueRequirement(
  value: unknown,
): value is CapabilityByBodyValueRequirement {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as CapabilityByBodyValueRequirement).field === 'string' &&
    typeof (value as CapabilityByBodyValueRequirement).capabilities === 'object'
  );
}

@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredCapabilities = this.reflector.getAllAndOverride<string[]>(
      CAPABILITIES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const bodyValueRequirementMetadata =
      this.reflector.getAllAndOverride<CapabilityByBodyValueRequirement>(
        CAPABILITY_BY_BODY_VALUE_KEY,
        [context.getHandler(), context.getClass()],
      );
    const bodyValueRequirement = isBodyValueRequirement(
      bodyValueRequirementMetadata,
    )
      ? bodyValueRequirementMetadata
      : undefined;

    if (!requiredCapabilities?.length && !bodyValueRequirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    const requiredCapability = bodyValueRequirement
      ? bodyValueRequirement.capabilities[
          (request.body as Record<string, unknown> | undefined)?.[
            bodyValueRequirement.field
          ] as string
        ]
      : undefined;

    // Let DTO validation retain its canonical 400 response for absent/invalid values.
    if (bodyValueRequirement && !requiredCapability) {
      return true;
    }

    return Boolean(
      user &&
        user.canAccessErp &&
        (requiredCapabilities ?? []).every((capability) =>
          hasPersistedCapability(user.permissionCodes, capability),
        ) &&
        (!requiredCapability ||
          hasPersistedCapability(user.permissionCodes, requiredCapability)),
    );
  }
}
