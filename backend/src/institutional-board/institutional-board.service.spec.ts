import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BoardPosition } from '../../generated/prisma/enums';
import { InstitutionalBoardService } from './institutional-board.service';

describe('InstitutionalBoardService', () => {
  const tx = {
    governanceTerm: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    governanceMembership: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    person: { findUnique: jest.fn() },
  };
  const prisma = {
    governanceTerm: { findMany: jest.fn(), findFirst: jest.fn() },
    person: { findMany: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const audit = { log: jest.fn().mockResolvedValue({}) };
  const service = new InstitutionalBoardService(prisma as never, audit as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a term and audit atomically', async () => {
    tx.governanceTerm.create.mockResolvedValue({
      id: 4,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
    });
    await service.createTerm(
      { startsOn: '2026-01-01', endsOn: '2027-12-31' },
      2,
      {},
    );
    expect(tx.governanceTerm.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ legacyInstitutionalProfileId: 1 }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BOARD_TERM_CREATED',
        details: { changedFields: ['startsOn', 'endsOn'] },
      }),
      tx,
    );
  });

  it.each([
    ['2027-01-01', '2026-01-01'],
    ['2027-01-01', '2027-01-01'],
  ])('rejects non-increasing term dates', (startsOn, endsOn) =>
    expect(() => service.createTerm({ startsOn, endsOn }, 2, {})).toThrow(
      BadRequestException,
    ),
  );

  it('rejects a term update that leaves an appointment outside', async () => {
    tx.governanceTerm.findFirst.mockResolvedValue({
      id: 4,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2028-12-31'),
    });
    tx.governanceMembership.findMany.mockResolvedValue([
      {
        startedAt: new Date('2027-01-01'),
        endedAt: new Date('2027-12-31'),
      },
    ]);
    await expect(
      service.updateTerm(4, { endsOn: '2026-12-31' }, 2, {}),
    ).rejects.toThrow('uno o más nombramientos');
    expect(tx.governanceTerm.update).not.toHaveBeenCalled();
  });

  it('creates an appointment through governance membership fields', async () => {
    tx.governanceTerm.findFirst.mockResolvedValue({
      id: 4,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
    });
    tx.person.findUnique.mockResolvedValue({ id: 9 });
    tx.governanceMembership.create.mockResolvedValue({
      id: 3,
      termId: 4,
      legacyPersonId: 9,
      legacyPosition: BoardPosition.TREASURER,
      seatNumber: null,
      startedAt: null,
      endedAt: null,
    });
    await service.createAppointment(
      4,
      {
        personId: 9,
        position: BoardPosition.TREASURER,
        startsOn: null,
        endsOn: null,
      },
      2,
      {},
    );
  });

  it('rejects a missing person', async () => {
    tx.governanceTerm.findFirst.mockResolvedValue({
      id: 4,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
    });
    tx.person.findUnique.mockResolvedValue(null);
    await expect(
      service.createAppointment(
        4,
        { personId: 999, position: BoardPosition.PRESIDENT },
        2,
        {},
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
