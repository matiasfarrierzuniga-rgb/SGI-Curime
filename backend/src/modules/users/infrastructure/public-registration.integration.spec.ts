process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../../generated/prisma/client';
import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port';
import { RuntimePersonResolverService } from '../../../identity/runtime-person-resolver.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import type { RegistrationDataConflictError } from '../domain/repositories/users-repository';
import { PrismaUsersRepository } from './prisma-users.repository';

const connectionString = process.env.IDENTITY_7_2_TEST_DATABASE_URL;
const describeIntegration = connectionString ? describe : describe.skip;

describeIntegration('public Person-first registration PostgreSQL', () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString! }),
  });
  const resolver = new RuntimePersonResolverService(prisma as never);
  const repository = new PrismaUsersRepository(
    prisma as unknown as PrismaService,
    resolver,
    prisma,
  );
  const hasher = {
    hash: jest.fn(() => Promise.resolve('integration-hash')),
  };
  const useCase = new RegisterUserUseCase(repository, hasher as PasswordHasher);

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.person.deleteMany();
    await prisma.role.deleteMany();
    await prisma.role.create({
      data: { name: 'Subscription_L1', isActive: true },
    });
  });

  afterAll(async () => prisma.$disconnect());

  it('creates linked Person and User atomically', async () => {
    const user = await useCase.execute(input('123456789', 'one@example.test'));

    expect(await prisma.person.count()).toBe(1);
    expect(
      await prisma.user.count({ where: { id: user.id, personId: null } }),
    ).toBe(0);
    const persisted = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(persisted.personId).not.toBeNull();
    expect(persisted).toMatchObject({
      fullName: 'Runtime Registration Test',
      status: 'ACTIVE',
    });
  });

  it('rolls back a newly created Person when User-stage work fails', async () => {
    await expect(
      repository.withRegistrationTransaction(async (tx) => {
        const resolution = await tx.resolvePerson(identity('223456789'));
        expect(resolution.status).toBe('PERSON_CREATED');
        throw new Error('forced User-stage failure');
      }),
    ).rejects.toThrow('forced User-stage failure');

    expect(await prisma.person.count()).toBe(0);
    expect(await prisma.user.count()).toBe(0);
  });

  it('keeps one Person and at most one User for concurrent same identity', async () => {
    const results = await Promise.allSettled([
      useCase.execute(input('323456789', 'first@example.test')),
      useCase.execute(input('323456789', 'second@example.test')),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(await prisma.person.count()).toBe(1);
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.user.count({ where: { personId: null } })).toBe(0);
  });

  it('keeps at most one User for one pre-existing Person under concurrency', async () => {
    await prisma.person.create({
      data: {
        ...identity('373456789'),
        normalizedIdentification: '373456789',
      },
    });

    const results = await Promise.allSettled([
      useCase.execute(input('373456789', 'existing-one@example.test')),
      useCase.execute(input('373456789', 'existing-two@example.test')),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(await prisma.person.count()).toBe(1);
    expect(await prisma.user.count()).toBe(1);
  });

  it('keeps one Person and one User for concurrent same identity and email', async () => {
    const results = await Promise.allSettled([
      useCase.execute(input('423456789', 'same@example.test')),
      useCase.execute(input('423456789', 'same@example.test')),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(await prisma.person.count()).toBe(1);
    expect(await prisma.user.count()).toBe(1);
  });

  it('keeps one User for different identities with the same email', async () => {
    const results = await Promise.allSettled([
      useCase.execute(input('523456789', 'shared@example.test')),
      useCase.execute(input('623456789', 'shared@example.test')),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.person.count()).toBe(1);
  });

  it('rolls back Person and classifies legacy User identification conflict', async () => {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: 'Subscription_L1' },
    });
    const legacyPerson = await prisma.person.create({
      data: { legacyFullName: 'Legacy Account' },
    });
    await prisma.user.create({
      data: {
        fullName: 'Legacy Account',
        identification: '723456789',
        email: 'legacy@example.test',
        roleId: role.id,
        personId: legacyPerson.id,
      },
    });

    await expect(
      useCase.execute(input('723456789', 'new@example.test')),
    ).rejects.toMatchObject<Partial<RegistrationDataConflictError>>({
      code: 'LEGACY_USER_IDENTIFICATION_CONFLICT',
    });
    expect(await prisma.person.count()).toBe(1);
    expect(await prisma.user.count()).toBe(1);
  });

  it('preserves every logical Person and User uniqueness invariant', async () => {
    await useCase.execute(input('823456789', 'final@example.test'));
    const duplicatePeople = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT "identificationType", "normalizedIdentification"
        FROM "Person"
        WHERE "identificationType" IS NOT NULL
          AND "normalizedIdentification" IS NOT NULL
        GROUP BY "identificationType", "normalizedIdentification"
        HAVING COUNT(*) > 1
      ) duplicate_groups
    `;

    expect(Number(duplicatePeople[0]?.count ?? 0n)).toBe(0);
    expect(await prisma.user.count({ where: { personId: null } })).toBe(0);
  });
});

function input(identification: string, email: string) {
  return {
    ...identity(identification),
    email,
    password: 'Secure12345',
  };
}

function identity(identification: string) {
  return {
    identificationType: 'NATIONAL' as const,
    identification,
    firstName: 'Runtime',
    firstSurname: 'Registration',
    secondSurname: 'Test',
  };
}
