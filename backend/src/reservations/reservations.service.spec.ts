import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  FinancialChargeStatus,
  Prisma,
  FinancialChargeStatus,
  ReservableResourceStatus,
  ReservationStatus,
  ResourcePricingType,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from './reservations.service';

const startAt = new Date('2030-01-01T10:00:00.000Z');
const endAt = new Date('2030-01-01T12:00:00.000Z');

function createDto(overrides = {}) {
  return {
    resourceId: 1,
    startAt,
    endAt,
    purpose: 'Actividad comunitaria',
    ...overrides,
  };
}

const adminSelect = {
  id: true,
  resourceId: true,
  resource: { select: { id: true, name: true, location: true } },
  requesterUserId: true,
  requester: { select: { id: true, fullName: true, email: true } },
  eventId: true,
  event: { select: { id: true, title: true, startAt: true, endAt: true } },
  startAt: true,
  endAt: true,
  purpose: true,
  estimatedAttendees: true,
  notes: true,
  status: true,
  approvedAt: true,
  approvedById: true,
  approvedBy: { select: { id: true, fullName: true, email: true } },
  rejectionReason: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
};

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    resourceId: 1,
    resource: { id: 1, name: 'Salón', location: 'Curime' },
    requesterUserId: 7,
    requester: { id: 7, fullName: 'Juan', email: 'juan@test.com' },
    eventId: null,
    event: null,
    startAt,
    endAt,
    purpose: 'Reunión',
    estimatedAttendees: null,
    notes: null,
    status: ReservationStatus.PENDING,
    approvedAt: null,
    approvedById: null,
    approvedBy: null,
    rejectionReason: null,
    cancelledAt: null,
    createdAt: startAt,
    updatedAt: startAt,
    ...overrides,
  };
}

