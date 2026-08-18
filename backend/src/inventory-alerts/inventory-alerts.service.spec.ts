import {
  InventoryItemCondition,
  InventoryItemStatus,
  InventoryLoanStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryAlertsService } from './inventory-alerts.service';

const item = {
  id: 1,
  code: 'HER-001',
  name: 'Martillo',
  currentQuantity: 1,
  minimumQuantity: 2,
  unit: 'unidad',
  location: null,
  status: InventoryItemStatus.ACTIVE,
  condition: InventoryItemCondition.GOOD,
};

const loan = {
  id: 5,
  quantity: 1,
  borrowerName: 'Vecino',
  loanDate: new Date('2026-01-01'),
  expectedReturnDate: new Date('2020-01-01'),
  item: { id: 1, code: 'HER-001', name: 'Martillo', unit: 'unidad' },
  affiliate: { id: 3, fullName: 'Afiliado' },
};

describe('InventoryAlertsService', () => {
  const prisma = {
    inventoryItem: {
      findMany: jest.fn(),
      fields: { minimumQuantity: 'minimumQuantity' as const },
    },
    inventoryLoan: { findMany: jest.fn() },
  };
  let service: InventoryAlertsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryAlertsService(prisma as unknown as PrismaService);
    prisma.inventoryItem.findMany.mockResolvedValue([item]);
    prisma.inventoryLoan.findMany.mockResolvedValue([loan]);
  });

  it('derives low stock using the minimum quantity field', async () => {
    await service.findAll();
    const lowStockQuery = prisma.inventoryItem.findMany.mock.calls[0][0];
    expect(lowStockQuery.where).toEqual(
      expect.objectContaining({ status: InventoryItemStatus.ACTIVE }),
    );
    expect(lowStockQuery.where.currentQuantity).toEqual(
      expect.objectContaining({ gt: 0 }),
    );
    expect(lowStockQuery.where.currentQuantity.lte).toBeDefined();
  });

  it('reports low stock and out of stock alerts', async () => {
    const result = await service.findAll();
    expect(result.lowStock).toHaveLength(1);
    expect(result.outOfStock).toHaveLength(1);
    expect(result.summary.lowStock).toBe(1);
    expect(result.summary.outOfStock).toBe(1);
  });

  it('reports overdue loans as active and past due', async () => {
    await service.findAll();
    const overdueQuery = prisma.inventoryLoan.findMany.mock.calls[0][0];
    expect(overdueQuery.where).toEqual(
      expect.objectContaining({
        status: InventoryLoanStatus.ACTIVE,
        expectedReturnDate: expect.objectContaining({ lt: expect.any(Date) }),
      }),
    );
  });

  it('reports inactive and damaged items when present', async () => {
    const result = await service.findAll();
    expect(result.inactiveItems).toHaveLength(1);
    expect(result.damagedItems).toHaveLength(1);
    expect(result.summary.overdueLoans).toBe(1);
  });
});
