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
    affiliate: { findFirst: jest.fn().mockResolvedValue({ id: 7 }) },
    assemblyAttendance: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ status: options.attendanceStatus ?? 'ABSENT' }),
    },
    absenceJustification: {
      findUnique: jest
        .fn()
        .mockResolvedValue(options.existing ? { id: 3 } : null),
      create: jest.fn().mockResolvedValue({
        id: 3,
        assemblyId: 1,
        affiliateId: 7,
        status: 'PENDING',
      }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn(async (items: Promise<unknown>[]) =>
      Promise.all(items),
    ),
  };
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
        data: expect.objectContaining({ affiliateId: 7, assemblyId: 1 }),
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
        where: expect.objectContaining({ affiliateId: 7 }),
      }),
    );
  });
});
