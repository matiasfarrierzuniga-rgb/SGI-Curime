/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AbsenceJustificationsService } from './absence-justifications.service';

function setup(
  options: {
    assemblyStatus?: string;
    attendanceStatus?: string;
    existing?: boolean;
    convoked?: boolean;
  } = {},
) {
  const prisma = {
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ person: { affiliate: { id: 7 } } }),
    },
    assembly: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        status: options.assemblyStatus ?? 'COMPLETED',
        convocations: options.convoked === false ? [] : [{ id: 2 }],
      }),
    },
    affiliate: {
      findFirst: jest.fn().mockResolvedValue({ id: 7 }),
      findUnique: jest.fn().mockResolvedValue({
        id: 7,
        fullName: 'Afiliada',
        identification: '1',
      }),
    },
    assemblyAttendance: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 4, status: options.attendanceStatus ?? 'ABSENT' }),
      upsert: jest.fn(),
    },
    absenceJustification: {
      findUnique: jest
        .fn()
        .mockResolvedValue(options.existing ? { id: 3 } : null),
      create: jest.fn().mockResolvedValue({
        id: 3,
        legacyAssemblyId: 1,
        legacyAffiliateId: 7,
        status: 'PENDING',
      }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (work: unknown) =>
    typeof work === 'function'
      ? (work as (tx: unknown) => unknown)(prisma)
      : Promise.all(work as Promise<unknown>[]),
  );
  return { prisma, service: new AbsenceJustificationsService(prisma as never) };
}

describe('Own absence justification', () => {
  const payload = {
    assemblyId: 1,
    reason: 'Motivo suficientemente detallado para justificar.',
  };

  it('resolves authenticated User -> Affiliate and lets an absent convoked person justify', async () => {
    const { prisma, service } = setup();
    await expect(
      service.registerMine(payload, undefined, 42),
    ).resolves.toMatchObject({ status: 'PENDING' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
    expect(prisma.absenceJustification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          legacyAffiliateId: 7,
          legacyAssemblyId: 1,
          attendanceId: 4,
        }),
      }),
    );
  });

  it.each([
    ['present', { attendanceStatus: 'PRESENT' }],
    ['scheduled', { assemblyStatus: 'SCHEDULED' }],
    ['cancelled', { assemblyStatus: 'CANCELLED' }],
    ['not convoked', { convoked: false }],
    ['duplicate', { existing: true }],
  ])('rejects justification when %s', async (_label, options) => {
    const { service } = setup(options);
    await expect(
      service.registerMine(payload, undefined, 42),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an account without a linked Affiliate', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue({ person: null });
    await expect(
      service.registerMine(payload, undefined, 42),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists only justifications of the resolved Affiliate', async () => {
    const { prisma, service } = setup();
    await service.findMine({ page: 1, limit: 20 }, 42);
    expect(prisma.absenceJustification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ legacyAffiliateId: 7 }),
      }),
    );
  });

  it.each(['ABSENT', 'PRESENT'])(
    'approves justification without rewriting %s attendance',
    async (attendanceStatus) => {
      const { prisma, service } = setup({ attendanceStatus });
      prisma.absenceJustification.findUnique.mockResolvedValue({
        id: 3,
        legacyAssemblyId: 1,
        legacyAffiliateId: 7,
        status: 'PENDING',
      });

      await service.approve(3, null, 42);

      expect(prisma.absenceJustification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED' }) }),
      );
      expect(prisma.assemblyAttendance.upsert).not.toHaveBeenCalled();
    },
  );
});
