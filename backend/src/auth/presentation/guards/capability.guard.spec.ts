import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CapabilityGuard } from './capability.guard';
import { CAPABILITIES_KEY } from '../decorators/require-capabilities.decorator';

function context(permissionCodes: readonly string[], canAccessErp = true): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user: { canAccessErp, permissionCodes } }) }),
  } as unknown as ExecutionContext;
}

describe('CapabilityGuard', () => {
  const reflector = new Reflector();
  const guard = new CapabilityGuard(reflector);

  it('allows a canonical persisted grant', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => key === CAPABILITIES_KEY ? ['inv.inventory.read'] : undefined);
    expect(guard.canActivate(context(['inv.inventory.read']))).toBe(true);
  });

  it('denies a legacy identity without persisted grants', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => key === CAPABILITIES_KEY ? ['inv.inventory.read'] : undefined);
    expect(guard.canActivate(context([]))).toBe(false);
  });

  it('denies community access to ERP even with a supplied capability', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => key === CAPABILITIES_KEY ? ['inv.inventory.read'] : undefined);
    expect(guard.canActivate(context(['inv.inventory.read'], false))).toBe(false);
  });
});
