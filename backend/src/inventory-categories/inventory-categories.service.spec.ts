import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryCategoriesService } from './inventory-categories.service';

const category = {
  id: 1,
  name: 'Herramientas',
  description: null,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: '7.9.1',
  });
}

describe('InventoryCategoriesService', () => {
  const prisma = {
    inventoryCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: InventoryCategoriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryCategoriesService(
      prisma as unknown as PrismaService,
    );
    prisma.$transaction.mockImplementation((argument: unknown) => {
      if (Array.isArray(argument)) return Promise.all(argument);
      return (argument as (tx: typeof prisma) => unknown)(prisma);
    });
    prisma.inventoryCategory.create.mockResolvedValue(category);
    prisma.inventoryCategory.findMany.mockResolvedValue([category]);
    prisma.inventoryCategory.count.mockResolvedValue(1);
    prisma.inventoryCategory.findUnique.mockResolvedValue(category);
    prisma.inventoryCategory.findFirst.mockResolvedValue(null);
    prisma.inventoryCategory.update.mockResolvedValue(category);
  });

  it('creates a category and returns a safe select', async () => {
    const result = await service.create({ name: 'Herramientas' });
    expect(prisma.inventoryCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Herramientas', description: null },
      }),
    );
    expect(result.name).toBe('Herramientas');
  });

  it('rejects a duplicated category name', async () => {
    prisma.inventoryCategory.create.mockRejectedValueOnce(
      uniqueConstraintError(),
    );
    await expect(
      service.create({ name: 'Herramientas' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists with search, active filter and pagination', async () => {
    const result = await service.findAll({
      search: 'herra',
      active: true,
      page: 2,
      limit: 10,
    });
    expect(prisma.inventoryCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    const query = prisma.inventoryCategory.findMany.mock.calls[0][0];
    expect(query.where).toEqual(expect.objectContaining({ isActive: true }));
    expect(query.where.name).toEqual(
      expect.objectContaining({ contains: 'herra', mode: 'insensitive' }),
    );
    expect(result).toEqual(
      expect.objectContaining({ total: 1, page: 2, limit: 10 }),
    );
  });

  it('returns detail and reports an unknown category', async () => {
    const result = await service.findOne(1);
    expect(result.id).toBe(1);

    prisma.inventoryCategory.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates allowed fields and rejects an empty update', async () => {
    await service.update(1, { name: 'Ferretería' });
    expect(prisma.inventoryCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Ferretería' } }),
    );

    await expect(service.update(1, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a duplicated name on update', async () => {
    prisma.inventoryCategory.findFirst.mockResolvedValueOnce({ id: 2 });
    await expect(
      service.update(1, { name: 'Herramientas' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('activates and deactivates a category', async () => {
    prisma.inventoryCategory.findUnique.mockResolvedValue({
      id: 1,
      isActive: false,
    });
    await service.setActive(1, true);
    expect(prisma.inventoryCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: true } }),
    );

    prisma.inventoryCategory.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
    });
    await service.setActive(1, false);
    expect(prisma.inventoryCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it('does not re-apply the same state', async () => {
    prisma.inventoryCategory.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
    });
    await expect(service.setActive(1, true)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.inventoryCategory.update).not.toHaveBeenCalled();
  });
});
