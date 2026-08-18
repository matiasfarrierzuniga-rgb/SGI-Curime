import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryItemCondition,
  InventoryItemStatus,
  InventoryLoanStatus,
  InventoryMovementType,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryLoansService } from './inventory-loans.service';

const future = new Date('2099-01-01');
const past = new Date('2020-01-01');

const loan = {
  id: 5,
  quantity: 2,
  borrowerName: 'Vecino Prestatario',
  borrowerAffiliateId: null,
  loanDate: new Date(),
  expectedReturnDate: future,
  returnedAt: null,
  status: InventoryLoanStatus.ACTIVE,
  notes: null,
  itemId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  item: {
    id: 1,
    code: 'HER-001',
    name: 'Martillo',
    unit: 'unidad',
    category: { id: 1, name: 'Herramientas' },
  },
  affiliate: null,
  createdBy: { id: 2, fullName: 'Operador', email: 'op@example.com' },
  receivedBy: null,
};

describe('InventoryLoansService', () => {
  const prisma = {
    inventoryLoan: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryItem: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    affiliate: { findUnique: jest.fn() },
    inventoryMovement: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: InventoryLoansService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryLoansService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((argument: unknown) => {
      if (Array.isArray(argument)) return Promise.all(argument);
      return (argument as (tx: typeof prisma) => unknown)(prisma);
    });
    prisma.inventoryItem.findUnique.mockResolvedValue({
      id: 1,
      status: InventoryItemStatus.ACTIVE,
      currentQuantity: 10,
    });
    prisma.inventoryLoan.create.mockResolvedValue(loan);
    prisma.inventoryItem.updateMany.mockResolvedValue({ count: 1 });
    prisma.inventoryItem.update.mockResolvedValue({ id: 1 });
    prisma.inventoryMovement.create.mockResolvedValue({ id: 1 });
    prisma.inventoryLoan.findMany.mockResolvedValue([loan]);
    prisma.inventoryLoan.count.mockResolvedValue(1);
    prisma.inventoryLoan.findUnique.mockResolvedValue(loan);
    prisma.inventoryLoan.update.mockResolvedValue({
      ...loan,
      status: InventoryLoanStatus.RETURNED,
      returnedAt: new Date(),
    });
  });

  it('creates a loan, reserves stock and records an EXIT movement', async () => {
    const result = await service.create({
      itemId: 1,
      quantity: 2,
      borrowerName: 'Vecino Prestatario',
      expectedReturnDate: future.toISOString(),
    });
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
          reference: 'LOAN-5',
        }),
      }),
    );
    expect(result.id).toBe(5);
    expect(result.isOverdue).toBe(false);
  });

  it('rejects a loan without enough stock', async () => {
    prisma.inventoryItem.findUnique.mockResolvedValueOnce({
      id: 1,
      status: InventoryItemStatus.ACTIVE,
      currentQuantity: 1,
    });
    await expect(
      service.create({
        itemId: 1,
        quantity: 2,
        borrowerName: 'Vecino',
        expectedReturnDate: future.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.inventoryLoan.create).not.toHaveBeenCalled();
  });

  it('rejects a loan for an inactive or unknown item', async () => {
    prisma.inventoryItem.findUnique.mockResolvedValueOnce({
      id: 1,
      status: InventoryItemStatus.INACTIVE,
      currentQuantity: 10,
    });
    await expect(
      service.create({
        itemId: 1,
        quantity: 1,
        borrowerName: 'Vecino',
        expectedReturnDate: future.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.inventoryItem.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create({
        itemId: 99,
        quantity: 1,
        borrowerName: 'Vecino',
        expectedReturnDate: future.toISOString(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a loan with a return date before the loan date', async () => {
    await expect(
      service.create({
        itemId: 1,
        quantity: 1,
        borrowerName: 'Vecino',
        loanDate: future.toISOString(),
        expectedReturnDate: past.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.inventoryLoan.create).not.toHaveBeenCalled();
  });

  it('rejects a loan for an unknown affiliate', async () => {
    prisma.affiliate.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create({
        itemId: 1,
        quantity: 1,
        borrowerName: 'Vecino',
        borrowerAffiliateId: 9,
        expectedReturnDate: future.toISOString(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists loans with filters, pagination and derived overdue', async () => {
    const result = await service.findAll({
      itemId: 1,
      overdue: true,
      page: 2,
      limit: 5,
    });
    const query = prisma.inventoryLoan.findMany.mock.calls[0][0];
    expect(query.where).toEqual(
      expect.objectContaining({
        itemId: 1,
        status: InventoryLoanStatus.ACTIVE,
        expectedReturnDate: expect.objectContaining({ lt: expect.any(Date) }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ total: 1, page: 2, limit: 5 }),
    );
    expect(result.data[0]).toHaveProperty('isOverdue');
  });

  it('returns a loan detail without sensitive fields', async () => {
    const result = await service.findOne(5);
    expect(result.id).toBe(5);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('returns a loan and restores stock with an ENTRY movement', async () => {
    const result = await service.return(5, {});
    expect(prisma.inventoryLoan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        data: expect.objectContaining({
          status: InventoryLoanStatus.RETURNED,
          returnedAt: expect.any(Date),
        }),
      }),
    );
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { currentQuantity: { increment: 2 } },
      }),
    );
    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: InventoryMovementType.ENTRY,
          reference: 'LOAN-5',
        }),
      }),
    );
    expect(result.status).toBe(InventoryLoanStatus.RETURNED);
  });

  it('applies a return condition and notes when provided', async () => {
    await service.return(5, {
      condition: InventoryItemCondition.DAMAGED,
      returnNotes: 'Llegó dañado',
    });
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { condition: InventoryItemCondition.DAMAGED },
      }),
    );
  });

  it('does not allow returning a loan twice', async () => {
    prisma.inventoryLoan.findUnique.mockResolvedValueOnce({
      id: 5,
      status: InventoryLoanStatus.RETURNED,
      itemId: 1,
      quantity: 2,
      notes: null,
    });
    await expect(service.return(5, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
  });

  it('cancels an active loan, restores stock and records an ENTRY movement', async () => {
    prisma.inventoryLoan.update.mockResolvedValue({
      ...loan,
      status: InventoryLoanStatus.CANCELLED,
    });
    const result = await service.cancel(5, 2);
    expect(prisma.inventoryLoan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        data: expect.objectContaining({
          status: InventoryLoanStatus.CANCELLED,
          receivedById: 2,
        }),
      }),
    );
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { currentQuantity: { increment: 2 } },
      }),
    );
    expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: InventoryMovementType.ENTRY,
          quantity: 2,
          reference: 'LOAN-5',
        }),
      }),
    );
    expect(result.status).toBe(InventoryLoanStatus.CANCELLED);
  });

  it('does not cancel a loan already returned', async () => {
    prisma.inventoryLoan.findUnique.mockResolvedValueOnce({
      id: 5,
      status: InventoryLoanStatus.RETURNED,
      itemId: 1,
      quantity: 2,
      notes: null,
    });
    await expect(service.cancel(5, 2)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
  });

  it('does not allow cancelling a loan twice', async () => {
    prisma.inventoryLoan.findUnique.mockResolvedValueOnce({
      id: 5,
      status: InventoryLoanStatus.CANCELLED,
      itemId: 1,
      quantity: 2,
      notes: null,
    });
    await expect(service.cancel(5, 2)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.inventoryItem.update).not.toHaveBeenCalled();
  });

  it('rejects cancelling an unknown loan', async () => {
    prisma.inventoryLoan.findUnique.mockResolvedValueOnce(null);
    await expect(service.cancel(99, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects returning an unknown loan', async () => {
    prisma.inventoryLoan.findUnique.mockResolvedValueOnce(null);
    await expect(service.return(99, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('marks an overdue loan as overdue when deriving', async () => {
    prisma.inventoryLoan.findUnique.mockResolvedValueOnce({
      ...loan,
      expectedReturnDate: past,
    });
    const result = await service.findOne(5);
    expect(result.isOverdue).toBe(true);
  });
});
