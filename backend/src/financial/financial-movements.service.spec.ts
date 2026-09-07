import { NotFoundException } from '@nestjs/common';
import {
  FinancialMovementSource,
  FinancialMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialService } from './financial.service';

const occurredAt = new Date('2026-09-06T16:00:00.000Z');
const createdAt = new Date('2026-09-06T16:01:00.000Z');

function movement(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    type: FinancialMovementType.INCOME,
    source: FinancialMovementSource.MANUAL,
    amount: new Prisma.Decimal('25000.00'),
    currency: 'CRC',
    description: 'Alquiler del salón comunal',
    reference: 'SINPE 123456',
    occurredAt,
    sourceId: null,
    recordedById: 17,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

describe('FinancialService movements', () => {
  const prisma = {
    financialMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const audit = { log: jest.fn() };
  let service: FinancialService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FinancialService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
    prisma.financialMovement.create.mockResolvedValue(movement());
    prisma.financialMovement.findMany.mockResolvedValue([movement()]);
    prisma.financialMovement.count.mockResolvedValue(1);
    prisma.financialMovement.findUnique.mockResolvedValue(
      movement({ recordedBy: { id: 17, fullName: 'Persona Tesorera' } }),
    );
    prisma.financialMovement.groupBy.mockResolvedValue([]);
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
  });

  it.each([FinancialMovementType.INCOME, FinancialMovementType.EXPENSE])(
    'creates a valid %s with server-owned fields and serialized amount',
    async (type) => {
      prisma.financialMovement.create.mockResolvedValue(movement({ type }));

      const result = await service.createMovement(
        {
          type,
          amount: '25000.00',
          description: '  Alquiler del salón comunal  ',
          reference: '  SINPE 123456  ',
          occurredAt: occurredAt.toISOString(),
        },
        17,
      );

      expect(prisma.financialMovement.create).toHaveBeenCalledWith({
        data: {
          type,
          source: FinancialMovementSource.MANUAL,
          sourceId: null,
          amount: new Prisma.Decimal('25000.00'),
          currency: 'CRC',
          description: 'Alquiler del salón comunal',
          reference: 'SINPE 123456',
          occurredAt,
          recordedById: 17,
        },
        select: expect.any(Object),
      });
      expect(result.amount).toBe('25000.00');
    },
  );

  it('normalizes an empty reference to null', async () => {
    await service.createMovement(
      {
        type: FinancialMovementType.EXPENSE,
        amount: '50.00',
        description: 'Compra',
        reference: '   ',
        occurredAt: occurredAt.toISOString(),
      },
      17,
    );

    expect(prisma.financialMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reference: null }),
      }),
    );
  });

  it('emits audit only after successful creation', async () => {
    await service.createMovement(
      {
        type: FinancialMovementType.INCOME,
        amount: '25000.00',
        description: 'Ingreso',
        occurredAt: occurredAt.toISOString(),
      },
      17,
      { ipAddress: '127.0.0.1' },
    );

    expect(audit.log).toHaveBeenCalledWith({
      userId: 17,
      action: AuditAction.FINANCIAL_MOVEMENT_CREATED,
      module: 'FINANCIAL',
      entityType: 'FinancialMovement',
      entityId: 10,
      details: {
        movementId: 10,
        type: FinancialMovementType.INCOME,
        amount: '25000.00',
        occurredAt,
      },
      ipAddress: '127.0.0.1',
    });

    prisma.financialMovement.create.mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    await expect(
      service.createMovement(
        {
          type: FinancialMovementType.INCOME,
          amount: '1.00',
          description: 'Ingreso',
          occurredAt: occurredAt.toISOString(),
        },
        17,
      ),
    ).rejects.toThrow('database unavailable');
    expect(audit.log).toHaveBeenCalledTimes(1);
  });

  it('lists with pagination, type/date filters and deterministic ordering', async () => {
    const dateFrom = '2026-09-01T00:00:00.000Z';
    const dateTo = '2026-09-30T23:59:59.000Z';
    const result = await service.findMovements({
      type: FinancialMovementType.EXPENSE,
      dateFrom,
      dateTo,
      page: 2,
      limit: 20,
    });

    expect(prisma.financialMovement.findMany).toHaveBeenCalledWith({
      where: {
        type: FinancialMovementType.EXPENSE,
        occurredAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      select: expect.any(Object),
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      skip: 20,
      take: 20,
    });
    expect(result).toEqual({
      data: [expect.objectContaining({ id: 10, amount: '25000.00' })],
      total: 1,
      page: 2,
      limit: 20,
    });
  });

  it('returns movement detail with only the selected recorder identity', async () => {
    const result = await service.findMovement(10);

    expect(prisma.financialMovement.findUnique).toHaveBeenCalledWith({
      where: { id: 10 },
      select: expect.objectContaining({
        recordedBy: { select: { id: true, fullName: true } },
      }),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 10,
        amount: '25000.00',
        recordedBy: { id: 17, fullName: 'Persona Tesorera' },
      }),
    );
  });

  it('throws 404 for an unknown movement', async () => {
    prisma.financialMovement.findUnique.mockResolvedValueOnce(null);
    await expect(service.findMovement(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it.each([
    [[], '0.00', '0.00', '0.00'],
    [
      [
        {
          type: FinancialMovementType.INCOME,
          _sum: { amount: new Prisma.Decimal('100000.00') },
        },
      ],
      '100000.00',
      '0.00',
      '100000.00',
    ],
    [
      [
        {
          type: FinancialMovementType.EXPENSE,
          _sum: { amount: new Prisma.Decimal('35000.00') },
        },
      ],
      '0.00',
      '35000.00',
      '-35000.00',
    ],
    [
      [
        {
          type: FinancialMovementType.INCOME,
          _sum: { amount: new Prisma.Decimal('100000.10') },
        },
        {
          type: FinancialMovementType.EXPENSE,
          _sum: { amount: new Prisma.Decimal('35000.05') },
        },
      ],
      '100000.10',
      '35000.05',
      '65000.05',
    ],
  ])(
    'summarizes Decimal totals safely',
    async (groups, income, expenses, balance) => {
      prisma.financialMovement.groupBy.mockResolvedValueOnce(groups);

      await expect(service.summarizeMovements({})).resolves.toEqual({
        currency: 'CRC',
        totalIncome: income,
        totalExpenses: expenses,
        balance,
      });
    },
  );

  it('applies inclusive instant date filters to the summary', async () => {
    const dateFrom = '2026-09-01T12:30:00.000Z';
    const dateTo = '2026-09-06T16:00:00.000Z';
    await service.summarizeMovements({ dateFrom, dateTo });

    expect(prisma.financialMovement.groupBy).toHaveBeenCalledWith({
      by: ['type'],
      where: {
        type: undefined,
        occurredAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      _sum: { amount: true },
    });
  });
});
