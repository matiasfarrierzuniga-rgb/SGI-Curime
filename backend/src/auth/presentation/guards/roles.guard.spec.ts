import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function context(canAccessErp: boolean, role = 'ROLE_SYSTEM_ADMIN'): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user: { role, canAccessErp } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard internal access', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  beforeEach(() => jest.clearAllMocks());

  it('denies a matching JWT role when current ERP access is invalid', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ROLE_SYSTEM_ADMIN']);
    expect(guard.canActivate(context(false))).toBe(false);
  });

  it('allows a matching canonical role only with current ERP access', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ROLE_SYSTEM_ADMIN']);
    expect(guard.canActivate(context(true))).toBe(true);
  });

  it('denies historical role metadata even when a legacy JWT role matches', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Administrador']);
    expect(guard.canActivate(context(true, 'Administrador'))).toBe(false);
  });

  it('does not turn routes without role metadata into ERP-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(context(false))).toBe(true);
  });
});
