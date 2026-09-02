import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { applyWithRetry, readState } from '../../prisma/reconcile-legacy-user';
import {
  buildManualReconciliationPlan,
  type ManualReconciliationInput,
} from './manual-legacy-user-reconciliation';

const connectionString = process.env.IDENTITY_6_6_TEST_DATABASE_URL;
const describeIntegration = connectionString ? describe : describe.skip;

describeIntegration('manual legacy User reconciliation PostgreSQL', () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString! }),
  });

  beforeEach(async () => {
    await prisma.identityReconciliationManifest.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.person.deleteMany();
    await prisma.role.deleteMany();
  });

  afterAll(async () => prisma.$disconnect());

  it('dry-runs without writes, creates and links atomically, then reruns idempotently', async () => {
    const role = await prisma.role.create({ data: { name: 'Test Role' } });
    const user = await prisma.user.create({
      data: {
        fullName: 'Legacy Test Account',
        identification: '123456789',
        email: 'legacy-db@example.test',
        passwordHash: 'preserved-hash',
        roleId: role.id,
      },
    });
    await prisma.session.create({
      data: {
        refreshTokenHash: 'preserved-session',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        userId: user.id,
      },
    });
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const input = baseInput(user.id);
    const dryState = await readState(prisma, input);
    const dryPlan = buildManualReconciliationPlan(
      dryState.user,
      dryState.people,
      input,
    );
    expect(dryPlan.status).toBe('READY_TO_CREATE');
    expect(await prisma.person.count()).toBe(0);
    expect(await prisma.identityReconciliationManifest.count()).toBe(0);

    const confirmedInput = {
      ...input,
      expectedSourceFingerprint: dryPlan.sourceFingerprint,
      expectedConfirmationFingerprint: dryPlan.confirmationFingerprint,
    };
    const first = await applyWithRetry(prisma, confirmedInput);
    expect(first).toMatchObject({
      personCreated: 1,
      personReused: 0,
      userLinkCreated: 1,
    });
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect({ ...after, personId: null }).toEqual({ ...before, personId: null });
    expect(after.personId).not.toBeNull();
    expect(await prisma.session.count()).toBe(1);
    expect(await prisma.person.count()).toBe(1);
    expect(await prisma.identityReconciliationManifest.count()).toBe(1);

    const second = await applyWithRetry(prisma, confirmedInput);
    expect(second).toMatchObject({
      personCreated: 0,
      personReused: 0,
      userLinkCreated: 0,
      plan: { status: 'ALREADY_RECONCILED' },
    });
    expect(await prisma.person.count()).toBe(1);
    expect(await prisma.user.count()).toBe(1);
  });

  it('reuses one compatible Person without changing it', async () => {
    const role = await prisma.role.create({ data: { name: 'Reuse Role' } });
    const user = await prisma.user.create({
      data: {
        fullName: 'Legacy Reuse Account',
        identification: '223456789',
        email: 'reuse-db@example.test',
        roleId: role.id,
      },
    });
    const person = await prisma.person.create({
      data: {
        firstName: 'Test',
        firstSurname: 'Identity',
        secondSurname: 'Record',
        identification: user.identification,
        identificationType: 'NATIONAL',
        normalizedIdentification: user.identification,
      },
    });
    const input = baseInput(user.id);
    const state = await readState(prisma, input);
    const plan = buildManualReconciliationPlan(state.user, state.people, input);
    const result = await applyWithRetry(prisma, {
      ...input,
      expectedSourceFingerprint: plan.sourceFingerprint,
      expectedConfirmationFingerprint: plan.confirmationFingerprint,
    });
    expect(result).toMatchObject({
      personCreated: 0,
      personReused: 1,
      userLinkCreated: 1,
    });
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .personId,
    ).toBe(person.id);
    expect(await prisma.person.count()).toBe(1);
  });

  it('serializes overlapping creation and creates one Person', async () => {
    const role = await prisma.role.create({
      data: { name: 'Concurrent Role' },
    });
    const user = await prisma.user.create({
      data: {
        fullName: 'Concurrent Legacy Account',
        identification: '323456789',
        email: 'concurrent-db@example.test',
        roleId: role.id,
      },
    });
    const input = baseInput(user.id);
    const state = await readState(prisma, input);
    const plan = buildManualReconciliationPlan(state.user, state.people, input);
    const confirmedInput = {
      ...input,
      expectedSourceFingerprint: plan.sourceFingerprint,
      expectedConfirmationFingerprint: plan.confirmationFingerprint,
    };
    const results = await Promise.all([
      applyWithRetry(prisma, confirmedInput),
      applyWithRetry(prisma, confirmedInput),
    ]);
    expect(
      results.reduce((total, result) => total + result.personCreated, 0),
    ).toBe(1);
    expect(
      results.reduce((total, result) => total + result.userLinkCreated, 0),
    ).toBe(1);
    expect(await prisma.person.count()).toBe(1);
    expect(await prisma.identityReconciliationManifest.count()).toBe(1);
  });
});

function baseInput(userId: number): ManualReconciliationInput {
  return {
    userId,
    identificationType: 'NATIONAL',
    firstName: 'Test',
    firstSurname: 'Identity',
    secondSurname: 'Record',
    apply: true,
    confirmUserId: userId,
    expectedSourceFingerprint: null,
    expectedConfirmationFingerprint: null,
  };
}
