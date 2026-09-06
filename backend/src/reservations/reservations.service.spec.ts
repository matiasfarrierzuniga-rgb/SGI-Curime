import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ReservableResourceStatus,
  ReservationStatus,
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

describe('ReservationsService', () => {
  const prisma = {
    reservableResource: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    reservation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: ReservationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReservationsService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((work: (tx: typeof prisma) => unknown) => work(prisma));
    prisma.reservableResource.findUnique.mockResolvedValue({
      id: 1,
      status: ReservableResourceStatus.ACTIVE,
    });
    prisma.reservableResource.findMany.mockResolvedValue([]);
    prisma.reservation.findFirst.mockResolvedValue(null);
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
    await expect(service.checkAvailability({ resourceId: 1, startAt, endAt })).resolves.toEqual({ available: true });
  });

  it('reports unavailable only for overlapping blocking statuses', async () => {
    prisma.reservation.findFirst.mockResolvedValue({ id: 9 });

    await expect(service.checkAvailability({ resourceId: 1, startAt, endAt })).resolves.toEqual({ available: false });
    expect(prisma.reservation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: [ReservationStatus.PENDING, ReservationStatus.APPROVED, ReservationStatus.CONFIRMED] },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        }),
      }),
    );
  });

  it('allows adjacent reservations and excludes non-blocking statuses from availability queries', async () => {
    const adjacentStart = endAt;
    const adjacentEnd = new Date('2030-01-01T13:00:00.000Z');

    await expect(service.checkAvailability({ resourceId: 1, startAt: adjacentStart, endAt: adjacentEnd })).resolves.toEqual({ available: true });
    const query = prisma.reservation.findFirst.mock.calls[0][0].where;
    expect(query.startAt).toEqual({ lt: adjacentEnd });
    expect(query.endAt).toEqual({ gt: adjacentStart });
    expect(query.status.in).not.toEqual(expect.arrayContaining([
      ReservationStatus.CANCELLED,
      ReservationStatus.REJECTED,
      ReservationStatus.COMPLETED,
    ]));
  });

  it.each([
    ['equal dates', startAt, startAt],
    ['reversed dates', endAt, startAt],
    ['past date', new Date('2020-01-01T10:00:00.000Z'), new Date('2020-01-01T12:00:00.000Z')],
    ['duration below one hour', startAt, new Date('2030-01-01T10:59:00.000Z')],
    ['duration above twelve hours', startAt, new Date('2030-01-01T22:01:00.000Z')],
  ])('rejects %s', async (_name, invalidStartAt, invalidEndAt) => {
    await expect(
      service.checkAvailability({ resourceId: 1, startAt: invalidStartAt, endAt: invalidEndAt }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports unknown and inactive resources distinctly', async () => {
    prisma.reservableResource.findUnique.mockResolvedValueOnce(null);
    await expect(service.checkAvailability({ resourceId: 1, startAt, endAt })).rejects.toBeInstanceOf(NotFoundException);

    prisma.reservableResource.findUnique.mockResolvedValueOnce({ id: 1, status: ReservableResourceStatus.INACTIVE });
    await expect(service.checkAvailability({ resourceId: 1, startAt, endAt })).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a pending reservation for the authenticated requester after rechecking availability', async () => {
    await service.create(createDto({ eventId: 2, estimatedAttendees: 20, notes: 'Montaje previo' }), 7);

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

    await expect(service.create(createDto({ eventId: 2 }), 7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an overlapping create with a conflict', async () => {
    prisma.reservation.findFirst.mockResolvedValueOnce({ id: 2 });

    await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.reservation.create).not.toHaveBeenCalled();
  });

  it('maps exhausted serializable transaction conflicts to conflict', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Serialization failure', {
      code: 'P2034',
      clientVersion: '7.9.1',
    });
    prisma.$transaction.mockRejectedValue(error);

    await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
  });
});
