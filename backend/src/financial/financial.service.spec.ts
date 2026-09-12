import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  FinancialChargeStatus,
  FinancialMovementSource,
  FinancialMovementType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialService } from './financial.service';

const now = new Date('2030-01-01T10:00:00.000Z');

function charge(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    reservationId: 10,
    amount: new Prisma.Decimal('2500.00'),
    currency: 'CRC',
    status: FinancialChargeStatus.PENDING,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    chargeId: 1,
    amount: new Prisma.Decimal('2500.00'),
    status: PaymentStatus.CONFIRMED,
    method: PaymentMethod.CASH,
    reference: null,
    paidAt: now,
    recordedById: 7,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function movement(overrides: Record<string, unknown> = {}) {
  return {
    id: 2,
    type: FinancialMovementType.INCOME,
    source: FinancialMovementSource.RESERVATION_PAYMENT,
    amount: new Prisma.Decimal('2500.00'),
    currency: 'CRC',
    description: 'Pago de reserva #10',
    reference: null,
    occurredAt: now,
    sourceId: 1,
    recordedById: 7,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('FinancialService', () => {
  const prisma = {
    financialCharge: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    financialMovement: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: FinancialService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FinancialService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation(
      (workOrOperations: unknown) => {
        if (Array.isArray(workOrOperations)) {
          return Promise.all(workOrOperations);
        }
        return (workOrOperations as (tx: typeof prisma) => unknown)(prisma);
      },
    );
    prisma.financialCharge.findMany.mockResolvedValue([charge()]);
    prisma.financialCharge.count.mockResolvedValue(1);
    prisma.financialCharge.findUnique.mockResolvedValue(charge());
    prisma.financialCharge.update.mockResolvedValue(
      charge({ status: FinancialChargeStatus.PAID }),
    );
    prisma.payment.create.mockResolvedValue(payment());
    prisma.financialMovement.create.mockResolvedValue(movement());
  });

  it('lists charges with pagination, status filter, and reservation filter', async () => {
    const result = await service.findAll({
      status: FinancialChargeStatus.PENDING,
      reservationId: 10,
      page: 2,
      limit: 10,
    });

    expect(prisma.financialCharge.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: FinancialChargeStatus.PENDING,
          reservationId: 10,
        },
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toEqual(expect.objectContaining({ total: 1, page: 2, limit: 10 }));
  });

  it('returns charge detail with operational payment fields', async () => {
    prisma.financialCharge.findUnique.mockResolvedValue({
      ...charge(),
      payments: [payment()],
    });

    const result = await service.findOne(1);

    expect(result.payments[0]).toEqual(
      expect.objectContaining({
        id: 1,
        chargeId: 1,
        status: PaymentStatus.CONFIRMED,
        recordedById: 7,
      }),
    );
  });

  it('throws 404 for an unknown charge detail', async () => {
    prisma.financialCharge.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records an exact payment, settles its charge, and creates its movement atomically', async () => {
    const result = await service.recordPayment(
      1,
      { amount: '2500.00', method: PaymentMethod.BANK_TRANSFER, reference: ' SINPE-123 ' },
      7,
    );

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          chargeId: 1,
          amount: new Prisma.Decimal('2500.00'),
          status: PaymentStatus.CONFIRMED,
          method: PaymentMethod.BANK_TRANSFER,
          reference: 'SINPE-123',
          recordedById: 7,
          paidAt: expect.any(Date),
        }),
      }),
    );
    expect(prisma.financialCharge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: FinancialChargeStatus.PAID },
      }),
    );
    expect(prisma.financialMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.RESERVATION_PAYMENT,
          sourceId: 1,
          amount: new Prisma.Decimal('2500.00'),
          currency: 'CRC',
          description: 'Pago de reserva #10',
          reference: 'SINPE-123',
          recordedById: 7,
        }),
      }),
    );
    const paymentPaidAt = prisma.payment.create.mock.calls[0][0].data.paidAt;
    const movementOccurredAt =
      prisma.financialMovement.create.mock.calls[0][0].data.occurredAt;
    expect(movementOccurredAt).toBe(paymentPaidAt);
    expect(result.charge.status).toBe(FinancialChargeStatus.PAID);
  });

  it('fails the payment transaction when movement creation fails', async () => {
    prisma.financialMovement.create.mockRejectedValueOnce(
      new Error('movement failure'),
    );

    await expect(
      service.recordPayment(1, { amount: '2500', method: PaymentMethod.CASH }, 7),
    ).rejects.toThrow('movement failure');

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('normalizes an empty reference to null', async () => {
    await service.recordPayment(
      1,
      { amount: '2500', method: PaymentMethod.CASH, reference: undefined },
      7,
    );

    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reference: null }) }),
    );
  });

  it.each(['abc', '1.234', '-1', ''])('rejects malformed amount %j', async (amount) => {
    await expect(
      service.recordPayment(1, { amount, method: PaymentMethod.CASH }, 7),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it.each(['2499.99', '2500.01'])('rejects non-exact amount %s', async (amount) => {
    await expect(
      service.recordPayment(1, { amount, method: PaymentMethod.CASH }, 7),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(prisma.financialCharge.update).not.toHaveBeenCalled();
  });

  it.each([FinancialChargeStatus.PAID, FinancialChargeStatus.CANCELLED])(
    'rejects payment for a %s charge',
    async (status) => {
      prisma.financialCharge.findUnique.mockResolvedValue(charge({ status }));

      await expect(
        service.recordPayment(1, { amount: '2500', method: PaymentMethod.CASH }, 7),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    },
  );

  it('rejects a non-CRC charge', async () => {
    prisma.financialCharge.findUnique.mockResolvedValue(charge({ currency: 'USD' }));

    await expect(
      service.recordPayment(1, { amount: '2500', method: PaymentMethod.CASH }, 7),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 404 and creates no payment for an unknown charge', async () => {
    prisma.financialCharge.findUnique.mockResolvedValue(null);

    await expect(
      service.recordPayment(999, { amount: '2500', method: PaymentMethod.CASH }, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('retries P2034 and creates payment only in the successful transaction', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Serialization failure', {
      code: 'P2034',
      clientVersion: '7.9.1',
    });
    prisma.$transaction
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockImplementation((work: (tx: typeof prisma) => unknown) => work(prisma));

    await service.recordPayment(1, { amount: '2500', method: PaymentMethod.CASH }, 7);

    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
  });

  it('maps exhausted P2034 retries to conflict without creating payment', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Serialization failure', {
      code: 'P2034',
      clientVersion: '7.9.1',
    });
    prisma.$transaction.mockRejectedValue(error);

    await expect(
      service.recordPayment(1, { amount: '2500', method: PaymentMethod.CASH }, 7),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
