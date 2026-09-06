import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CapabilityGuard } from './capability.guard';

function contextFor(role?: string): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        user: role
          ? { id: 1, fullName: 'Test User', email: 'test@example.com', status: 'ACTIVE', role }
          : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('CapabilityGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new CapabilityGuard(reflector);

  beforeEach(() => jest.clearAllMocks());

  it('allows a known role with required capability', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['usr.users.read']);

    expect(guard.canActivate(contextFor('Administrador'))).toBe(true);
  });

  it('allows administrators to manage and publish events', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['pub.events.manage', 'pub.events.publish']);

    expect(guard.canActivate(contextFor('Administrador'))).toBe(true);
  });

  it('denies a known role without required capability', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['usr.users.read']);

    expect(guard.canActivate(contextFor('Gestor de Inventario'))).toBe(false);
  });

  it('denies an unknown role and unknown capability', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['usr.users.read']);
    expect(guard.canActivate(contextFor('Unknown'))).toBe(false);

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['unknown.capability']);
    expect(guard.canActivate(contextFor('Administrador'))).toBe(false);
  });

  it('denies missing authenticated user for protected capability', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['usr.users.read']);

    expect(guard.canActivate(contextFor())).toBe(false);
  });

  it('requires every declared capability', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.profile.read', 'usr.users.read']);

    expect(guard.canActivate(contextFor('Gestor de Inventario'))).toBe(false);
  });

  it('allows routes without capability metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(contextFor())).toBe(true);
  });

  it('allows administrators to read reservations', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['res.reservations.read']);

    expect(guard.canActivate(contextFor('Administrador'))).toBe(true);
  });

  it('allows administrators to approve, reject, and cancel reservations', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([
        'res.reservations.approve',
        'res.reservations.reject',
        'res.reservations.cancel',
      ]);

    expect(guard.canActivate(contextFor('Administrador'))).toBe(true);
  });

  it('denies inventory manager for reservation capabilities', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['res.reservations.read']);

    expect(guard.canActivate(contextFor('Gestor de Inventario'))).toBe(false);
  });

  it('denies unknown role for reservation capabilities', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['res.reservations.approve']);

    expect(guard.canActivate(contextFor('Tesorero'))).toBe(false);
  });
});
