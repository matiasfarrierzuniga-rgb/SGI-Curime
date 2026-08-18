import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryItemCondition,
  InventoryItemStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryItemsService } from './inventory-items.service';

const item = {
  id: 1,
  code: 'HER-001',
  name: 'Martillo',
  description: null,
  currentQuantity: 5,
  minimumQuantity: 2,
  unit: 'unidad',
  location: null,
  status: InventoryItemStatus.ACTIVE,
  condition: InventoryItemCondition.GOOD,
  categoryId: 1,
  category: { id: 1, name: 'Herramientas', isActive: true },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: '7.9.1',
  });
}

describe('InventoryItemsService', () => {
  const prisma = {
    inventoryItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      fields: { minimumQuantity: 'minimumQuantity' as const },
    },
    inventoryCategory: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: InventoryItemsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryItemsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((argument: unknown) => {
      if (Array.isArray(argument)) return Promise.all(argument);
      return (argument as (tx: typeof prisma) => unknown)(prisma);
    });
    prisma.inventoryItem.create.mockResolvedValue(item);
    prisma.inventoryItem.findMany.mockResolvedValue([item]);
    prisma.inventoryItem.count.mockResolvedValue(1);
    prisma.inventoryItem.findUnique.mockResolvedValue(item);
    prisma.inventoryItem.findFirst.mockResolvedValue(null);
    prisma.inventoryItem.update.mockResolvedValue(item);
    prisma.inventoryCategory.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
    });
  });

  it('creates an item with zero stock and a safe select', async () => {
    const result = await service.create({
      code: 'HER-001',
      name: 'Martillo',
      categoryId: 1,
      minimumQuantity: 2,
    });
    expect(prisma.inventoryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: 'HER-001',
          categoryId: 1,
          currentQuantity: 0,
          minimumQuantity: 2,
          status: InventoryItemStatus.ACTIVE,
        }),
      }),
    );
    expect(result).not.toHaveProperty('movements');
  });

  it('requires an active category', async () => {
    prisma.inventoryCategory.findUnique.mockResolvedValueOnce({
      id: 1,
      isActive: false,
    });
    await expect(
      service.create({ code: 'HER-002', name: 'Llave', categoryId: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.inventoryCategory.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create({ code: 'HER-002', name: 'Llave', categoryId: 99 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a duplicated item code', async () => {
    prisma.inventoryItem.create.mockRejectedValueOnce(uniqueConstraintError());
    await expect(
      service.create({ code: 'HER-001', name: 'Martillo', categoryId: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists with filters and pagination', async () => {
    const result = await service.findAll({
      search: 'mart',
      code: 'HER',
      categoryId: 1,
      status: InventoryItemStatus.ACTIVE,
      lowStock: true,
      page: 2,
      limit: 5,
    });
    const query = prisma.inventoryItem.findMany.mock.calls[0][0];
    expect(query.where).toEqual(
      expect.objectContaining({
        code: expect.objectContaining({ contains: 'HER' }),
        categoryId: 1,
        status: InventoryItemStatus.ACTIVE,
      }),
    );
    expect(query.where.AND[0].currentQuantity.lte).toBe('minimumQuantity');
    expect(result).toEqual(
      expect.objectContaining({ total: 1, page: 2, limit: 5 }),
    );
  });

  it('returns detail and reports an unknown item', async () => {
    const result = await service.findOne(1);
    expect(result.code).toBe('HER-001');

    prisma.inventoryItem.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates allowed fields and rejects an empty update', async () => {
    await service.update(1, { name: 'Martillo grande' });
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Martillo grande' } }),
    );

    await expect(service.update(1, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a duplicated code on update', async () => {
    prisma.inventoryItem.findFirst.mockResolvedValueOnce({ id: 2 });
    await expect(service.update(1, { code: 'HER-002' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('does not allow moving an item to an inactive category', async () => {
    prisma.inventoryCategory.findUnique.mockResolvedValueOnce({
      id: 2,
      isActive: false,
    });
    await expect(service.update(1, { categoryId: 2 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('activates and deactivates an item', async () => {
    prisma.inventoryItem.findUnique.mockResolvedValueOnce({
      id: 1,
      status: InventoryItemStatus.INACTIVE,
    });
    await service.setActive(1, true);
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: InventoryItemStatus.ACTIVE } }),
    );

    prisma.inventoryItem.findUnique.mockResolvedValueOnce({
      id: 1,
      status: InventoryItemStatus.ACTIVE,
    });
    await service.setActive(1, false);
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: InventoryItemStatus.INACTIVE },
      }),
    );
  });

  it('does not re-apply the same state', async () => {
    prisma.inventoryItem.findUnique.mockResolvedValueOnce({
      id: 1,
      status: InventoryItemStatus.ACTIVE,
    });
    await expect(service.setActive(1, true)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
  });
});
