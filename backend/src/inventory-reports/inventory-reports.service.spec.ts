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
    const result = await service.summary();
    expect(result).toEqual(
      expect.objectContaining({
        totalItems: 10,
        activeItems: 8,
        inactiveItems: 2,
        totalCategories: 3,
        lowStockCount: 1,
        outOfStockCount: 1,
        activeLoans: 2,
        overdueLoans: 2,
      }),
    );
  });

  it('uses the minimum quantity field for the low stock count', async () => {
    await service.summary();
    const lowStockCall = prisma.inventoryItem.count.mock.calls.find(
      (call) => call[0]?.where?.currentQuantity,
    );
    expect(lowStockCall?.[0].where.currentQuantity.lte).toBeDefined();
  });

  it('reports stock with category info and pagination', async () => {
    const result = await service.stock({ categoryId: 1, page: 2, limit: 5 });
    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: 1 }),
        skip: 5,
        take: 5,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ total: 5, page: 2, limit: 5 }),
    );
    expect(result.data[0].category.name).toBe('Herramientas');
  });

  it('reports movement totals grouped by type', async () => {
    const result = await service.movements({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      page: 1,
      limit: 20,
    });
    expect(prisma.inventoryMovement.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['type'],
        where: expect.objectContaining({
          createdAt: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-12-31'),
          },
        }),
      }),
    );
    expect(result.summary.entries).toEqual({ count: 4, quantity: 20 });
    expect(result.summary.exits).toEqual({ count: 3, quantity: 9 });
    expect(result.summary.adjustments).toEqual({ count: 0, quantity: 0 });
    expect(result.period.dateFrom).toBe('2026-01-01');
  });

  it('reports loan aggregates with overdue and period filters', async () => {
    const result = await service.loans({
      dateFrom: '2026-01-01',
      page: 1,
      limit: 20,
    });
    expect(prisma.inventoryLoan.count).toHaveBeenCalledTimes(5);
    expect(result.summary).toEqual(
      expect.objectContaining({
        active: 2,
        returned: 2,
        cancelled: 2,
        overdue: 2,
        total: 2,
      }),
    );
  });
});
