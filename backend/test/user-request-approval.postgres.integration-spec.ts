/* eslint-disable @typescript-eslint/no-unsafe-return -- Dynamic Prisma proxies preserve real delegates while injecting deterministic test barriers. */
import { ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Client } from 'pg';
import { Prisma } from '../generated/prisma/client';
import {
  IDENTITY_NORMALIZATION_VERSION,
  RECONCILIATION_DECISION_VERSION,
  RECONCILIATION_MANIFEST_VERSION,
} from '../src/identity-reconciliation/identity-reconciliation';
import { RuntimePersonResolverService } from '../src/identity/runtime-person-resolver.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ActivationTokenService } from '../src/user-requests/activation-token.service';
import { UserRequestsService } from '../src/user-requests/user-requests.service';

type Hooks = {
  afterManifest?: () => Promise<void>;
  afterRoleLock?: () => Promise<void>;
  afterToken?: () => Promise<void>;
  afterUser?: () => Promise<void>;
  afterUserLookup?: () => Promise<void>;
  beforeClaim?: () => Promise<void>;
  beforeRoleLock?: () => Promise<void>;
};

type Fixture = {
  actorId: number;
  marker: string;
  personId: number;
  requestId: number;
  roleId: number;
};

describe('UserRequest approval PostgreSQL certification', () => {
  let prisma: PrismaService;
  let sequence = 0;
  const markers = new Set<string>();

  beforeAll(async () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.ALLOW_TEST_DATABASE_RESET).toBe('true');
    expect(process.env.DATABASE_URL).toBe(process.env.TEST_DATABASE_URL);
    expect(process.env.DIRECT_URL).toBe(process.env.TEST_DATABASE_URL);
    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterEach(async () => {
    for (const marker of markers) await cleanupMarker(marker);
    markers.clear();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function nextMarker(label: string) {
    sequence += 1;
    const marker = `v1cl01-${label}-${process.pid}-${sequence}`;
    markers.add(marker);
    return marker;
  }

  async function createFixture(label: string): Promise<Fixture> {
    const marker = nextMarker(label);
    const role = await prisma.role.create({
      data: { name: `${marker}-target`, isActive: true },
    });
    const actorRole = await prisma.role.create({
      data: { name: `${marker}-actor`, isActive: true },
    });
    const actor = await prisma.user.create({
      data: {
        email: `${marker}-actor@example.test`,
        fullName: 'Certification Actor',
        identification: `${marker}-actor-id`,
        passwordHash: null,
        roleId: actorRole.id,
        status: 'ACTIVE',
      },
    });
    const identification = String(100_000_000 + sequence);
    const person = await prisma.person.create({
      data: {
        firstName: 'Persona',
        firstSurname: 'Canónica',
        legacyFullName: marker,
        identification,
        identificationType: 'NATIONAL',
        normalizedIdentification: identification,
      },
    });
    const request = await prisma.userRequest.create({
      data: {
        fullName: 'Snapshot Histórico',
        identification,
        identificationType: 'NATIONAL',
        email: `${marker}-applicant@example.test`,
        reason: 'Certificación PostgreSQL',
        personId: person.id,
        status: 'PENDING',
        submittedFullName: 'Snapshot Histórico',
        submittedIdentification: identification,
        submittedIdentificationType: 'NATIONAL',
        submittedEmail: `${marker}-applicant@example.test`,
        submittedReason: 'Certificación PostgreSQL',
      },
    });
    return {
      actorId: actor.id,
      marker,
      personId: person.id,
      requestId: request.id,
      roleId: role.id,
    };
  }

  async function createSecondRequest(fixture: Fixture) {
    return prisma.userRequest.create({
      data: {
        fullName: 'Segundo Snapshot',
        identification: String(100_000_000 + sequence),
        identificationType: 'NATIONAL',
        email: `${fixture.marker}-second@example.test`,
        reason: 'Certificación PostgreSQL concurrente',
        personId: fixture.personId,
        status: 'PENDING',
      },
    });
  }

  function service(hooks: Hooks = {}) {
    const delivered: Array<{
      email: string;
      token: string;
      userId: number;
    }> = [];
    const database = wrapPrisma(prisma, hooks);
    const tokenService = new ActivationTokenService();
    const tokenDelivery = {
      deliver: jest.fn(
        (value: { email: string; token: string; userId: number }) => {
          delivered.push(value);
          return Promise.resolve();
        },
      ),
    };
    return {
      delivered,
      instance: new UserRequestsService(
        database,
        tokenService,
        tokenDelivery as never,
        new RuntimePersonResolverService(database),
      ),
    };
  }

  async function inspect(fixture: Fixture) {
    const request = await prisma.userRequest.findUnique({
      where: { id: fixture.requestId },
    });
    const users = await prisma.user.findMany({
      where: { personId: fixture.personId },
      include: { activationTokens: true },
    });
    const manifests = await prisma.identityReconciliationManifest.findMany({
      where: { sourceModel: 'UserRequest', sourceId: fixture.requestId },
    });
    const people = await prisma.person.findMany({
      where: {
        identificationType: 'NATIONAL',
        normalizedIdentification: String(100_000_000 + sequence),
      },
    });
    const tokenCount = await prisma.accountActivationToken.count({
      where: { user: { email: { startsWith: fixture.marker } } },
    });
    return { manifests, people, request, tokenCount, users };
  }

  it('A persists one canonical Person, inactive User, hash-only token and manifest', async () => {
    const fixture = await createFixture('normal');
    const approval = service();
    const result = await approval.instance.approve(
      fixture.requestId,
      { roleId: fixture.roleId },
      fixture.actorId,
    );
    const state = await inspect(fixture);

    expect(result.userRequest.status).toBe('APPROVED');
    expect(state.request).toMatchObject({
      personId: fixture.personId,
      status: 'APPROVED',
    });
    expect(state.people).toHaveLength(1);
    expect(state.users).toHaveLength(1);
    expect(state.users[0]).toMatchObject({
      personId: fixture.personId,
      roleId: fixture.roleId,
      status: 'INACTIVE',
    });
    expect(state.users[0].activationTokens).toHaveLength(1);
    expect(state.manifests).toHaveLength(1);
    expect(state.manifests[0]).toMatchObject({
      classification: 'IDENTITY_MATCH',
      conflictCodes: [],
      decisionVersion: RECONCILIATION_DECISION_VERSION,
      manifestVersion: RECONCILIATION_MANIFEST_VERSION,
      nameReconciliationRequired: false,
      normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
      personCreationAllowed: false,
      reviewRequired: false,
      selectedPersonId: fixture.personId,
      sourceId: fixture.requestId,
      sourceModel: 'UserRequest',
    });
    const sourceSnapshot = state.manifests[0].sourceSnapshot as {
      email: string;
      identification: string;
    };
    expect(sourceSnapshot).toMatchObject({
      email: `${fixture.marker}-applicant@example.test`,
      identification: String(100_000_000 + sequence),
    });
    const raw = approval.delivered[0].token;
    expect(state.users[0].activationTokens[0].tokenHash).toBe(
      createHash('sha256').update(raw).digest('hex'),
    );
    expect(JSON.stringify(state)).not.toContain(raw);
  });

  it('B allows one of two concurrent approvals for the same request', async () => {
    const fixture = await createFixture('same-request');
    const secondRole = await prisma.role.create({
      data: { name: `${fixture.marker}-concurrent-target`, isActive: true },
    });
    const overlap = rendezvous(2);
    const firstApproval = service({ afterRoleLock: overlap.wait });
    const secondApproval = service({ afterRoleLock: overlap.wait });
    const settled = await Promise.allSettled([
      firstApproval.instance.approve(
        fixture.requestId,
        { roleId: fixture.roleId },
        fixture.actorId,
      ),
      secondApproval.instance.approve(
        fixture.requestId,
        { roleId: secondRole.id },
        fixture.actorId,
      ),
    ]);
    const state = await inspect(fixture);

    expect(overlap.arrivals()).toBe(2);
    expect(settled.filter((item) => item.status === 'fulfilled')).toHaveLength(
      1,
    );
    const loser = settled.find(
      (item) => item.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(loser.reason).toBeInstanceOf(ConflictException);
    expect(state.request?.status).toBe('APPROVED');
    expect(state.users).toHaveLength(1);
    expect(state.users[0].activationTokens).toHaveLength(1);
    expect(state.tokenCount).toBe(1);
    expect(state.manifests).toHaveLength(1);
  });

  it('C/G preserves User.personId uniqueness and maps the real race to HTTP 409', async () => {
    const fixture = await createFixture('same-identity');
    const second = await createSecondRequest(fixture);
    const secondRole = await prisma.role.create({
      data: { name: `${fixture.marker}-second-target`, isActive: true },
    });
    const barrier = rendezvous(2);
    const firstApproval = service({ afterUserLookup: barrier.wait });
    const secondApproval = service({ afterUserLookup: barrier.wait });
    const settled = await Promise.allSettled([
      firstApproval.instance.approve(
        fixture.requestId,
        { roleId: fixture.roleId },
        fixture.actorId,
      ),
      secondApproval.instance.approve(
        second.id,
        { roleId: secondRole.id },
        fixture.actorId,
      ),
    ]);
    const users = await prisma.user.findMany({
      where: { personId: fixture.personId },
    });
    const requests = await prisma.userRequest.findMany({
      where: { id: { in: [fixture.requestId, second.id] } },
      orderBy: { id: 'asc' },
    });
    const manifests = await prisma.identityReconciliationManifest.findMany({
      where: {
        sourceModel: 'UserRequest',
        sourceId: { in: [fixture.requestId, second.id] },
      },
    });
    const loser = settled.find(
      (item) => item.status === 'rejected',
    ) as PromiseRejectedResult;

    expect(settled.filter((item) => item.status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(loser.reason).toBeInstanceOf(ConflictException);
    expect((loser.reason as ConflictException).getStatus()).toBe(409);
    expect(users).toHaveLength(1);
    expect(requests.filter((item) => item.status === 'APPROVED')).toHaveLength(
      1,
    );
    expect(requests.filter((item) => item.status === 'PENDING')).toHaveLength(
      1,
    );
    expect(manifests).toHaveLength(1);

    const rawErrors = await Promise.allSettled([
      prisma.user.create({
        data: {
          email: `${fixture.marker}-raw-a@example.test`,
          fullName: 'Raw Race A',
          identification: `${fixture.marker}-raw-a`,
          personId: fixture.personId,
          roleId: fixture.roleId,
          status: 'INACTIVE',
        },
      }),
      prisma.user.create({
        data: {
          email: `${fixture.marker}-raw-b@example.test`,
          fullName: 'Raw Race B',
          identification: `${fixture.marker}-raw-b`,
          personId: fixture.personId,
          roleId: fixture.roleId,
          status: 'INACTIVE',
        },
      }),
    ]);
    expect(
      rawErrors.some(
        (item) =>
          item.status === 'rejected' &&
          item.reason instanceof Prisma.PrismaClientKnownRequestError &&
          item.reason.code === 'P2002',
      ),
    ).toBe(true);
  });

  it.each(['email', 'identification'] as const)(
    'G maps a real concurrent User.%s P2002 to controlled HTTP 409',
    async (constraint) => {
      const first = await createFixture(`p2002-${constraint}-a`);
      const second = await createFixture(`p2002-${constraint}-b`);
      const firstRequest = await prisma.userRequest.findUniqueOrThrow({
        where: { id: first.requestId },
      });
      if (constraint === 'email') {
        await prisma.userRequest.update({
          where: { id: second.requestId },
          data: {
            email: firstRequest.email,
            submittedEmail: firstRequest.email,
          },
        });
      } else {
        const firstPerson = await prisma.person.findUniqueOrThrow({
          where: { id: first.personId },
        });
        await prisma.person.update({
          where: { id: second.personId },
          data: { identification: firstPerson.identification },
        });
      }
      const overlap = rendezvous(2);
      const firstApproval = service({ afterUserLookup: overlap.wait });
      const secondApproval = service({ afterUserLookup: overlap.wait });
      const settled = await Promise.allSettled([
        firstApproval.instance.approve(
          first.requestId,
          { roleId: first.roleId },
          first.actorId,
        ),
        secondApproval.instance.approve(
          second.requestId,
          { roleId: second.roleId },
          second.actorId,
        ),
      ]);
      const loser = settled.find(
        (item) => item.status === 'rejected',
      ) as PromiseRejectedResult;

      expect(overlap.arrivals()).toBe(2);
      expect(
        settled.filter((item) => item.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(loser.reason).toBeInstanceOf(ConflictException);
      expect((loser.reason as ConflictException).getStatus()).toBe(409);
      expect((loser.reason as ConflictException).message).toBe(
        'User identity is already registered',
      );
      expect(
        await prisma.userRequest.count({
          where: {
            id: { in: [first.requestId, second.requestId] },
            status: 'APPROVED',
          },
        }),
      ).toBe(1);
    },
  );

  it('D approve versus reject has one winner and a valid final state', async () => {
    const fixture = await createFixture('approve-reject');
    const claim = deferred<void>();
    const manifestPersisted = deferred<void>();
    const approval = service({
      afterManifest: () => {
        manifestPersisted.resolve();
        return Promise.resolve();
      },
      beforeClaim: () => claim.promise,
    });
    const approving = approval.instance.approve(
      fixture.requestId,
      { roleId: fixture.roleId },
      fixture.actorId,
    );
    await manifestPersisted.promise;
    const rejection = await approval.instance.reject(
      fixture.requestId,
      'Concurrent rejection won',
      fixture.actorId,
    );
    claim.resolve();
    await expect(approving).rejects.toBeInstanceOf(ConflictException);
    const state = await inspect(fixture);

    expect(rejection.status).toBe('REJECTED');
    expect(state.request).toMatchObject({
      rejectionReason: 'Concurrent rejection won',
      status: 'REJECTED',
    });
    expect(state.users).toHaveLength(0);
    expect(state.manifests).toHaveLength(0);
  });

  it.each([
    ['manifest', { afterManifest: failAfter('manifest') }],
    ['User', { afterUser: failAfter('User') }],
    ['token', { afterToken: failAfter('token') }],
  ] satisfies Array<[string, Hooks]>)(
    'E rolls back physically after %s persistence failure',
    async (_, hooks) => {
      const fixture = await createFixture(`rollback-${_}`);
      const approval = service(hooks);
      await expect(
        approval.instance.approve(
          fixture.requestId,
          { roleId: fixture.roleId },
          fixture.actorId,
        ),
      ).rejects.toThrow(`fault-after-${_}`);
      const state = await inspect(fixture);

      expect(state.request?.status).toBe('PENDING');
      expect(state.users).toHaveLength(0);
      expect(state.manifests).toHaveLength(0);
      expect(state.tokenCount).toBe(0);
      expect(approval.delivered).toHaveLength(0);
    },
  );

  it('F makes concurrent role deactivation wait on the approval row lock', async () => {
    const fixture = await createFixture('role-lock');
    const locked = deferred<void>();
    const release = deferred<void>();
    const approval = service({
      afterRoleLock: async () => {
        locked.resolve();
        await release.promise;
      },
    });
    const deactivator = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await deactivator.connect();
    try {
      const approving = approval.instance.approve(
        fixture.requestId,
        { roleId: fixture.roleId },
        fixture.actorId,
      );
      await locked.promise;
      const pidResult = await deactivator.query<{ pid: number }>(
        'SELECT pg_backend_pid() AS pid',
      );
      const deactivating = deactivator.query(
        'UPDATE "Role" SET "isActive" = false WHERE id = $1',
        [fixture.roleId],
      );
      await expectDatabaseLockWait(prisma, pidResult.rows[0].pid);

      release.resolve();
      await expect(approving).resolves.toMatchObject({
        userRequest: { status: 'APPROVED' },
      });
      await deactivating;
      const state = await inspect(fixture);
      const role = await prisma.role.findUniqueOrThrow({
        where: { id: fixture.roleId },
      });

      expect(state.request?.status).toBe('APPROVED');
      expect(state.users).toHaveLength(1);
      expect(state.tokenCount).toBe(1);
      expect(role.isActive).toBe(false);
    } finally {
      release.resolve();
      await deactivator.end();
    }
  });

  it('F rejects approval when role deactivation wins before lock acquisition', async () => {
    const fixture = await createFixture('role-race');
    const reached = deferred<void>();
    const release = deferred<void>();
    const approval = service({
      beforeRoleLock: async () => {
        reached.resolve();
        await release.promise;
      },
    });
    const approving = approval.instance.approve(
      fixture.requestId,
      { roleId: fixture.roleId },
      fixture.actorId,
    );
    await reached.promise;
    await prisma.role.update({
      where: { id: fixture.roleId },
      data: { isActive: false },
    });
    release.resolve();
    await expect(approving).rejects.toThrow('Role is inactive');
    const state = await inspect(fixture);

    expect(state.request?.status).toBe('PENDING');
    expect(state.users).toHaveLength(0);
    expect(state.manifests).toHaveLength(0);
  });

  async function cleanupMarker(marker: string) {
    const requests = await prisma.userRequest.findMany({
      where: { email: { startsWith: marker } },
      select: { id: true },
    });
    await prisma.identityReconciliationManifest.deleteMany({
      where: {
        sourceModel: 'UserRequest',
        sourceId: { in: requests.map(({ id }) => id) },
      },
    });
    await prisma.userRequest.deleteMany({
      where: { id: { in: requests.map(({ id }) => id) } },
    });
    await prisma.user.deleteMany({ where: { email: { startsWith: marker } } });
    await prisma.person.deleteMany({
      where: { legacyFullName: marker },
    });
    await prisma.role.deleteMany({ where: { name: { startsWith: marker } } });
  }
});

function wrapPrisma(prisma: PrismaService, hooks: Hooks): PrismaService {
  return new Proxy(prisma, {
    get(target, property, receiver) {
      if (property === '$transaction') {
        return (callback: (tx: Prisma.TransactionClient) => unknown) =>
          target.$transaction((tx) => callback(wrapTransaction(tx, hooks)));
      }
      const value = Reflect.get(target, property, receiver) as unknown;
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function wrapTransaction(
  tx: Prisma.TransactionClient,
  hooks: Hooks,
): Prisma.TransactionClient {
  const model = <T extends object>(
    target: T,
    overrides: Record<string, (...args: never[]) => unknown>,
  ) =>
    new Proxy(target, {
      get(value, property, receiver) {
        if (typeof property === 'string' && overrides[property])
          return overrides[property];
        const member = Reflect.get(value, property, receiver) as unknown;
        return typeof member === 'function' ? member.bind(value) : member;
      },
    });
  return new Proxy(tx, {
    get(target, property, receiver) {
      if (property === '$queryRaw') {
        return async (...args: never[]) => {
          await hooks.beforeRoleLock?.();
          const result = await (
            target.$queryRaw as (...values: never[]) => Promise<unknown>
          )(...args);
          await hooks.afterRoleLock?.();
          return result;
        };
      }
      if (property === 'identityReconciliationManifest') {
        return model(target.identityReconciliationManifest, {
          upsert: async (...args: never[]) => {
            const result = await (
              target.identityReconciliationManifest.upsert as (
                ...values: never[]
              ) => unknown
            )(...args);
            await hooks.afterManifest?.();
            return result;
          },
        });
      }
      if (property === 'user') {
        return model(target.user, {
          create: async (...args: never[]) => {
            const result = await (
              target.user.create as (...values: never[]) => unknown
            )(...args);
            await hooks.afterUser?.();
            return result;
          },
          findUnique: async (...args: never[]) => {
            const result = await (
              target.user.findUnique as (...values: never[]) => unknown
            )(...args);
            await hooks.afterUserLookup?.();
            return result;
          },
        });
      }
      if (property === 'accountActivationToken') {
        return model(target.accountActivationToken, {
          create: async (...args: never[]) => {
            const result = await (
              target.accountActivationToken.create as (
                ...values: never[]
              ) => unknown
            )(...args);
            await hooks.afterToken?.();
            return result;
          },
        });
      }
      if (property === 'userRequest') {
        return model(target.userRequest, {
          updateMany: async (...args: never[]) => {
            await hooks.beforeClaim?.();
            return (
              target.userRequest.updateMany as (...values: never[]) => unknown
            )(...args);
          },
        });
      }
      const value = Reflect.get(target, property, receiver) as unknown;
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function failAfter(boundary: string) {
  return () => Promise.reject(new Error(`fault-after-${boundary}`));
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function rendezvous(parties: number) {
  let arrivals = 0;
  const release = deferred<void>();
  return {
    arrivals: () => arrivals,
    wait: async () => {
      arrivals += 1;
      if (arrivals === parties) release.resolve();
      await release.promise;
    },
  };
}

async function expectDatabaseLockWait(prisma: PrismaService, pid: number) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const rows = await prisma.$queryRaw<
      Array<{ wait_event_type: string | null }>
    >(Prisma.sql`
      SELECT wait_event_type
      FROM pg_stat_activity
      WHERE pid = ${pid}
    `);
    if (rows[0]?.wait_event_type === 'Lock') return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('role deactivation did not wait on approval row lock');
}
