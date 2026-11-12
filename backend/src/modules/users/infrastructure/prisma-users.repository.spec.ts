process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

import { Prisma, PrismaClient } from '../../../../generated/prisma/client';
import {
  PersonLogicalIdentityRaceError,
  RuntimePersonResolverService,
} from '../../../identity/runtime-person-resolver.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserStatus } from '../domain/entities/user';
import { RegistrationDataConflictError } from '../domain/repositories/users-repository';
import { PrismaUsersRepository } from './prisma-users.repository';

describe('PrismaUsersRepository registration methods', () => {
  const db = {
    role: { findUnique: jest.fn() },
    person: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    user: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };
  const prisma = { $transaction: jest.fn() };
  const resolver = { resolve: jest.fn(), resolveWithinTransaction: jest.fn() };
  const repository = new PrismaUsersRepository(
    prisma as unknown as PrismaService,
    resolver as unknown as RuntimePersonResolverService,
    db as unknown as PrismaClient,
  );

  beforeEach(() => jest.clearAllMocks());

  it('atomically rejects profile email updates when the account is pending verification', async () => {
    db.user.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    await expect(
      repository.updateProfile(7, { email: 'new@example.test' }),
    ).rejects.toMatchObject({ status: 409 });
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7, status: { not: 'PENDING_EMAIL_VERIFICATION' } },
      }),
    );
  });

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

  describe('createPerson', () => {
    const input = {
      identificationType: 'NATIONAL' as const,
      identification: '123456789',
      firstName: 'Ana',
      firstSurname: 'Pérez',
      reason: 'Alta administrativa para aprovisionamiento RBAC.',
      actorId: 7,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };
    const person = {
      id: 12,
      firstName: 'Ana',
      firstSurname: 'Pérez',
      secondSurname: null,
      identification: '123456789',
      identificationType: 'NATIONAL',
      normalizedIdentification: '123456789',
    };

    beforeEach(() => {
      prisma.$transaction.mockImplementation(
        (work: (tx: unknown) => Promise<unknown>) => work(db),
      );
    });

    it('creates the canonical Person and audits actor, reason and result transactionally', async () => {
      resolver.resolveWithinTransaction.mockResolvedValue({
        status: 'PERSON_CREATED',
        person,
        profileEnrichmentRequired: false,
      });

      await expect(repository.createPerson(input)).resolves.toMatchObject({
        personId: 12,
        created: true,
      });

      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 7,
            action: 'PERSON_CREATED',
            module: 'IDENTITY',
            entityType: 'Person',
            entityId: '12',
            details: expect.objectContaining({
              result: 'CREATED',
              reason: input.reason,
              identificationType: 'NATIONAL',
            }),
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          }),
        }),
      );
      expect(JSON.stringify(db.auditLog.create.mock.calls)).not.toContain(
        input.identification,
      );
    });

    it('reuses an unlinked compatible Person and records the reuse result', async () => {
      resolver.resolveWithinTransaction.mockResolvedValue({
        status: 'PERSON_REUSED',
        person,
        profileEnrichmentRequired: false,
      });
      db.user.findUnique.mockResolvedValue(null);

      await expect(repository.createPerson(input)).resolves.toMatchObject({
        personId: 12,
        created: false,
      });

      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: expect.objectContaining({ result: 'REUSED' }),
          }),
        }),
      );
    });

    it('rejects a Person already linked to an account without auditing', async () => {
      resolver.resolveWithinTransaction.mockResolvedValue({
        status: 'PERSON_REUSED',
        person,
        profileEnrichmentRequired: false,
      });
      db.user.findUnique.mockResolvedValue({ id: 9 });

      await expect(repository.createPerson(input)).rejects.toMatchObject({
        code: 'PERSON_ALREADY_HAS_USER',
      });
      expect(db.auditLog.create).not.toHaveBeenCalled();
    });

    it.each([
      ['IDENTITY_CONFLICT', 'IDENTITY_CONFLICT'],
      ['IDENTITY_DUPLICATE_CORRUPTION', 'IDENTITY_DUPLICATE_CORRUPTION'],
      ['MANUAL_REVIEW_REQUIRED', 'PROFILE_ENRICHMENT_REQUIRED'],
      ['INCOMPLETE', 'INVALID_IDENTITY'],
    ])('maps resolver status %s to %s', async (status, code) => {
      resolver.resolveWithinTransaction.mockResolvedValue({
        status,
        profileEnrichmentRequired: false,
        reason: 'test',
      });

      await expect(repository.createPerson(input)).rejects.toEqual(
        expect.objectContaining({ code }),
      );
      expect(db.auditLog.create).not.toHaveBeenCalled();
    });
  });

  it('projects non-sensitive affiliation context for /users/me', async () => {
    db.user.findUnique.mockResolvedValue({
      person: {
        affiliate: { id: 22, status: 'ACTIVE', legacyRoleId: 4 },
        affiliateRequests: [{ status: 'APPROVED' }],
      },
    });

    await expect(repository.findAffiliationContext(7)).resolves.toEqual({
      affiliateId: 22,
      affiliateStatus: 'ACTIVE',
      affiliateRoleId: 4,
      affiliateRequestStatus: 'APPROVED',
      hasPerson: true,
    });
  });

  it('projects linked personal identity from Person instead of User snapshots', async () => {
    db.user.findUnique.mockResolvedValue(
      userRecord({
        fullName: 'Snapshot antiguo',
        identification: '000000000',
        person: {
          id: 12,
          firstName: 'Ana',
          firstSurname: 'Pérez',
          secondSurname: 'Mora',
          legacyFullName: null,
          identification: '123456789',
          identificationType: 'NATIONAL',
          email: 'ana.persona@example.test',
          phoneCountryCode: '+506',
          phoneNationalNumber: '88888888',
          address: 'Curime',
          affiliate: null,
        },
      }),
    );

    await expect(repository.findById(7)).resolves.toMatchObject({
      fullName: 'Ana Pérez Mora',
      identification: '123456789',
      phoneCountryCode: '+506',
      phoneNationalNumber: '88888888',
      address: 'Curime',
    });
  });

  it('lists Person roots with no fabricated User access', async () => {
    db.person.findMany.mockResolvedValue([
      {
        id: 12,
        firstName: 'Persona',
        firstSurname: 'Sin',
        secondSurname: 'Cuenta',
        legacyFullName: null,
        identification: '123456789',
        identificationType: 'NATIONAL',
        email: 'person@example.com',
        phoneCountryCode: null,
        phoneNationalNumber: null,
        address: null,
        user: null,
        affiliate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    db.person.count.mockResolvedValue(1);

    const page = await repository.findPage({ page: 1, limit: 20 });

    expect(page.data).toEqual([
      expect.objectContaining({
        id: '12',
        contactEmail: 'person@example.com',
        access: null,
        affiliate: null,
      }),
    ]);
    expect(db.person.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ user: expect.any(Object) }),
      }),
    );
  });

  it('filters Person roots by canonical contact email or linked User access email', async () => {
    db.person.findMany.mockResolvedValue([]);
    db.person.count.mockResolvedValue(0);

    await repository.findPage({
      page: 1,
      limit: 20,
      email: 'lookup@example.com',
    });

    expect(db.person.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [
            {
              OR: [
                {
                  email: {
                    contains: 'lookup@example.com',
                    mode: 'insensitive',
                  },
                },
                {
                  user: {
                    is: {
                      email: {
                        contains: 'lookup@example.com',
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            },
          ],
        }),
      }),
    );
    expect(db.person.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.any(Array),
        }),
      }),
    );
  });

  it('retrieves detail by Person id and preserves distinct Person and User emails', async () => {
    db.person.findUnique.mockResolvedValue({
      id: 12,
      firstName: 'Persona',
      firstSurname: 'Vinculada',
      secondSurname: null,
      legacyFullName: null,
      identification: '123456789',
      identificationType: 'NATIONAL',
      email: 'person@example.com',
      phoneCountryCode: null,
      phoneNationalNumber: null,
      address: null,
      affiliate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: userRecord({ email: 'access@example.com', personId: 12 }),
    });

    await expect(repository.findAdminPersonById(12)).resolves.toMatchObject({
      id: '12',
      contactEmail: 'person@example.com',
      access: { id: 7, email: 'access@example.com' },
    });
    expect(db.person.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 12 } }),
    );
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
    status: UserStatus.ACTIVE,
    subscriptionExpirationDate: null,
    roleId: 5,
    personId: 12,
  };
}

function userRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    fullName: 'Cuenta vinculada',
    identification: '123456789',
    identificationType: 'NATIONAL',
    email: 'account@example.com',
    phoneCountryCode: null,
    phoneNationalNumber: null,
    phone: null,
    address: null,
    status: 'ACTIVE',
    subscriptionExpirationDate: null,
    lockedAt: null,
    roleId: 2,
    role: { id: 2, name: 'Tesorero', description: null, isActive: true },
    personId: 12,
    person: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
