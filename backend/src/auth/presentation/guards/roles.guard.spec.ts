import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function context(canAccessErp: boolean): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user: { role: 'Administrador', canAccessErp } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard internal access', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  beforeEach(() => jest.clearAllMocks());

  it('denies a matching JWT role when current ERP access is invalid', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Administrador']);
    expect(guard.canActivate(context(false))).toBe(false);
  });

  it('allows a matching role only with current ERP access', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Administrador']);
    expect(guard.canActivate(context(true))).toBe(true);
  });

  it('does not turn routes without role metadata into ERP-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(context(false))).toBe(true);
  });
});
