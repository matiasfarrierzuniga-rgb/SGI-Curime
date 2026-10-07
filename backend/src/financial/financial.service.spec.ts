import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  FinancialChargeStatus,
  FinancialMethod,
  FinancialMovementOriginType,
  FinancialMovementSource,
  FinancialMovementStatus,
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
    dueAt: new Date('2030-01-15T10:00:00.000Z'),
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
    legacyMethod: PaymentMethod.CASH,
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
    legacySource: FinancialMovementSource.RESERVATION_PAYMENT,
    amount: new Prisma.Decimal('2500.00'),
    currency: 'CRC',
    description: 'Pago de reserva #10',
    reference: null,
    occurredAt: now,
    legacySourceId: 1,
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
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    financialMovement: {
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: FinancialService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FinancialService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((workOrOperations: unknown) => {
      if (Array.isArray(workOrOperations)) {
        return Promise.all(workOrOperations);
      }
      return (workOrOperations as (tx: typeof prisma) => unknown)(prisma);
    });
    prisma.financialCharge.findMany.mockResolvedValue([charge()]);
    prisma.financialCharge.count.mockResolvedValue(1);
    prisma.financialCharge.findUnique.mockResolvedValue(charge());
    prisma.financialCharge.update.mockResolvedValue(
      charge({ status: FinancialChargeStatus.PAID }),
    );
    prisma.payment.create.mockResolvedValue(payment());
    prisma.payment.update.mockResolvedValue({ id: 1 });
    prisma.financialMovement.create.mockResolvedValue(movement());
    prisma.payment.groupBy.mockResolvedValue([]);
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
    expect(result).toEqual(
      expect.objectContaining({ total: 1, page: 2, limit: 10 }),
    );
  });

  it('aggregates operational totals by source and excludes voided movements', async () => {
    prisma.financialMovement.groupBy.mockResolvedValue([
      {
        type: FinancialMovementType.INCOME,
        legacySource: FinancialMovementSource.MANUAL,
        _sum: { amount: new Prisma.Decimal('10000.10') },
        _count: { _all: 2 },
      },
      {
        type: FinancialMovementType.INCOME,
        legacySource: FinancialMovementSource.RESERVATION_PAYMENT,
        _sum: { amount: new Prisma.Decimal('3000.00') },
        _count: { _all: 1 },
      },
      {
        type: FinancialMovementType.EXPENSE,
        legacySource: FinancialMovementSource.MANUAL,
        _sum: { amount: new Prisma.Decimal('2500.00') },
        _count: { _all: 1 },
      },
    ]);
    prisma.payment.groupBy.mockResolvedValue([
      {
        legacyMethod: PaymentMethod.CASH,
        _sum: { amount: new Prisma.Decimal('1000.00') },
        _count: { _all: 1 },
      },
      {
        legacyMethod: PaymentMethod.BANK_TRANSFER,
        _sum: { amount: new Prisma.Decimal('2000.00') },
        _count: { _all: 1 },
      },
    ]);

    const result = await service.summarizeMovements({
      dateFrom: '2030-01-01',
      dateTo: '2030-01-31',
    });

    expect(prisma.financialMovement.groupBy).toHaveBeenCalledWith({
      by: ['type', 'legacySource'],
      orderBy: [{ legacySource: 'asc' }, { type: 'asc' }],
      where: {
        type: undefined,
        status: undefined,
        occurredAt: {
          gte: new Date('2030-01-01T00:00:00.000Z'),
          lt: new Date('2030-02-01T00:00:00.000Z'),
        },
        AND: [
          {
            OR: [
              { status: { not: FinancialMovementStatus.VOIDED } },
              { status: null },
            ],
          },
        ],
      },
      _sum: { amount: true },
      _count: { _all: true },
    });
    expect(prisma.payment.groupBy).toHaveBeenCalledWith({
      by: ['legacyMethod'],
      orderBy: { legacyMethod: 'asc' },
      where: {
        status: PaymentStatus.CONFIRMED,
        paidAt: {
          not: null,
          gte: new Date('2030-01-01T00:00:00.000Z'),
          lt: new Date('2030-02-01T00:00:00.000Z'),
        },
        movement: {
          is: {
            type: FinancialMovementType.INCOME,
            status: undefined,
            AND: [
              {
                OR: [
                  { status: { not: FinancialMovementStatus.VOIDED } },
                  { status: null },
                ],
              },
            ],
          },
        },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });
    expect(result).toEqual({
      currency: 'CRC',
      totalIncome: '13000.10',
      totalExpenses: '2500.00',
      balance: '10500.10',
      incomeCount: 3,
      expenseCount: 1,
      movementCount: 4,
      incomeAverage: '4333.37',
      expenseAverage: '2500.00',
      bySource: [
        {
          source: FinancialMovementSource.MANUAL,
          incomeTotal: '10000.10',
          incomeCount: 2,
          expenseTotal: '2500.00',
          expenseCount: 1,
        },
        {
          source: FinancialMovementSource.RESERVATION_PAYMENT,
          incomeTotal: '3000.00',
          incomeCount: 1,
          expenseTotal: '0.00',
          expenseCount: 0,
        },
      ],
      confirmedPayments: {
        total: '3000.00',
        count: 2,
        byMethod: [
          { method: PaymentMethod.CASH, total: '1000.00', count: 1 },
          {
            method: PaymentMethod.BANK_TRANSFER,
            total: '2000.00',
            count: 1,
          },
        ],
      },
    });
  });

  it('returns zero totals and averages when the reporting period has no movements', async () => {
    prisma.financialMovement.groupBy.mockResolvedValue([]);

    const result = await service.summarizeMovements({});

    expect(result).toEqual({
      currency: 'CRC',
      totalIncome: '0.00',
      totalExpenses: '0.00',
      balance: '0.00',
      incomeCount: 0,
      expenseCount: 0,
      movementCount: 0,
      incomeAverage: '0.00',
      expenseAverage: '0.00',
      bySource: [],
      confirmedPayments: {
        total: '0.00',
        count: 0,
        byMethod: [],
      },
    });
  });

  it('applies the selected movement type to the operational summary query', async () => {
    prisma.financialMovement.groupBy.mockResolvedValue([]);

    await service.summarizeMovements({
      type: FinancialMovementType.EXPENSE,
    });

    expect(prisma.financialMovement.groupBy).toHaveBeenCalledWith({
      by: ['type', 'legacySource'],
      orderBy: [{ legacySource: 'asc' }, { type: 'asc' }],
      where: {
        type: FinancialMovementType.EXPENSE,
        status: undefined,
        occurredAt: undefined,
        AND: [
          {
            OR: [
              { status: { not: FinancialMovementStatus.VOIDED } },
              { status: null },
            ],
          },
        ],
      },
      _sum: { amount: true },
      _count: { _all: true },
    });
    expect(prisma.payment.groupBy).not.toHaveBeenCalled();
  });

  it('applies status, method, and text filters to the summary in Prisma', async () => {
    await service.summarizeMovements({
      type: FinancialMovementType.INCOME,
      status: FinancialMovementStatus.POSTED,
      method: FinancialMethod.BANK_TRANSFER,
      search: 'SINPE',
    });

    expect(prisma.financialMovement.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: FinancialMovementType.INCOME,
          status: FinancialMovementStatus.POSTED,
          AND: expect.arrayContaining([
            {
              OR: [
                {
                  description: {
                    contains: 'SINPE',
                    mode: 'insensitive',
                  },
                },
                {
                  reference: {
                    contains: 'SINPE',
                    mode: 'insensitive',
                  },
                },
              ],
            },
            {
              OR: [
                {
                  payment: {
                    is: { financialMethod: FinancialMethod.BANK_TRANSFER },
                  },
                },
                {
                  payment: {
                    is: { legacyMethod: PaymentMethod.BANK_TRANSFER },
                  },
                },
                {
                  disbursement: {
                    is: { method: FinancialMethod.BANK_TRANSFER },
                  },
                },
                {
                  originalDonation: {
                    is: { financialMethod: FinancialMethod.BANK_TRANSFER },
                  },
                },
                {
                  originalDonation: {
                    is: { legacyMethod: PaymentMethod.BANK_TRANSFER },
                  },
                },
              ],
            },
          ]),
        }),
      }),
    );
    expect(prisma.payment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PaymentStatus.CONFIRMED,
          OR: [
            { financialMethod: FinancialMethod.BANK_TRANSFER },
            { legacyMethod: PaymentMethod.BANK_TRANSFER },
          ],
          movement: {
            is: expect.objectContaining({
              type: FinancialMovementType.INCOME,
              status: FinancialMovementStatus.POSTED,
              AND: expect.arrayContaining([
                {
                  OR: [
                    {
                      description: {
                        contains: 'SINPE',
                        mode: 'insensitive',
                      },
                    },
                    {
                      reference: {
                        contains: 'SINPE',
                        mode: 'insensitive',
                      },
                    },
                  ],
                },
              ]),
            }),
          },
        }),
      }),
    );
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
    expect(result).toEqual(
      expect.objectContaining({
        amount: new Prisma.Decimal('2500.00'),
        balance: '2500.00',
        dueAt: new Date('2030-01-15T10:00:00.000Z'),
      }),
    );
  });

  it('throws 404 for an unknown charge detail', async () => {
    prisma.financialCharge.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('records an exact payment, settles its charge, and creates its movement atomically', async () => {
    const result = await service.recordPayment(
      1,
      {
        amount: '2500.00',
        method: PaymentMethod.BANK_TRANSFER,
        reference: ' SINPE-123 ',
      },
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
          legacyMethod: PaymentMethod.BANK_TRANSFER,
          financialMethod: FinancialMethod.BANK_TRANSFER,
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
          legacySource: FinancialMovementSource.RESERVATION_PAYMENT,
          legacySourceId: 1,
          originType: FinancialMovementOriginType.PAYMENT,
          status: FinancialMovementStatus.POSTED,
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
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { movementId: 2 },
      select: { id: true },
    });
    expect(result.charge.status).toBe(FinancialChargeStatus.PAID);
  });

  it('fails the payment transaction when movement creation fails', async () => {
    prisma.financialMovement.create.mockRejectedValueOnce(
      new Error('movement failure'),
    );

    await expect(
      service.recordPayment(
        1,
        { amount: '2500', method: PaymentMethod.CASH },
        7,
      ),
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
      expect.objectContaining({
        data: expect.objectContaining({ reference: null }),
      }),
    );
  });

  it.each(['abc', '1.234', '-1', '0', '0.00', ''])(
    'rejects malformed amount %j',
    async (amount) => {
      await expect(
        service.recordPayment(1, { amount, method: PaymentMethod.CASH }, 7),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    },
  );

  it.each(['2499.99', '2500.01'])(
    'rejects non-exact amount %s',
    async (amount) => {
      await expect(
        service.recordPayment(1, { amount, method: PaymentMethod.CASH }, 7),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(prisma.financialCharge.update).not.toHaveBeenCalled();
    },
  );

  it.each([FinancialChargeStatus.PAID, FinancialChargeStatus.CANCELLED])(
    'rejects payment for a %s charge',
    async (status) => {
      prisma.financialCharge.findUnique.mockResolvedValue(charge({ status }));

      await expect(
        service.recordPayment(
          1,
          { amount: '2500', method: PaymentMethod.CASH },
          7,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    },
  );

  it('rejects a non-CRC charge', async () => {
    prisma.financialCharge.findUnique.mockResolvedValue(
      charge({ currency: 'USD' }),
    );

    await expect(
      service.recordPayment(
        1,
        { amount: '2500', method: PaymentMethod.CASH },
        7,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws 404 and creates no payment for an unknown charge', async () => {
    prisma.financialCharge.findUnique.mockResolvedValue(null);

    await expect(
      service.recordPayment(
        999,
        { amount: '2500', method: PaymentMethod.CASH },
        7,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('retries P2034 and creates payment only in the successful transaction', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Serialization failure',
      {
        code: 'P2034',
        clientVersion: '7.9.1',
      },
    );
    prisma.$transaction
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockImplementation((work: (tx: typeof prisma) => unknown) =>
        work(prisma),
      );

    await service.recordPayment(
      1,
      { amount: '2500', method: PaymentMethod.CASH },
      7,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
  });

  it('maps exhausted P2034 retries to conflict without creating payment', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Serialization failure',
      {
        code: 'P2034',
        clientVersion: '7.9.1',
      },
    );
    prisma.$transaction.mockRejectedValue(error);

    await expect(
      service.recordPayment(
        1,
        { amount: '2500', method: PaymentMethod.CASH },
        7,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
