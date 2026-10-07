import {
  InventoryItemCondition,
  InventoryItemStatus,
  InventoryMovementType,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryReportsService } from './inventory-reports.service';

const item = {
  id: 1,
  code: 'HER-001',
  name: 'Martillo',
  currentQuantity: 5,
  minimumQuantity: 2,
  unit: 'unidad',
  location: null,
  status: InventoryItemStatus.ACTIVE,
  condition: InventoryItemCondition.GOOD,
  categoryId: 1,
  category: { id: 1, name: 'Herramientas' },
};

describe('InventoryReportsService', () => {
  const prisma = {
    inventoryItem: {
      count: jest.fn(),
      findMany: jest.fn(),
      fields: { minimumQuantity: 'minimumQuantity' as const },
    },
    inventoryCategory: { count: jest.fn() },
    inventoryLoan: { count: jest.fn() },
    inventoryMovement: { groupBy: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: InventoryReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryReportsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((argument: unknown) =>
      Promise.all(argument as unknown[]),
    );
    prisma.inventoryItem.count.mockResolvedValue(5);
    prisma.inventoryItem.findMany.mockResolvedValue([item]);
    prisma.inventoryCategory.count.mockResolvedValue(3);
    prisma.inventoryLoan.count.mockResolvedValue(2);
    prisma.inventoryMovement.groupBy.mockResolvedValue([
      {
        type: InventoryMovementType.OPENING_BALANCE,
        _count: { _all: 1 },
        _sum: { legacyQuantity: 8 },
      },
      {
        type: InventoryMovementType.ENTRY,
        _count: { _all: 4 },
        _sum: { legacyQuantity: 20 },
      },
      {
        type: InventoryMovementType.EXIT,
        _count: { _all: 3 },
        _sum: { legacyQuantity: 9 },
      },
    ]);
  });

  it('builds a summary from real counts', async () => {
    prisma.inventoryItem.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    const generatedBy = { id: 12, fullName: 'Persona Gestora' };
    const result = await service.summary(generatedBy);
    expect(result.data).toEqual({
      totalItems: 10,
      activeItems: 8,
      inactiveItems: 2,
      totalCategories: 3,
      lowStockCount: 1,
      outOfStockCount: 1,
      activeLoans: 2,
      overdueLoans: 2,
    });
    expect(result.metadata).toEqual(
      expect.objectContaining({
        generatedBy,
        period: { from: null, to: null },
        appliedFilters: {},
        dataSource: [
          'INVENTORY_ITEM',
          'INVENTORY_CATEGORY',
          'INVENTORY_LOAN',
        ],
        reportVersion: '1.0',
      }),
    );
    expect(result.metadata.generatedAt).toBeInstanceOf(Date);
  });

  it('returns zero inventory counts for an empty inventory', async () => {
    prisma.inventoryItem.count.mockResolvedValue(0);
    prisma.inventoryCategory.count.mockResolvedValue(0);
    prisma.inventoryLoan.count.mockResolvedValue(0);

    const result = await service.summary();

    expect(result.data).toEqual({
      totalItems: 0,
      activeItems: 0,
      inactiveItems: 0,
      totalCategories: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      activeLoans: 0,
      overdueLoans: 0,
    });
  });

  it('uses the minimum quantity field for the low stock count', async () => {
    await service.summary();
    const lowStockCall = prisma.inventoryItem.count.mock.calls.find(
      (call) => call[0]?.where?.currentQuantity,
    );
    expect(lowStockCall?.[0].where.currentQuantity.lte).toBeDefined();
  });

  it('reports stock with category info and pagination', async () => {
    const result = await service.stock({
      categoryId: 1,
      status: InventoryItemStatus.ACTIVE,
      page: 2,
      limit: 5,
    });
    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: 1,
          status: InventoryItemStatus.ACTIVE,
        }),
        skip: 5,
        take: 5,
      }),
    );
    expect(result.data).toEqual({ data: [item], total: 5, page: 2, limit: 5 });
    expect(result.data.data[0].category.name).toBe('Herramientas');
    expect(result.metadata).toEqual(
      expect.objectContaining({
        appliedFilters: {
          categoryId: 1,
          status: InventoryItemStatus.ACTIVE,
          page: 2,
          limit: 5,
        },
        dataSource: 'INVENTORY_ITEM',
        period: { from: null, to: null },
        reportVersion: '1.0',
      }),
    );
  });

  it('preserves the paginated stock contract for a filtered page without matches', async () => {
    prisma.inventoryItem.findMany.mockResolvedValueOnce([]);
    prisma.inventoryItem.count.mockResolvedValueOnce(0);

    const result = await service.stock({
      categoryId: 9,
      status: InventoryItemStatus.INACTIVE,
      page: 3,
      limit: 5,
    });

    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: 9,
          status: InventoryItemStatus.INACTIVE,
        },
        skip: 10,
        take: 5,
      }),
    );
    expect(prisma.inventoryItem.count).toHaveBeenCalledWith({
      where: {
        categoryId: 9,
        status: InventoryItemStatus.INACTIVE,
      },
    });
    expect(result.data).toEqual({ data: [], total: 0, page: 3, limit: 5 });
    expect(result.metadata.appliedFilters).toEqual({
      categoryId: 9,
      status: InventoryItemStatus.INACTIVE,
      page: 3,
      limit: 5,
    });
  });

  it('reports movement totals grouped by type', async () => {
    const result = await service.movements({
      dateFrom: '2026-12-31T00:00:00.000Z',
      dateTo: '2026-12-31T23:59:59.999Z',
      categoryId: 1,
      type: InventoryMovementType.ENTRY,
      page: 1,
      limit: 20,
    });
    expect(prisma.inventoryMovement.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['type'],
        where: expect.objectContaining({
          type: InventoryMovementType.ENTRY,
          item: { categoryId: 1 },
          createdAt: {
            gte: new Date('2026-12-31T00:00:00.000Z'),
            lte: new Date('2026-12-31T23:59:59.999Z'),
          },
        }),
      }),
    );
    expect(result.data.summary.openingBalances).toEqual({
      count: 1,
      quantity: 8,
    });
    expect(result.data.summary.entries).toEqual({ count: 4, quantity: 20 });
    expect(result.data.summary.exits).toEqual({ count: 3, quantity: 9 });
    expect(result.data.summary.adjustments).toEqual({ count: 0, quantity: 0 });
    expect(result.data.period).toEqual({
      dateFrom: '2026-12-31T00:00:00.000Z',
      dateTo: '2026-12-31T23:59:59.999Z',
    });
    expect(result.metadata).toEqual(
      expect.objectContaining({
        period: {
          from: new Date('2026-12-31T00:00:00.000Z'),
          to: new Date('2026-12-31T23:59:59.999Z'),
        },
        appliedFilters: {
          categoryId: 1,
          type: InventoryMovementType.ENTRY,
          dateFrom: new Date('2026-12-31T00:00:00.000Z'),
          dateTo: new Date('2026-12-31T23:59:59.999Z'),
        },
        dataSource: 'INVENTORY_MOVEMENT',
        reportVersion: '1.0',
      }),
    );
  });

  it('returns zeroed movement totals when there are no matching movements', async () => {
    prisma.inventoryMovement.groupBy.mockResolvedValueOnce([]);

    const result = await service.movements({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      page: 1,
      limit: 20,
    });

    expect(result.data.summary).toEqual({
      openingBalances: { count: 0, quantity: 0 },
      entries: { count: 0, quantity: 0 },
      exits: { count: 0, quantity: 0 },
      adjustments: { count: 0, quantity: 0 },
    });
    expect(prisma.inventoryMovement.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-01-31'),
          },
        }),
      }),
    );
  });

  it('reports loan aggregates with overdue and period filters', async () => {
    const result = await service.loans({
      dateFrom: '2026-01-01',
      categoryId: 1,
      page: 1,
      limit: 20,
    });
    expect(prisma.inventoryLoan.count).toHaveBeenCalledTimes(5);
    expect(result.data.summary).toEqual(
      expect.objectContaining({
        active: 2,
        returned: 2,
        cancelled: 2,
        overdue: 2,
        total: 2,
      }),
    );
    expect(result.data.period).toEqual({
      dateFrom: '2026-01-01',
      dateTo: null,
    });
    expect(result.metadata).toEqual(
      expect.objectContaining({
        period: { from: new Date('2026-01-01'), to: null },
        appliedFilters: {
          categoryId: 1,
          dateFrom: new Date('2026-01-01'),
        },
        dataSource: 'INVENTORY_LOAN',
        reportVersion: '1.0',
      }),
    );
  });

  it('returns a complete zeroed loan summary for an empty filtered period', async () => {
    const dateFrom = '2026-12-31T00:00:00.000Z';
    const dateTo = '2026-12-31T23:59:59.999Z';
    prisma.inventoryLoan.count.mockResolvedValue(0);

    const result = await service.loans({
      dateFrom,
      dateTo,
      categoryId: 9,
      page: 1,
      limit: 20,
    });

    expect(prisma.inventoryLoan.count).toHaveBeenCalledTimes(5);
    expect(prisma.inventoryLoan.count).toHaveBeenNthCalledWith(1, {
      where: {
        item: { categoryId: 9 },
        loanDate: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        status: 'ACTIVE',
      },
    });
    expect(prisma.inventoryLoan.count).toHaveBeenNthCalledWith(2, {
      where: {
        item: { categoryId: 9 },
        loanDate: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        status: 'RETURNED',
      },
    });
    expect(prisma.inventoryLoan.count).toHaveBeenNthCalledWith(3, {
      where: {
        item: { categoryId: 9 },
        loanDate: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        status: 'CANCELLED',
      },
    });
    expect(prisma.inventoryLoan.count).toHaveBeenNthCalledWith(4, {
      where: {
        item: { categoryId: 9 },
        loanDate: { gte: new Date(dateFrom), lte: new Date(dateTo) },
        status: 'ACTIVE',
        expectedReturnDate: { lt: expect.any(Date) },
      },
    });
    expect(prisma.inventoryLoan.count).toHaveBeenNthCalledWith(5, {
      where: {
        item: { categoryId: 9 },
        loanDate: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
    });
    expect(result.data).toEqual({
      period: { dateFrom, dateTo },
      summary: { active: 0, returned: 0, cancelled: 0, overdue: 0, total: 0 },
    });
    expect(result.metadata.appliedFilters).toEqual({
      categoryId: 9,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });
  });
});
