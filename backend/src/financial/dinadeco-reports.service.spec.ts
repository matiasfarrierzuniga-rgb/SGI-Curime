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
    financialMovement: { groupBy: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: DinadecoReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DinadecoReportsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
  });

  it('returns zero balances and complete metadata for an empty report', async () => {
    prisma.financialMovement.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const result = await service.annual(2026, { id: 7, fullName: 'Persona Tesorera' });

    expect(result.data).toEqual({
      year: 2026,
      currency: 'CRC',
      openingBalance: '0.00',
      income: { total: '0.00', count: 0, bySource: {} },
      expenses: { total: '0.00', count: 0, bySource: {} },
      netMovement: '0.00',
      closingBalance: '0.00',
      movementCount: 0,
    });
    expect(result.metadata).toEqual(expect.objectContaining({
      generatedAt: expect.any(Date),
      generatedBy: { id: 7, fullName: 'Persona Tesorera' },
      period: { from: new Date('2026-01-01T00:00:00.000Z'), to: new Date('2027-01-01T00:00:00.000Z') },
      appliedFilters: { year: 2026 },
      dataSource: 'FINANCIAL_MOVEMENT',
      reportVersion: '1.0',
    }));
  });

  it('separates opening history, annual movement, sources, and closing formula', async () => {
    prisma.financialMovement.groupBy
      .mockResolvedValueOnce([
        { type: FinancialMovementType.INCOME, _sum: { amount: decimal('1000.10') } },
        { type: FinancialMovementType.EXPENSE, _sum: { amount: decimal('200.05') } },
      ])
      .mockResolvedValueOnce([
        { type: FinancialMovementType.INCOME, source: FinancialMovementSource.MANUAL, _sum: { amount: decimal('300.20') }, _count: { _all: 2 } },
        { type: FinancialMovementType.INCOME, source: FinancialMovementSource.RESERVATION_PAYMENT, _sum: { amount: decimal('400.30') }, _count: { _all: 1 } },
        { type: FinancialMovementType.INCOME, source: FinancialMovementSource.DONATION, _sum: { amount: decimal('500.40') }, _count: { _all: 3 } },
        { type: FinancialMovementType.EXPENSE, source: FinancialMovementSource.MANUAL, _sum: { amount: decimal('100.15') }, _count: { _all: 1 } },
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
      where: { occurredAt: { gte: new Date('2026-01-01T00:00:00.000Z'), lt: new Date('2027-01-01T00:00:00.000Z') } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    expect(result.data).toEqual(expect.objectContaining({
      openingBalance: '800.05',
      income: {
        total: '1200.90', count: 6,
        bySource: {
          MANUAL: { total: '300.20', count: 2 },
          RESERVATION_PAYMENT: { total: '400.30', count: 1 },
          DONATION: { total: '500.40', count: 3 },
        },
      },
      expenses: { total: '100.15', count: 1, bySource: { MANUAL: { total: '100.15', count: 1 } } },
      netMovement: '1100.75',
      closingBalance: '1900.80',
      movementCount: 7,
    }));
  });
});
