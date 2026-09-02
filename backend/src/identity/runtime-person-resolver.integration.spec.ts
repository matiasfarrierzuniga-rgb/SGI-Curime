import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../../generated/prisma/client';
import { RuntimePersonResolverService } from './runtime-person-resolver.service';

const connectionString = process.env.IDENTITY_7_1_TEST_DATABASE_URL;
const describeIntegration = connectionString ? describe : describe.skip;

describeIntegration('runtime Person resolver PostgreSQL', () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString! }),
  });
  const resolver = new RuntimePersonResolverService(prisma as never);

  beforeEach(async () => {
    await prisma.identityReconciliationManifest.deleteMany();
    await prisma.userRequest.deleteMany();
    await prisma.affiliateRequest.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.affiliate.deleteMany();
    await prisma.person.deleteMany();
    await prisma.role.deleteMany();
  });

  afterAll(async () => prisma.$disconnect());

  it('creates one canonical Person without relationship or manifest writes', async () => {
    const result = await resolver.resolve(input(), prisma);

    expect(result).toMatchObject({
      status: 'PERSON_CREATED',
      profileEnrichmentRequired: false,
    });
    expect(await prisma.person.count()).toBe(1);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.affiliate.count()).toBe(0);
    expect(await prisma.userRequest.count()).toBe(0);
    expect(await prisma.affiliateRequest.count()).toBe(0);
    expect(await prisma.identityReconciliationManifest.count()).toBe(0);
  });

  it('reuses a compatible Person without changing it', async () => {
    const existing = await prisma.person.create({
      data: personData(),
    });
    const before = await prisma.person.findUniqueOrThrow({
      where: { id: existing.id },
    });

    const result = await resolver.resolve(input(), prisma);
    const after = await prisma.person.findUniqueOrThrow({
      where: { id: existing.id },
    });

    expect(result).toMatchObject({ status: 'PERSON_REUSED' });
    expect(after).toEqual(before);
    expect(await prisma.person.count()).toBe(1);
  });

  it('enforces the logical identity unique constraint', async () => {
    await prisma.person.create({ data: personData() });

    await expect(
      prisma.person.create({
        data: { ...personData(), firstName: 'Different' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
    expect(await prisma.person.count()).toBe(1);
  });

  it('converts concurrent same-key creation into one create and one reuse', async () => {
    const results = await Promise.all([
      resolver.resolve(input(), prisma),
      resolver.resolve(input(), prisma),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      'PERSON_CREATED',
      'PERSON_REUSED',
    ]);
    expect(await prisma.person.count()).toBe(1);
    expect(
      await prisma.person.count({
        where: {
          identificationType: 'NATIONAL',
          normalizedIdentification: input().identification,
        },
      }),
    ).toBe(1);
  });

  it('returns conflict for incompatible same-key structured name', async () => {
    await prisma.person.create({
      data: { ...personData(), firstName: 'Different' },
    });

    await expect(resolver.resolve(input(), prisma)).resolves.toEqual({
      status: 'IDENTITY_CONFLICT',
      conflictFields: ['firstName'],
    });
    expect(await prisma.person.count()).toBe(1);
  });

  it('keeps nullable transitional keys while enforcing non-null keys', async () => {
    await prisma.person.create({ data: { firstName: 'Legacy One' } });
    await prisma.person.create({ data: { firstName: 'Legacy Two' } });

    expect(await prisma.person.count()).toBe(2);
    const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND indexname = 'Person_identificationType_normalizedIdentification_key'
    `;
    expect(indexes).toHaveLength(1);
  });
});

function input() {
  return {
    identificationType: 'NATIONAL',
    identification: '423456789',
    firstName: 'Runtime',
    firstSurname: 'Identity',
    secondSurname: 'Test',
  };
}

function personData(): Prisma.PersonCreateInput {
  const identity = input();
  return {
    ...identity,
    identificationType: 'NATIONAL',
    normalizedIdentification: identity.identification,
  };
}