describe('ReservationsService', () => {
  const prisma = {
    reservableResource: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    reservation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    financialCharge: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: ReservationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReservationsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation(
      (workOrArray: unknown) => {
        if (typeof workOrArray === 'function') return workOrArray(prisma);
        if (Array.isArray(workOrArray))
          return Promise.all(workOrArray) as Promise<unknown>;
        return workOrArray;
      },
    );
    prisma.reservableResource.findUnique.mockResolvedValue({
      id: 1,
      status: ReservableResourceStatus.ACTIVE,
    });
    prisma.reservableResource.findMany.mockResolvedValue([]);
    prisma.reservation.findFirst.mockResolvedValue(null);
    prisma.reservation.findUnique.mockResolvedValue(null);
    prisma.reservation.findMany.mockResolvedValue([]);
    prisma.reservation.count.mockResolvedValue(0);
    prisma.reservation.update.mockResolvedValue(makeReservation());
    prisma.reservation.create.mockResolvedValue({
      id: 1,
      ...createDto(),
      requesterUserId: 7,
      eventId: null,
      estimatedAttendees: null,
      notes: null,
      status: ReservationStatus.PENDING,
      createdAt: startAt,
      updatedAt: startAt,
    });
    prisma.event.findUnique.mockResolvedValue({ id: 2 });
    prisma.financialCharge.findUnique.mockResolvedValue(null);
    prisma.financialCharge.update.mockResolvedValue({ id: 1 });
    prisma.financialCharge.create.mockResolvedValue({
      id: 1,
      reservationId: 1,
      amount: new Prisma.Decimal('0'),
      currency: 'CRC',
      status: FinancialChargeStatus.PENDING,
    });
  });

  it('lists active reservable resources only', async () => {
    await service.findActiveResources();

    expect(prisma.reservableResource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: ReservableResourceStatus.ACTIVE },
        orderBy: { name: 'asc' },
      }),
    );
  });

  it('reports availability when no blocking reservation overlaps', async () => {
    await expect(
      service.checkAvailability({ resourceId: 1, startAt, endAt }),
    ).resolves.toEqual({ available: true });
  });

  it('reports unavailable only for overlapping blocking statuses', async () => {
    prisma.reservation.findFirst.mockResolvedValue({ id: 9 });

    await expect(
      service.checkAvailability({ resourceId: 1, startAt, endAt }),
    ).resolves.toEqual({ available: false });
    expect(prisma.reservation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            in: [
              ReservationStatus.PENDING,
              ReservationStatus.APPROVED,
              ReservationStatus.CONFIRMED,
            ],
          },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        }),
      }),
    );
  });

  it('allows adjacent reservations and excludes non-blocking statuses', async () => {
    const adjacentStart = endAt;
    const adjacentEnd = new Date('2030-01-01T13:00:00.000Z');

    await expect(
      service.checkAvailability({
        resourceId: 1,
        startAt: adjacentStart,
        endAt: adjacentEnd,
      }),
    ).resolves.toEqual({ available: true });
    const query = prisma.reservation.findFirst.mock.calls[0][0].where;
    expect(query.startAt).toEqual({ lt: adjacentEnd });
    expect(query.endAt).toEqual({ gt: adjacentStart });
    expect(query.status.in).not.toEqual(
      expect.arrayContaining([
        ReservationStatus.CANCELLED,
        ReservationStatus.REJECTED,
        ReservationStatus.COMPLETED,
      ]),
    );
  });

  it.each([
    ['equal dates', startAt, startAt],
    ['reversed dates', endAt, startAt],
    [
      'past date',
      new Date('2020-01-01T10:00:00.000Z'),
      new Date('2020-01-01T12:00:00.000Z'),
    ],
    ['duration below one hour', startAt, new Date('2030-01-01T10:59:00.000Z')],
    [
      'duration above twelve hours',
      startAt,
      new Date('2030-01-01T22:01:00.000Z'),
    ],
  ])('rejects %s', async (_name, invalidStartAt, invalidEndAt) => {
    await expect(
      service.checkAvailability({
        resourceId: 1,
        startAt: invalidStartAt,
        endAt: invalidEndAt,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports unknown and inactive resources distinctly', async () => {
    prisma.reservableResource.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.checkAvailability({ resourceId: 1, startAt, endAt }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.reservableResource.findUnique.mockResolvedValueOnce({
      id: 1,
      status: ReservableResourceStatus.INACTIVE,
    });
    await expect(
      service.checkAvailability({ resourceId: 1, startAt, endAt }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a pending reservation after rechecking availability', async () => {
    await service.create(
      createDto({ eventId: 2, estimatedAttendees: 20, notes: 'Montaje' }),
      7,
    );

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(prisma.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requesterUserId: 7,
          eventId: 2,
          status: ReservationStatus.PENDING,
        }),
      }),
    );
  });

  it('rejects an unknown linked event', async () => {
    prisma.event.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create(createDto({ eventId: 2 }), 7),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an overlapping create with a conflict', async () => {
    prisma.reservation.findFirst.mockResolvedValueOnce({ id: 2 });
    await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.reservation.create).not.toHaveBeenCalled();
  });

  it('maps exhausted serializable conflicts to conflict', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Serialization failure',
      { code: 'P2034', clientVersion: '7.9.1' },
    );
    prisma.$transaction.mockRejectedValue(error);
    await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });

  // ── LIST ──────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated results with default page and limit', async () => {
      const reservation = makeReservation();
      prisma.reservation.findMany.mockResolvedValue([reservation]);
      prisma.reservation.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: [reservation],
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('filters by status', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.reservation.count.mockResolvedValue(0);

      await service.findAll({ status: ReservationStatus.APPROVED });

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ReservationStatus.APPROVED,
          }),
        }),
      );
    });

    it('filters by resourceId', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.reservation.count.mockResolvedValue(0);

      await service.findAll({ resourceId: 3 });

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ resourceId: 3 }),
        }),
      );
    });

    it('filters by date range (from/to)', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.reservation.count.mockResolvedValue(0);

      await service.findAll({
        from: '2030-01-01T00:00:00.000Z',
        to: '2030-01-31T23:59:59.999Z',
      });

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startAt: {
              gte: new Date('2030-01-01T00:00:00.000Z'),
              lte: new Date('2030-01-31T23:59:59.999Z'),
            },
          }),
        }),
      );
    });

    it('does not expose sensitive user data', async () => {
      const reservation = makeReservation();
      prisma.reservation.findMany.mockResolvedValue([reservation]);
      prisma.reservation.count.mockResolvedValue(1);

      const result = await service.findAll({});
      const item = result.data[0] as Record<string, unknown>;

      expect(item.requester).toEqual({
        id: 7,
        fullName: 'Juan',
        email: 'juan@test.com',
      });
      expect(item).not.toHaveProperty('passwordHash');
      expect(item).not.toHaveProperty('phone');
    });
  });

  // ── DETAIL ────────────────────────────────────────────

  describe('findOne', () => {
    it('returns reservation with resource, requester, and optional approver/event', async () => {
      const reservation = makeReservation();
      prisma.reservation.findUnique.mockResolvedValue(reservation);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.resource).toEqual({
        id: 1,
        name: 'Salón',
        location: 'Curime',
      });
      expect(result.requester).toEqual({
        id: 7,
        fullName: 'Juan',
        email: 'juan@test.com',
      });
    });

    it('throws 404 for nonexistent reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ── APPROVE ───────────────────────────────────────────

  describe('approve', () => {
    it('transitions PENDING to APPROVED with approvedAt and approvedById', async () => {
      const pending = makeReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(pending);
      prisma.reservation.findFirst.mockResolvedValue(null); // no conflict
      const approved = makeReservation({
        status: ReservationStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: 99,
      });
      prisma.reservation.update.mockResolvedValue(approved);

      const result = await service.approve(1, 99);

      expect(result.status).toBe(ReservationStatus.APPROVED);
      expect(result.approvedById).toBe(99);
      expect(result.approvedAt).toBeDefined();
      expect(prisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ReservationStatus.APPROVED,
            approvedById: 99,
          }),
        }),
      );
    });

    it('validates availability excluding the own reservation', async () => {
      const pending = makeReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(pending);
      prisma.reservation.findFirst.mockResolvedValue({ id: 5 }); // conflict

      await expect(service.approve(1, 99)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.reservation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 1 },
          }),
        }),
      );
    });

    it('rejects approve for non-PENDING status', async () => {
      const approved = makeReservation({
        status: ReservationStatus.APPROVED,
      });
      prisma.reservation.findUnique.mockResolvedValue(approved);

      await expect(service.approve(1, 99)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.financialCharge.create).not.toHaveBeenCalled();
    });

    it('rejects approve for REJECTED status', async () => {
      const rejected = makeReservation({
        status: ReservationStatus.REJECTED,
      });
      prisma.reservation.findUnique.mockResolvedValue(rejected);

      await expect(service.approve(1, 99)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects approve for CANCELLED status', async () => {
      const cancelled = makeReservation({
        status: ReservationStatus.CANCELLED,
      });
      prisma.reservation.findUnique.mockResolvedValue(cancelled);

      await expect(service.approve(1, 99)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects approve for COMPLETED status', async () => {
      const completed = makeReservation({
        status: ReservationStatus.COMPLETED,
      });
      prisma.reservation.findUnique.mockResolvedValue(completed);

      await expect(service.approve(1, 99)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws 404 for nonexistent reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.approve(999, 99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('uses serializable transaction for approve', async () => {
      const pending = makeReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(pending);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.update.mockResolvedValue(
        makeReservation({ status: ReservationStatus.APPROVED }),
      );

      await service.approve(1, 99);

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    });

    function mockFreeResource() {
      prisma.reservableResource.findUnique.mockResolvedValue({
        id: 1,
        status: ReservableResourceStatus.ACTIVE,
        pricingType: ResourcePricingType.FREE,
        price: null,
      });
    }

    function mockFixedResource(price: Prisma.Decimal | null) {
      prisma.reservableResource.findUnique.mockResolvedValue({
        id: 1,
        status: ReservableResourceStatus.ACTIVE,
        pricingType: ResourcePricingType.FIXED,
        price,
      });
    }

    function mockPendingReservation() {
      prisma.reservation.findUnique.mockResolvedValue(
        makeReservation({ status: ReservationStatus.PENDING }),
      );
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.update.mockResolvedValue(
        makeReservation({
          status: ReservationStatus.APPROVED,
          approvedAt: new Date('2030-01-02T00:00:00.000Z'),
          approvedById: 7,
        }),
      );
    }

    it('FREE: approves without creating a FinancialCharge', async () => {
      mockFreeResource();
      mockPendingReservation();

      const result = await service.approve(1, 7);

      expect(result.status).toBe(ReservationStatus.APPROVED);
      expect(result.approvedAt).toEqual(new Date('2030-01-02T00:00:00.000Z'));
      expect(result.approvedById).toBe(7);
      expect(prisma.financialCharge.create).not.toHaveBeenCalled();
    });

    it('FIXED: approves and creates a single snapshot charge', async () => {
      const price = new Prisma.Decimal('2500');
      mockFixedResource(price);
      mockPendingReservation();
      prisma.financialCharge.create.mockResolvedValue({
        id: 10,
        reservationId: 1,
        amount: price,
        currency: 'CRC',
        status: FinancialChargeStatus.PENDING,
      });

      const result = await service.approve(1, 7);

      expect(result.status).toBe(ReservationStatus.APPROVED);
      expect(prisma.financialCharge.create).toHaveBeenCalledTimes(1);
      const data = prisma.financialCharge.create.mock.calls[0][0].data;
      expect(data.reservationId).toBe(1);
      expect(data.amount.toString()).toBe('2500');
      expect(data.currency).toBeUndefined();
      expect(data.status).toBeUndefined();
    });

    it.each([
      ['null', null],
      ['zero', new Prisma.Decimal('0')],
      ['negative', new Prisma.Decimal('-100')],
    ] as const)(
      'FIXED with $s price blocks approval without persisting',
      async (_label, price) => {
        mockFixedResource(price);
        prisma.reservation.findUnique.mockResolvedValue(
          makeReservation({ status: ReservationStatus.PENDING }),
        );
        prisma.reservation.findFirst.mockResolvedValue(null);

        await expect(service.approve(1, 7)).rejects.toBeInstanceOf(
          ConflictException,
        );
        expect(prisma.reservation.update).not.toHaveBeenCalled();
        expect(prisma.financialCharge.create).not.toHaveBeenCalled();
      },
    );

    it('creates the charge inside the serializable transaction', async () => {
      mockFixedResource(new Prisma.Decimal('1200'));
      mockPendingReservation();

      await service.approve(1, 7);

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
      expect(prisma.financialCharge.create).toHaveBeenCalledTimes(1);
    });

    it('retries on serialization failure and still creates a single charge', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Serialization failure',
        { code: 'P2034', clientVersion: '7.9.1' },
      );
      prisma.$transaction
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockImplementation((workOrArray: unknown) =>
          typeof workOrArray === 'function'
            ? workOrArray(prisma)
            : workOrArray,
        );
      mockFixedResource(new Prisma.Decimal('1200'));
      mockPendingReservation();

      const result = await service.approve(1, 7);

      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(ReservationStatus.APPROVED);
      expect(prisma.financialCharge.create).toHaveBeenCalledTimes(1);
    });

    it('maps an unexpected charge unique violation to a conflict', async () => {
      mockFixedResource(new Prisma.Decimal('1200'));
      prisma.reservation.findUnique.mockResolvedValue(
        makeReservation({ status: ReservationStatus.PENDING }),
      );
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.update.mockResolvedValue(
        makeReservation({ status: ReservationStatus.APPROVED }),
      );
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        {
          code: 'P2002',
          clientVersion: '7.9.1',
          meta: { target: ['reservationId'] },
        },
      );
      prisma.financialCharge.create.mockRejectedValue(error);

      await expect(service.approve(1, 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  // ── REJECT ────────────────────────────────────────────

  describe('reject', () => {
    it('transitions PENDING to REJECTED with rejectionReason', async () => {
      const pending = makeReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(pending);
      const rejected = makeReservation({
        status: ReservationStatus.REJECTED,
        rejectionReason: 'No hay espacio disponible',
      });
      prisma.reservation.update.mockResolvedValue(rejected);

      const result = await service.reject(1, 'No hay espacio disponible', 99);

      expect(result.status).toBe(ReservationStatus.REJECTED);
      expect(result.rejectionReason).toBe('No hay espacio disponible');
    });

    it('rejects reject for non-PENDING status', async () => {
      const approved = makeReservation({
        status: ReservationStatus.APPROVED,
      });
      prisma.reservation.findUnique.mockResolvedValue(approved);

      await expect(
        service.reject(1, 'Motivo', 99),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects reject for CONFIRMED status', async () => {
      const confirmed = makeReservation({
        status: ReservationStatus.CONFIRMED,
      });
      prisma.reservation.findUnique.mockResolvedValue(confirmed);

      await expect(
        service.reject(1, 'Motivo', 99),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws 404 for nonexistent reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.reject(999, 'Motivo', 99),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ── CANCEL ────────────────────────────────────────────

  describe('cancel', () => {
    it('transitions PENDING to CANCELLED with cancelledAt', async () => {
      const pending = makeReservation({ status: ReservationStatus.PENDING });
      prisma.reservation.findUnique.mockResolvedValue(pending);
      const cancelled = makeReservation({
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      });
      prisma.reservation.update.mockResolvedValue(cancelled);

      const result = await service.cancel(1);

      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
      expect(prisma.financialCharge.update).not.toHaveBeenCalled();
    });

    it('cancels a pending charge with its reservation in the serializable transaction', async () => {
      prisma.reservation.findUnique.mockResolvedValue(
        makeReservation({ status: ReservationStatus.APPROVED }),
      );
      prisma.financialCharge.findUnique.mockResolvedValue({
        id: 4,
        status: FinancialChargeStatus.PENDING,
      });
      prisma.reservation.update.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CANCELLED }),
      );

      const result = await service.cancel(1);

      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
      expect(prisma.financialCharge.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { status: FinancialChargeStatus.CANCELLED },
      });
      expect(prisma.financialCharge.delete).not.toHaveBeenCalled();
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ReservationStatus.CANCELLED }),
        }),
      );
    });

    it('blocks cancellation before writes when the charge is paid', async () => {
      prisma.reservation.findUnique.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CONFIRMED }),
      );
      prisma.financialCharge.findUnique.mockResolvedValue({
        id: 4,
        status: FinancialChargeStatus.PAID,
      });

      await expect(service.cancel(1)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.reservation.update).not.toHaveBeenCalled();
      expect(prisma.financialCharge.update).not.toHaveBeenCalled();
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('allows cancellation with an already cancelled charge without updating it', async () => {
      prisma.reservation.findUnique.mockResolvedValue(
        makeReservation({ status: ReservationStatus.APPROVED }),
      );
      prisma.financialCharge.findUnique.mockResolvedValue({
        id: 4,
        status: FinancialChargeStatus.CANCELLED,
      });
      prisma.reservation.update.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CANCELLED }),
      );

      await expect(service.cancel(1)).resolves.toEqual(
        expect.objectContaining({ status: ReservationStatus.CANCELLED }),
      );
      expect(prisma.financialCharge.update).not.toHaveBeenCalled();
    });

    it('transitions APPROVED to CANCELLED', async () => {
      const approved = makeReservation({
        status: ReservationStatus.APPROVED,
      });
      prisma.reservation.findUnique.mockResolvedValue(approved);
      const cancelled = makeReservation({
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      });
      prisma.reservation.update.mockResolvedValue(cancelled);

      const result = await service.cancel(1);
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('transitions CONFIRMED to CANCELLED', async () => {
      const confirmed = makeReservation({
        status: ReservationStatus.CONFIRMED,
      });
      prisma.reservation.findUnique.mockResolvedValue(confirmed);
      const cancelled = makeReservation({
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      });
      prisma.reservation.update.mockResolvedValue(cancelled);

      const result = await service.cancel(1);
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('rejects cancel for REJECTED status', async () => {
      const rejected = makeReservation({
        status: ReservationStatus.REJECTED,
      });
      prisma.reservation.findUnique.mockResolvedValue(rejected);

      await expect(service.cancel(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects cancel for CANCELLED status', async () => {
      const cancelled = makeReservation({
        status: ReservationStatus.CANCELLED,
      });
      prisma.reservation.findUnique.mockResolvedValue(cancelled);

      await expect(service.cancel(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects cancel for COMPLETED status', async () => {
      const completed = makeReservation({
        status: ReservationStatus.COMPLETED,
      });
      prisma.reservation.findUnique.mockResolvedValue(completed);

      await expect(service.cancel(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws 404 for nonexistent reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.cancel(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('retries after P2034 and blocks cancellation when payment wins', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Serialization failure',
        { code: 'P2034', clientVersion: '7.9.1' },
      );
      prisma.$transaction
        .mockRejectedValueOnce(error)
        .mockImplementation((workOrArray: unknown) =>
          typeof workOrArray === 'function'
            ? workOrArray(prisma)
            : workOrArray,
        );
      prisma.reservation.findUnique.mockResolvedValue(
        makeReservation({ status: ReservationStatus.APPROVED }),
      );
      prisma.financialCharge.findUnique.mockResolvedValue({
        id: 4,
        status: FinancialChargeStatus.PAID,
      });

      await expect(service.cancel(1)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(prisma.reservation.update).not.toHaveBeenCalled();
      expect(prisma.financialCharge.update).not.toHaveBeenCalled();
    });

    it('retries after P2034 and cancels consistently when charge is cancelled', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Serialization failure',
        { code: 'P2034', clientVersion: '7.9.1' },
      );
      prisma.$transaction
        .mockRejectedValueOnce(error)
        .mockImplementation((workOrArray: unknown) =>
          typeof workOrArray === 'function'
            ? workOrArray(prisma)
            : workOrArray,
        );
      prisma.reservation.findUnique.mockResolvedValue(
        makeReservation({ status: ReservationStatus.APPROVED }),
      );
      prisma.financialCharge.findUnique.mockResolvedValue({
        id: 4,
        status: FinancialChargeStatus.CANCELLED,
      });
      prisma.reservation.update.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CANCELLED }),
      );

      await expect(service.cancel(1)).resolves.toEqual(
        expect.objectContaining({ status: ReservationStatus.CANCELLED }),
      );
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(prisma.financialCharge.update).not.toHaveBeenCalled();
    });

    it('maps exhausted P2034 retries to conflict without reconciliation writes', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Serialization failure',
        { code: 'P2034', clientVersion: '7.9.1' },
      );
      prisma.$transaction.mockRejectedValue(error);

      await expect(service.cancel(1)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
      expect(prisma.reservation.update).not.toHaveBeenCalled();
      expect(prisma.financialCharge.update).not.toHaveBeenCalled();
    });
  });
});
