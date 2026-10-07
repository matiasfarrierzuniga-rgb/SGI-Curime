import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  DonationMethod,
  DonationStatus,
  FinancialMovementSource,
  FinancialMovementStatus,
  FinancialMovementType,
  PrismaClient,
} from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { DonationsService } from './donations.service';

const connectionString = process.env.DONATIONS_TEST_DATABASE_URL;
const describeIntegration = connectionString ? describe : describe.skip;
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;

describeIntegration('donation and ledger persistence PostgreSQL', () => {
  const db = prisma!;
  const service = new DonationsService(
    db as never,
    new AuditService(db as never),
  );
  const unique = randomUUID();
  let roleId: number | undefined;
  let actorId: number | undefined;
  let donationId: number | undefined;

  beforeAll(async () => {
    const role = await db.role.create({
      data: { name: `donations-integration-${unique}` },
    });
    roleId = role.id;
    const actor = await db.user.create({
      data: {
        fullName: 'Donation integration actor',
        identification: `donations-${unique}`,
        email: `donations-${unique}@example.test`,
        roleId: role.id,
      },
    });
    actorId = actor.id;
  });

  afterAll(async () => {
    if (donationId !== undefined) {
      const movements = await db.financialMovement.findMany({
        where: {
          legacySource: FinancialMovementSource.DONATION,
          legacySourceId: donationId,
        },
        select: { id: true, reversalOfId: true },
      });
      const reversalIds = movements
        .filter((movement) => movement.reversalOfId !== null)
        .map((movement) => movement.id);

      if (reversalIds.length) {
        await db.financialMovement.deleteMany({
          where: { id: { in: reversalIds } },
        });
      }

      await db.donation.updateMany({
        where: { id: donationId },
        data: { originalMovementId: null },
      });
      await db.donation.deleteMany({ where: { id: donationId } });

      const originalMovementIds = movements
        .filter((movement) => movement.reversalOfId === null)
        .map((movement) => movement.id);
      if (originalMovementIds.length) {
        await db.financialMovement.deleteMany({
          where: { id: { in: originalMovementIds } },
        });
      }
    }

    if (actorId !== undefined) {
      await db.auditLog.deleteMany({ where: { userId: actorId } });
      await db.user.deleteMany({ where: { id: actorId } });
    }
    if (roleId !== undefined) {
      await db.role.deleteMany({ where: { id: roleId } });
    }
    await db.$disconnect();
  });

  it('persists a donation, its income movement, and a cancellation reversal', async () => {
    const receivedAt = '2030-01-02T15:30:00.000Z';
    const created = await service.create(
      {
        donorName: 'Integration donor',
        amount: '4200.50',
        method: DonationMethod.BANK_TRANSFER,
        reference: `donation-${unique}`,
        description: 'Integration test donation',
        receivedAt,
      },
      actorId!,
    );
    donationId = created.id;

    if (created.originalMovementId === null) {
      throw new Error('Created donation has no original movement.');
    }

    expect(created).toMatchObject({
      amount: '4200.50',
      status: DonationStatus.CONFIRMED,
    });
    expect(typeof created.originalMovementId).toBe('number');

    const persistedDonation = await db.donation.findUniqueOrThrow({
      where: { id: created.id },
      include: { originalMovement: true },
    });
    const persistedOriginalMovement = persistedDonation.originalMovement;
    if (!persistedOriginalMovement) {
      throw new Error('Persisted donation has no original movement.');
    }
    expect(persistedOriginalMovement).toMatchObject({
      id: created.originalMovementId,
      type: FinancialMovementType.INCOME,
      legacySource: FinancialMovementSource.DONATION,
      legacySourceId: created.id,
      status: FinancialMovementStatus.POSTED,
      occurredAt: new Date(receivedAt),
    });
    expect(persistedOriginalMovement.amount.toFixed(2)).toBe('4200.50');
    expect(
      await service.findAll({
        search: `donation-${unique}`,
        page: 1,
        limit: 10,
      }),
    ).toMatchObject({
      total: 1,
      data: [expect.objectContaining({ id: created.id, amount: '4200.50' })],
    });

    const cancelled = await service.cancel(
      created.id,
      { cancellationReason: 'Integration cancellation' },
      actorId!,
    );
    expect(cancelled).toMatchObject({
      status: DonationStatus.CANCELLED,
      originalMovementId: created.originalMovementId,
    });
    expect(typeof cancelled.reversalMovementId).toBe('number');
    if (cancelled.reversalMovementId === null) {
      throw new Error('Cancelled donation has no reversal movement.');
    }

    const [originalMovement, reversalMovement] = await Promise.all([
      db.financialMovement.findUniqueOrThrow({
        where: { id: created.originalMovementId },
      }),
      db.financialMovement.findUniqueOrThrow({
        where: { id: cancelled.reversalMovementId },
      }),
    ]);
    expect(originalMovement).toMatchObject({
      type: FinancialMovementType.INCOME,
      occurredAt: new Date(receivedAt),
    });
    expect(originalMovement.amount.toFixed(2)).toBe('4200.50');
    expect(reversalMovement).toMatchObject({
      type: FinancialMovementType.EXPENSE,
      legacySource: FinancialMovementSource.DONATION,
      legacySourceId: created.id,
      status: FinancialMovementStatus.POSTED,
      reversalOfId: originalMovement.id,
      currency: persistedDonation.currency,
    });
    expect(reversalMovement.amount.toFixed(2)).toBe('4200.50');
  });
});
