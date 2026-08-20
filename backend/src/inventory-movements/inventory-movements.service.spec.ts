import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  InventoryItemStatus,
  InventoryMovementType,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryMovementsService } from './inventory-movements.service';

const activeItem = {
  id: 1,
  status: InventoryItemStatus.ACTIVE,
  currentQuantity: 5,
};
const movement = {
  id: 10,
  type: InventoryMovementType.ENTRY,
  quantity: 3,
  reason: 'Compra',
  reference: null,
  notes: null,
  itemId: 1,
  createdAt: new Date(),
  item: { id: 1, code: 'HER-001', name: 'Martillo', unit: 'unidad' },
  createdBy: { id: 2, fullName: 'Operador', email: 'op@example.com' },
};

describe('InventoryMovementsService', () => {
  const prisma = {
    inventoryItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    inventoryMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: InventoryMovementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryMovementsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((argument: unknown) => {
      if (Array.isArray(argument)) return Promise.all(argument);
      return (argument as (tx: typeof prisma) => unknown)(prisma);
    });
    prisma.inventoryItem.findUnique.mockResolvedValue(activeItem);
    prisma.inventoryItem.update.mockResolvedValue({ id: 1 });
    prisma.inventoryItem.updateMany.mockResolvedValue({ count: 1 });
    prisma.inventoryMovement.create.mockResolvedValue(movement);
    prisma.inventoryMovement.findMany.mockResolvedValue([movement]);
    prisma.inventoryMovement.count.mockResolvedValue(1);
  });

  it('records an entry, increments stock and creates an ENTRY movement', async () => {
    const result = await service.recordEntry(1, {
      quantity: 3,
      reason: 'Compra',
    });
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { currentQuantity: { increment: 3 } },
      }),
    );
    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: InventoryMovementType.ENTRY,
          quantity: 3,
          reason: 'Compra',
          createdById: undefined,
        }),
      }),
    );
    expect(result.id).toBe(10);
  });

  it('records an exit, decrements stock and creates an EXIT movement', async () => {
    await service.recordExit(1, { quantity: 2, reason: 'Uso interno' });
    expect(prisma.inventoryItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, currentQuantity: { gte: 2 } },
        data: { currentQuantity: { decrement: 2 } },
      }),
    );
    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: InventoryMovementType.EXIT,
          quantity: 2,
        }),
      }),
    );
  });

  it('rejects an exit without enough stock', async () => {
    prisma.inventoryItem.findUnique.mockResolvedValueOnce({
      ...activeItem,
      currentQuantity: 2,
    });
    await expect(
      service.recordExit(1, { quantity: 5, reason: 'Uso interno' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.inventoryItem.updateMany).not.toHaveBeenCalled();
  });

  it('protects against concurrent exits depleting stock', async () => {
    prisma.inventoryItem.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.recordExit(1, { quantity: 3, reason: 'Uso interno' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('rejects an exit for an inactive or unknown item', async () => {
    prisma.inventoryItem.findUnique.mockResolvedValueOnce({
      id: 1,
      status: InventoryItemStatus.INACTIVE,
    });
    await expect(
      service.recordExit(1, { quantity: 1, reason: 'Uso interno' }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.inventoryItem.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.recordExit(99, { quantity: 1, reason: 'Uso interno' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records an adjustment with a delta quantity', async () => {
    await service.recordAdjustment(1, {
      newQuantity: 8,
      reason: 'Conteo físico',
    });
    expect(prisma.inventoryItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, currentQuantity: { equals: 5 } },
        data: { currentQuantity: 8 },
      }),
    );
    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: InventoryMovementType.ADJUSTMENT,
          quantity: 3,
          reason: 'Conteo físico',
        }),
      }),
    );
  });

  it('rejects an adjustment that raced with another movement', async () => {
    prisma.inventoryItem.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.recordAdjustment(1, { newQuantity: 8, reason: 'Conteo físico' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
  });

  it('lists movements with filters and pagination', async () => {
    const result = await service.findAll({
      itemId: 1,
      type: InventoryMovementType.ENTRY,
      page: 2,
      limit: 5,
    });
    const query = prisma.inventoryMovement.findMany.mock.calls[0][0];
    expect(query.where).toEqual(
      expect.objectContaining({ itemId: 1, type: InventoryMovementType.ENTRY }),
    );
    expect(query.orderBy).toEqual({ createdAt: 'desc' });
    expect(result).toEqual(
      expect.objectContaining({ total: 1, page: 2, limit: 5 }),
    );
    expect(result.data[0]).not.toHaveProperty('passwordHash');
  });

  it('lists movements of an item only when the item exists', async () => {
    const result = await service.findItemMovements(1, { page: 1, limit: 20 });
    expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ itemId: 1 }),
      }),
    );
    expect(result.data[0].item.code).toBe('HER-001');

    prisma.inventoryItem.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.findItemMovements(99, { page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
