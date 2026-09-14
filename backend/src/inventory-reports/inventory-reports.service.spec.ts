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
      { type: InventoryMovementType.ENTRY, _count: 4, _sum: { quantity: 20 } },
      { type: InventoryMovementType.EXIT, _count: 3, _sum: { quantity: 9 } },
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

  it('reports movement totals grouped by type', async () => {
    const result = await service.movements({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
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
            gte: new Date('2026-01-01'),
            lte: new Date('2026-12-31'),
          },
        }),
      }),
    );
    expect(result.data.summary.entries).toEqual({ count: 4, quantity: 20 });
    expect(result.data.summary.exits).toEqual({ count: 3, quantity: 9 });
    expect(result.data.summary.adjustments).toEqual({ count: 0, quantity: 0 });
    expect(result.data.period).toEqual({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });
    expect(result.metadata).toEqual(
      expect.objectContaining({
        period: {
          from: new Date('2026-01-01'),
          to: new Date('2026-12-31'),
        },
        appliedFilters: {
          categoryId: 1,
          type: InventoryMovementType.ENTRY,
          dateFrom: new Date('2026-01-01'),
          dateTo: new Date('2026-12-31'),
        },
        dataSource: 'INVENTORY_MOVEMENT',
        reportVersion: '1.0',
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
});
