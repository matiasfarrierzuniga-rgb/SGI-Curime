import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CapabilityGuard } from './capability.guard';
import { CAPABILITIES } from '../capabilities/capability-policy';
import {
  CAPABILITY_BY_BODY_VALUE_KEY,
  type CapabilityByBodyValueRequirement,
} from '../decorators/require-capability-by-body-value.decorator';

const ROLE_PERMISSION_FIXTURES: Record<string, readonly string[]> = {
  Administrador: CAPABILITIES,
  'Gestor de Inventario': [
    'erp.dashboard.read',
    'usr.profile.read',
    'inv.inventory.read',
  ],
  Tesorero: [
    'fin.charges.read',
    'fin.payments.record',
    'fin.movements.read',
    'fin.movements.create',
    'fin.dinadeco.read',
    'don.donations.read',
    'don.donations.create',
    'don.donations.update',
    'don.donations.cancel',
  ],
};

function contextFor(
  role?: string,
  canAccessErp = true,
  permissionCodes?: readonly string[],
): ExecutionContext {
  const request = {
    user: role
      ? {
          id: 1,
          fullName: 'Test User',
          email: 'test@example.com',
          status: 'ACTIVE',
          role,
          permissionCodes:
            permissionCodes ?? ROLE_PERMISSION_FIXTURES[role] ?? [],
          canAccessErp,
        }
      : undefined,
  };

  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('CapabilityGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new CapabilityGuard(reflector);

  beforeEach(() => jest.clearAllMocks());

  function requireDecisionCapability() {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key: string) => {
        if (key === CAPABILITY_BY_BODY_VALUE_KEY) {
          return {
            field: 'status',
            capabilities: {
              APPROVED: 'adm.justifications.approve',
              REJECTED: 'adm.justifications.reject',
            },
          } satisfies CapabilityByBodyValueRequirement;
        }
        return undefined;
      });
  }

  it('allows a known role with required capability', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.users.read']);

    expect(guard.canActivate(contextFor('Administrador'))).toBe(true);
  });

  it('enforces separate persisted UserRequest read and review grants', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['usr.user-requests.read']);
    expect(guard.canActivate(contextFor('Unknown', true, ['usr.user-requests.read']))).toBe(true);
    expect(guard.canActivate(contextFor('Unknown', true, ['adm.requests.read']))).toBe(false);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['usr.user-requests.review']);
    expect(guard.canActivate(contextFor('Unknown', true, ['usr.user-requests.read']))).toBe(false);
    expect(guard.canActivate(contextFor('Unknown', true, ['usr.user-requests.review']))).toBe(true);
  });

  it('allows administrators to manage and publish events', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['pub.events.manage', 'pub.events.publish']);

    expect(guard.canActivate(contextFor('Administrador'))).toBe(true);
  });

  it('denies a known role without required capability', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.users.read']);

    expect(guard.canActivate(contextFor('Gestor de Inventario'))).toBe(false);
  });

  it('denies a role capability when current affiliate access is invalid', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['usr.users.read']);
    expect(guard.canActivate(contextFor('Administrador', false))).toBe(false);
  });

  it('denies an unknown role and unknown capability', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.users.read']);
    expect(guard.canActivate(contextFor('Unknown'))).toBe(false);

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['unknown.capability']);
    expect(guard.canActivate(contextFor('Administrador'))).toBe(false);
  });

  it('uses persisted permission codes instead of role name', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.users.read']);

    expect(
      guard.canActivate(
        contextFor('Unrecognized role', true, ['usr.users.read']),
      ),
    ).toBe(true);
  });

  it('allows an approve-only grant only for APPROVED generic decisions', () => {
    requireDecisionCapability();
    const context = contextFor(
      'Unrecognized role',
      true,
      ['adm.justifications.approve'],
    );
    const request = context.switchToHttp().getRequest() as { body: object };

    request.body = { status: 'APPROVED' };
    expect(guard.canActivate(context)).toBe(true);
    request.body = { status: 'REJECTED' };
    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows a reject-only grant only for REJECTED generic decisions', () => {
    requireDecisionCapability();
    const context = contextFor(
      'Unrecognized role',
      true,
      ['adm.justifications.reject'],
    );
    const request = context.switchToHttp().getRequest() as { body: object };

    request.body = { status: 'REJECTED' };
    expect(guard.canActivate(context)).toBe(true);
    request.body = { status: 'APPROVED' };
    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies zero-grant roles even when role name is known', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.users.read']);

    expect(guard.canActivate(contextFor('Administrador', true, []))).toBe(
      false,
    );
  });

  it('denies roles with no persisted grants', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.users.read']);

    expect(guard.canActivate(contextFor('Vecino/Afiliado'))).toBe(false);
  });

  it('denies when persisted permissions are missing from auth context', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.users.read']);

    const context = contextFor('Administrador');
    const request = context.switchToHttp().getRequest() as {
      user: { permissionCodes?: readonly string[] };
    };
    delete request.user.permissionCodes;

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies missing authenticated user for protected capability', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['usr.users.read']);

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

  it('denies treasurer for reservation capabilities', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['res.reservations.approve']);

    expect(guard.canActivate(contextFor('Tesorero'))).toBe(false);
  });

  it('allows administrators and treasurers to read charges and record payments', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['fin.charges.read', 'fin.payments.record']);

    expect(guard.canActivate(contextFor('Administrador'))).toBe(true);
    expect(guard.canActivate(contextFor('Tesorero'))).toBe(true);
  });

  it('denies inventory manager for financial capabilities', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['fin.payments.record']);

    expect(guard.canActivate(contextFor('Gestor de Inventario'))).toBe(false);
  });

  it('allows only administrators and treasurers to read and create financial movements', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['fin.movements.read', 'fin.movements.create']);

    expect(guard.canActivate(contextFor('Administrador'))).toBe(true);
    expect(guard.canActivate(contextFor('Tesorero'))).toBe(true);
    expect(guard.canActivate(contextFor('Gestor de Inventario'))).toBe(false);
    expect(guard.canActivate(contextFor('Vecino/Afiliado'))).toBe(false);
  });
});
