import {
  FinancialMovementSource,
  FinancialMovementStatus,
  FinancialMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialService } from './financial.service';

describe('FinancialService treasury summary', () => {
  const prisma = {
    financialMovement: { groupBy: jest.fn() },
    financialCharge: { aggregate: jest.fn() },
    payment: { aggregate: jest.fn() },
    donation: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new FinancialService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
    prisma.financialMovement.groupBy
      .mockResolvedValueOnce([
        {
          type: FinancialMovementType.INCOME,
          legacySource: FinancialMovementSource.RESERVATION_PAYMENT,
          _sum: { amount: new Prisma.Decimal('30000.00') },
          _count: { _all: 1 },
        },
        {
          type: FinancialMovementType.INCOME,
          legacySource: FinancialMovementSource.DONATION,
          _sum: { amount: new Prisma.Decimal('10000.00') },
          _count: { _all: 1 },
        },
        {
          type: FinancialMovementType.EXPENSE,
          legacySource: FinancialMovementSource.MANUAL,
          _sum: { amount: new Prisma.Decimal('5000.00') },
          _count: { _all: 1 },
        },
      ])
      .mockResolvedValueOnce([
        {
          type: FinancialMovementType.INCOME,
          legacySource: FinancialMovementSource.DONATION,
          _sum: { amount: new Prisma.Decimal('10000.00') },
          _count: { _all: 1 },
        },
        {
          type: FinancialMovementType.EXPENSE,
          legacySource: FinancialMovementSource.MANUAL,
          _sum: { amount: new Prisma.Decimal('5000.00') },
          _count: { _all: 1 },
        },
      ]);
    prisma.financialCharge.aggregate.mockResolvedValue({
      _sum: { amount: new Prisma.Decimal('20000.00') },
      _count: { _all: 2 },
    });
    prisma.payment.aggregate
      .mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal('45000.00') },
        _count: { _all: 2 },
      })
      .mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal('15000.00') },
        _count: { _all: 1 },
      });
    prisma.donation.count.mockResolvedValue(0);
  });

  it('uses Decimal aggregates across all records and exposes incomplete payment linkage', async () => {
    const result = await service.summarizeTreasury({
      dateFrom: '2026-10-01T06:00:00.000Z',
      dateTo: '2026-11-01T05:59:59.999Z',
    });

    expect(result.accumulated).toEqual(
      expect.objectContaining({
        income: '40000.00',
        expenses: '5000.00',
        net: '35000.00',
      }),
    );
    expect(result.currentPeriod).toEqual(
      expect.objectContaining({
        income: '10000.00',
        expenses: '5000.00',
        net: '5000.00',
      }),
    );
    expect(result.receivables).toEqual({
      pendingCharges: '20000.00',
      pendingChargeCount: 2,
    });
    expect(result.registeredBalance).toBeNull();
    expect(result.openingBalance.established).toBe(false);
    expect(result.reconciliation).toEqual(
      expect.objectContaining({
        confirmedPayments: '45000.00',
        unlinkedConfirmedPayments: '15000.00',
        reliable: false,
      }),
    );
    expect(prisma.financialMovement.groupBy).toHaveBeenNthCalledWith(1, {
      by: ['type', 'legacySource'],
      where: {
        currency: 'CRC',
        voidedAt: null,
        OR: [{ status: FinancialMovementStatus.POSTED }, { status: null }],
      },
      orderBy: [{ type: 'asc' }, { legacySource: 'asc' }],
      _sum: { amount: true },
      _count: { _all: true },
    });
  });

  it('reports opening balance as pending even when linked history has no detected gaps', async () => {
    prisma.payment.aggregate
      .mockReset()
      .mockResolvedValueOnce({
        _sum: { amount: new Prisma.Decimal('30000.00') },
        _count: { _all: 1 },
      })
      .mockResolvedValueOnce({ _sum: { amount: null }, _count: { _all: 0 } });
    const result = await service.summarizeTreasury({});
    expect(result.reconciliation.reason).toBe(
      'OPENING_BALANCE_NOT_ESTABLISHED',
    );
    expect(result.registeredBalance).toBeNull();
  });
});
