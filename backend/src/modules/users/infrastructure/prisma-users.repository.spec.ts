process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

import { Prisma, PrismaClient } from '../../../../generated/prisma/client';
import {
  PersonLogicalIdentityRaceError,
  RuntimePersonResolverService,
} from '../../../identity/runtime-person-resolver.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistrationDataConflictError } from '../domain/repositories/users-repository';
import { PrismaUsersRepository } from './prisma-users.repository';

describe('PrismaUsersRepository registration methods', () => {
  const db = {
    role: { findUnique: jest.fn() },
    user: { create: jest.fn(), findUnique: jest.fn() },
  };
  const prisma = { $transaction: jest.fn() };
  const resolver = { resolve: jest.fn(), resolveWithinTransaction: jest.fn() };
  const repository = new PrismaUsersRepository(
    prisma as unknown as PrismaService,
    resolver as unknown as RuntimePersonResolverService,
    db as unknown as PrismaClient,
  );

  beforeEach(() => jest.clearAllMocks());

  it('resolves the registration role by semantic name', async () => {
    db.role.findUnique.mockResolvedValue({
      id: 5,
      name: 'Subscription_L1',
      description: null,
      isActive: true,
    });

    await repository.findRoleByName('Subscription_L1');

    expect(db.role.findUnique).toHaveBeenCalledWith({
      where: { name: 'Subscription_L1' },
      select: { id: true, name: true, description: true, isActive: true },
    });
  });

  it('resolves Person using the same transaction-scoped database', async () => {
    resolver.resolveWithinTransaction.mockResolvedValue({
      status: 'PERSON_CREATED',
    });
    const input = {
      identificationType: 'NATIONAL',
      identification: '123456789',
      firstName: 'Persona',
      firstSurname: 'Usuaria',
    };

    await repository.resolvePerson(input);

    expect(resolver.resolveWithinTransaction).toHaveBeenCalledWith(input, db);
  });

  it.each([
    [['email'], 'USER_EMAIL_RACE'],
    [['personId'], 'USER_PERSON_RACE'],
    [['identification'], 'LEGACY_USER_IDENTIFICATION_CONFLICT'],
    [['other'], 'UNEXPECTED_USER_UNIQUE_CONFLICT'],
  ])('classifies Prisma uniqueness target %j as %s', async (target, code) => {
    db.user.create.mockRejectedValue(prismaError('P2002', { target }));

    await expect(repository.create(createData())).rejects.toMatchObject({
      code,
    });
  });

  it('retries the complete registration transaction for bounded P2034 only', async () => {
    prisma.$transaction
      .mockRejectedValueOnce(prismaError('P2034'))
      .mockRejectedValueOnce(prismaError('P2034'))
      .mockImplementationOnce((work: (tx: typeof db) => Promise<unknown>) =>
        work(db),
      );

    await expect(
      repository.withRegistrationTransaction(() => Promise.resolve('created')),
    ).resolves.toBe('created');
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  it('never retries a deterministic User uniqueness conflict', async () => {
    const conflict = new RegistrationDataConflictError('USER_EMAIL_RACE');
    prisma.$transaction.mockRejectedValue(conflict);

    await expect(
      repository.withRegistrationTransaction(() => Promise.resolve('unused')),
    ).rejects.toBe(conflict);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('retries a classified Person logical-key race as a complete transaction', async () => {
    prisma.$transaction
      .mockRejectedValueOnce(new PersonLogicalIdentityRaceError())
      .mockImplementationOnce((work: (tx: typeof db) => Promise<unknown>) =>
        work(db),
      );

    await expect(
      repository.withRegistrationTransaction(() => Promise.resolve('created')),
    ).resolves.toBe('created');
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });
});

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('database conflict', {
    code,
    clientVersion: 'test',
    meta,
  });
}

function createData() {
  return {
    fullName: 'Persona Usuaria',
    identificationType: 'NATIONAL' as const,
    identification: '123456789',
    email: 'persona@example.com',
    passwordHash: 'secure-hash',
    status: 'ACTIVE' as const,
    roleId: 5,
    personId: 12,
  };
}
