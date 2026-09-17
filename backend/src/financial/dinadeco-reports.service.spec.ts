import {
  FinancialMovementSource,
  FinancialMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DinadecoReportsService } from './dinadeco-reports.service';

const decimal = (value: string) => new Prisma.Decimal(value);

describe('DinadecoReportsService', () => {
  const prisma = {
    financialMovement: { groupBy: jest.fn(), findMany: jest.fn() },
    donation: { findMany: jest.fn(), aggregate: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: DinadecoReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.financialMovement.findMany.mockResolvedValue([]);
    service = new DinadecoReportsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
  });

  it('returns zero balances and complete metadata for an empty report', async () => {
    prisma.financialMovement.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const result = await service.annual(2026, {
      id: 7,
      fullName: 'Persona Tesorera',
    });

    expect(result.data).toEqual({
      year: 2026,
      currency: 'CRC',
      openingBalance: '0.00',
      income: { total: '0.00', count: 0, bySource: {} },
      expenses: { total: '0.00', count: 0, bySource: {} },
      netMovement: '0.00',
      closingBalance: '0.00',
      movementCount: 0,
      fie: {
        entries: [],
        exits: [],
        capacity: {
          entryCount: 0,
          exitCount: 0,
          entryCapacity: 15,
          exitCapacity: 15,
          entryOverflow: false,
          exitOverflow: false,
        },
        totalIncomePlusOpeningBalance: '0.00',
        totalExpensesPlusClosingBalance: '0.00',
      },
    });
    expect(result.metadata).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(Date),
        generatedBy: { id: 7, fullName: 'Persona Tesorera' },
        period: {
          from: new Date('2026-01-01T00:00:00.000Z'),
          to: new Date('2027-01-01T00:00:00.000Z'),
        },
        appliedFilters: { year: 2026 },
        dataSource: 'FINANCIAL_MOVEMENT',
        reportVersion: '1.0',
      }),
    );
  });

  it('separates opening history, annual movement, sources, and closing formula', async () => {
    prisma.financialMovement.groupBy
      .mockResolvedValueOnce([
        {
          type: FinancialMovementType.INCOME,
          _sum: { amount: decimal('1000.10') },
        },
        {
          type: FinancialMovementType.EXPENSE,
          _sum: { amount: decimal('200.05') },
        },
      ])
      .mockResolvedValueOnce([
        {
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.MANUAL,
          _sum: { amount: decimal('300.20') },
          _count: { _all: 2 },
        },
        {
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.RESERVATION_PAYMENT,
          _sum: { amount: decimal('400.30') },
          _count: { _all: 1 },
        },
        {
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.DONATION,
          _sum: { amount: decimal('500.40') },
          _count: { _all: 3 },
        },
        {
          type: FinancialMovementType.EXPENSE,
          source: FinancialMovementSource.MANUAL,
          _sum: { amount: decimal('100.15') },
          _count: { _all: 1 },
        },
      ]);

    const result = await service.annual(2026, { id: 7, fullName: 'Tesorería' });

    expect(prisma.financialMovement.groupBy).toHaveBeenNthCalledWith(1, {
      by: ['type'],
      orderBy: { type: 'asc' },
      where: { occurredAt: { lt: new Date('2026-01-01T00:00:00.000Z') } },
      _sum: { amount: true },
    });
    expect(prisma.financialMovement.groupBy).toHaveBeenNthCalledWith(2, {
      by: ['type', 'source'],
      orderBy: [{ type: 'asc' }, { source: 'asc' }],
      where: {
        occurredAt: {
          gte: new Date('2026-01-01T00:00:00.000Z'),
          lt: new Date('2027-01-01T00:00:00.000Z'),
        },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });
    expect(result.data).toEqual(
      expect.objectContaining({
        openingBalance: '800.05',
        income: {
          total: '1200.90',
          count: 6,
          bySource: {
            MANUAL: { total: '300.20', count: 2 },
            RESERVATION_PAYMENT: { total: '400.30', count: 1 },
            DONATION: { total: '500.40', count: 3 },
          },
        },
        expenses: {
          total: '100.15',
          count: 1,
          bySource: { MANUAL: { total: '100.15', count: 1 } },
        },
        netMovement: '1100.75',
        closingBalance: '1900.80',
        movementCount: 7,
      }),
    );
    expect(result.data.fie.totalIncomePlusOpeningBalance).toBe('2000.95');
    expect(result.data.fie.totalExpensesPlusClosingBalance).toBe('2000.95');
    expect(
      decimal(result.data.openingBalance)
        .plus(result.data.income.total)
        .equals(
          decimal(result.data.expenses.total).plus(result.data.closingBalance),
        ),
    ).toBe(true);
  });

  const movement = (
    id: number,
    type = FinancialMovementType.INCOME,
    date = '2026-01-01T00:00:00.000Z',
  ) => ({
    id,
    type,
    description: `Movimiento ${id}`,
    amount: decimal('0.10'),
    occurredAt: new Date(date),
    source: FinancialMovementSource.MANUAL,
  });

  it('queries only annual detail in deterministic date/id order and separates income, expenses and donation once', async () => {
    const history = movement(
      90,
      FinancialMovementType.INCOME,
      '2025-12-31T23:59:59.999Z',
    );
    const nextYear = movement(
      91,
      FinancialMovementType.EXPENSE,
      '2027-01-01T00:00:00.000Z',
    );
    const donation = {
      ...movement(2),
      source: FinancialMovementSource.DONATION,
    };
    const rows = [
      nextYear,
      movement(3, FinancialMovementType.EXPENSE, '2026-12-31T23:59:59.999Z'),
      donation,
      history,
      movement(1),
    ];
    prisma.financialMovement.findMany.mockImplementation(
      async ({ where, orderBy, select }) => {
        expect(orderBy).toEqual([{ occurredAt: 'asc' }, { id: 'asc' }]);
        expect(where).toEqual({
          occurredAt: {
            gte: new Date('2026-01-01T00:00:00.000Z'),
            lt: new Date('2027-01-01T00:00:00.000Z'),
          },
        });
        expect(select).toEqual({
          id: true,
          type: true,
          description: true,
          amount: true,
          occurredAt: true,
          source: true,
        });
        return rows
          .filter(
            (row) =>
              row.occurredAt >= where.occurredAt.gte &&
              row.occurredAt < where.occurredAt.lt,
          )
          .sort(
            (a, b) =>
              a.occurredAt.getTime() - b.occurredAt.getTime() || a.id - b.id,
          );
      },
    );
    prisma.financialMovement.groupBy
      .mockResolvedValueOnce([
        { type: history.type, _sum: { amount: history.amount } },
      ])
      .mockResolvedValueOnce([
        {
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.MANUAL,
          _sum: { amount: decimal('0.10') },
          _count: { _all: 1 },
        },
        {
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.DONATION,
          _sum: { amount: decimal('0.10') },
          _count: { _all: 1 },
        },
        {
          type: FinancialMovementType.EXPENSE,
          source: FinancialMovementSource.MANUAL,
          _sum: { amount: decimal('0.10') },
          _count: { _all: 1 },
        },
      ]);
    const { data } = await service.annual(2026, {
      id: 7,
      fullName: 'Tesorería ficticia',
    });
    expect(data.fie.entries.map((row) => row.id)).toEqual([1, 2]);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
    expect(
      data.fie.entries
        .reduce((sum, row) => sum.plus(row.amount), decimal('0'))
        .toFixed(2),
    ).toBe(data.income.total);
    expect(
      data.fie.exits
        .reduce((sum, row) => sum.plus(row.amount), decimal('0'))
        .toFixed(2),
    ).toBe(data.expenses.total);
    expect(data.fie.exits).toEqual([
      {
        id: 3,
        description: 'Movimiento 3',
        amount: '0.10',
        occurredAt: '2026-12-31T23:59:59.999Z',
        source: 'MANUAL',
      },
    ]);
    expect(
      data.fie.entries.filter((row) => row.source === 'DONATION'),
    ).toHaveLength(1);
    expect(prisma.donation.findMany).not.toHaveBeenCalled();
    expect(prisma.donation.aggregate).not.toHaveBeenCalled();
    expect(data.openingBalance).toBe('0.10');
    expect(data.closingBalance).toBe('0.20');
    expect(data.fie.totalIncomePlusOpeningBalance).toBe('0.30');
    expect(data.fie.totalExpensesPlusClosingBalance).toBe('0.30');
  });

  it.each([
    [FinancialMovementType.INCOME, 15, false],
    [FinancialMovementType.INCOME, 16, true],
    [FinancialMovementType.EXPENSE, 15, false],
    [FinancialMovementType.EXPENSE, 16, true],
  ])(
    'preserves all %s lines at count %s with overflow %s',
    async (type, count, overflow) => {
      prisma.financialMovement.findMany.mockResolvedValue(
        Array.from({ length: count }, (_, index) => movement(index + 1, type)),
      );
      prisma.financialMovement.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            type,
            source: FinancialMovementSource.MANUAL,
            _sum: { amount: decimal('0.10').times(count) },
            _count: { _all: count },
          },
        ]);
      const { data } = await service.annual(2026, {
        id: 7,
        fullName: 'Tesorería ficticia',
      });
      const isIncome = type === FinancialMovementType.INCOME;
      expect(isIncome ? data.fie.entries : data.fie.exits).toHaveLength(count);
      expect(data.fie.capacity).toEqual({
        entryCount: isIncome ? count : 0,
        exitCount: isIncome ? 0 : count,
        entryCapacity: 15,
        exitCapacity: 15,
        entryOverflow: isIncome && overflow,
        exitOverflow: !isIncome && overflow,
      });
      expect(data.fie.totalIncomePlusOpeningBalance).toBe(
        data.fie.totalExpensesPlusClosingBalance,
      );
    },
  );

  it('retains opening history for an empty year without adding annual detail', async () => {
    prisma.financialMovement.groupBy
      .mockResolvedValueOnce([
        {
          type: FinancialMovementType.INCOME,
          _sum: { amount: decimal('999999999999.99') },
        },
        {
          type: FinancialMovementType.EXPENSE,
          _sum: { amount: decimal('0.10') },
        },
      ])
      .mockResolvedValueOnce([]);
    const { data } = await service.annual(2026, {
      id: 7,
      fullName: 'Tesorería ficticia',
    });
    expect(data.openingBalance).toBe('999999999999.89');
    expect(data.closingBalance).toBe(data.openingBalance);
    expect(data.fie.entries).toEqual([]);
    expect(data.fie.exits).toEqual([]);
    expect(data.fie.totalIncomePlusOpeningBalance).toBe(data.openingBalance);
    expect(data.fie.totalExpensesPlusClosingBalance).toBe(data.openingBalance);
  });
});
