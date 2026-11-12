import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { CapabilityGuard, JwtAuthGuard } from '../../../../auth';
import { CAPABILITIES_KEY } from '../../../../auth/presentation/decorators/require-capabilities.decorator';
import { PersonRegistrationConflictError } from '../../domain/errors/person-registration-conflict.error';
import { IdentityPersonsController } from './identity-persons.controller';

const dto = {
  identificationType: 'NATIONAL' as const,
  identification: '123456789',
  firstName: 'Ana',
  firstSurname: 'Pérez',
  reason: 'Alta administrativa para aprovisionamiento RBAC.',
};

describe('IdentityPersonsController', () => {
  const createPerson = { execute: jest.fn() };
  const controller = new IdentityPersonsController(createPerson as never);

  beforeEach(() => jest.clearAllMocks());

  it('requires JWT and persisted system.identity.manage capability', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, IdentityPersonsController),
    ).toEqual([JwtAuthGuard, CapabilityGuard]);
    const create = Object.getOwnPropertyDescriptor(
      IdentityPersonsController.prototype,
      'create',
    )?.value as (...args: unknown[]) => unknown;
    expect(Reflect.getMetadata(CAPABILITIES_KEY, create)).toEqual([
      'system.identity.manage',
    ]);
  });

  it('authorizes only persisted system.identity.manage grants', () => {
    const guard = new CapabilityGuard(new Reflector());
    const create = Object.getOwnPropertyDescriptor(
      IdentityPersonsController.prototype,
      'create',
    )?.value as (...args: unknown[]) => unknown;
    const executionContext = (permissionCodes: string[]) =>
      ({
        getHandler: () => create,
        getClass: () => IdentityPersonsController,
        switchToHttp: () => ({
          getRequest: () => ({ user: { canAccessErp: true, permissionCodes } }),
        }),
      }) as never;

    expect(guard.canActivate(executionContext(['usr.users.read']))).toBe(false);
    expect(
      guard.canActivate(executionContext(['system.identity.manage'])),
    ).toBe(true);
  });

  it('passes the authenticated actor and request context to the use case', async () => {
    createPerson.execute.mockResolvedValue({ personId: 12, created: true });

    await expect(
      controller.create(dto, {
        user: { id: 7 },
        ip: '127.0.0.1',
        get: () => 'test-agent',
      } as never),
    ).resolves.toMatchObject({ personId: 12, created: true });

    expect(createPerson.execute).toHaveBeenCalledWith({
      ...dto,
      actorId: 7,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });
  });

  it('maps registration conflicts to HTTP 409 without leaking identifications', async () => {
    createPerson.execute.mockRejectedValue(
      new PersonRegistrationConflictError('PERSON_ALREADY_HAS_USER'),
    );

    await expect(
      controller.create(dto, {
        user: { id: 7 },
        ip: '127.0.0.1',
        get: () => 'test-agent',
      } as never),
    ).rejects.toMatchObject({ status: 409 });
  });
});
