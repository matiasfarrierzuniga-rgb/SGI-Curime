import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  FinancialChargeStatus,
  ReservableResourceStatus,
  ReservationStatus,
  ResourcePricingType,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationAvailabilityDto } from './dto/query-reservation-availability.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { assertReservationTransition } from './reservation-transition.policy';

const BLOCKING_STATUSES = [
  ReservationStatus.PENDING,
  ReservationStatus.APPROVED,
  ReservationStatus.CONFIRMED,
] as const;

const COSTA_RICA_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const resourceSelect = {
  id: true,
  name: true,
  description: true,
  location: true,
  capacity: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReservableResourceSelect;

const reservationSelect = {
  id: true,
  resourceId: true,
  requesterUserId: true,
  eventId: true,
  startAt: true,
  endAt: true,
  purpose: true,
  estimatedAttendees: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReservationSelect;

const adminReservationSelect = {
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
} satisfies Prisma.ReservationSelect;

type ReservationTransaction = Pick<
  Prisma.TransactionClient,
  'reservableResource' | 'reservation' | 'event' | 'financialCharge'
>;

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  findActiveResources() {
    return this.prisma.reservableResource.findMany({
      where: { status: ReservableResourceStatus.ACTIVE },
      select: resourceSelect,
      orderBy: { name: 'asc' },
    });
  }

  async checkAvailability(query: QueryReservationAvailabilityDto) {
    this.assertTimeRange(query.startAt, query.endAt);
    await this.requireActiveResource(this.prisma, query.resourceId);
    const conflict = await this.findBlockingReservation(
      this.prisma,
      query.resourceId,
      query.startAt,
      query.endAt,
    );
    return { available: !conflict };
  }

  async create(dto: CreateReservationDto, requesterUserId: number) {
    return this.withSerializableTransaction(async (tx) => {
      this.assertTimeRange(dto.startAt, dto.endAt);
      await this.requireActiveResource(tx, dto.resourceId);
      if (dto.eventId) await this.requireEvent(tx, dto.eventId);

      const conflict = await this.findBlockingReservation(
        tx,
        dto.resourceId,
        dto.startAt,
        dto.endAt,
      );
      if (conflict) throw new ConflictException('Resource is not available');

      return tx.reservation.create({
        data: {
          resourceId: dto.resourceId,
          requesterUserId,
          eventId: dto.eventId,
          startAt: dto.startAt,
          endAt: dto.endAt,
          purpose: dto.purpose,
          estimatedAttendees: dto.estimatedAttendees,
          notes: dto.notes,
          status: ReservationStatus.PENDING,
        },
        select: reservationSelect,
      });
    });
  }

  async findAll(query: QueryReservationsDto) {
    const from = query.from ? parseCostaRicaDayStart(query.from) : undefined;
    const to = query.to
      ? parseCostaRicaExclusiveDayEnd(query.to)
      : undefined;
    if (from && to && from >= to) {
      throw new BadRequestException('From date must be before or equal to to date');
    }

    const where: Prisma.ReservationWhereInput = {
      status: query.status,
      resourceId: query.resourceId,
      startAt:
        from || to
          ? {
              gte: from,
              lt: to,
            }
          : undefined,
    };
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where,
        select: adminReservationSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reservation.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      select: adminReservationSelect,
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  async approve(id: number, actorId: number) {
    return this.withSerializableTransaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          resourceId: true,
          startAt: true,
          endAt: true,
        },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new ConflictException(
          'Only pending reservations can be approved',
        );
      }

      const conflict = await this.findBlockingReservationExcluding(
        tx,
        reservation.resourceId,
        reservation.startAt,
        reservation.endAt,
        reservation.id,
      );
      if (conflict) {
        throw new ConflictException(
          'Resource is no longer available for this time slot',
        );
      }

      const resource = await tx.reservableResource.findUnique({
        where: { id: reservation.resourceId },
        select: { id: true, status: true, pricingType: true, price: true },
      });
      if (!resource) {
        throw new NotFoundException('Reservable resource not found');
      }
      if (resource.status !== ReservableResourceStatus.ACTIVE) {
        throw new ConflictException('Reservable resource is inactive');
      }

      const price = resource.price;
      if (
        resource.pricingType !== ResourcePricingType.FIXED ||
        price === null ||
        price.toNumber() <= 0
      ) {
        throw new ConflictException('Reservable resource has invalid pricing');
      }

      const approved = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: actorId,
        },
        select: adminReservationSelect,
      });

      try {
        await tx.financialCharge.create({
          data: {
            reservationId: reservation.id,
            amount: price,
          },
        });
      } catch (error) {
        if (isChargeUniqueConstraintViolation(error)) {
          throw new ConflictException(
            'Reservation already has a financial charge',
          );
        }
        throw error;
      }

      return approved;
    });
  }

  async reject(id: number, rejectionReason: string, actorId: number) {
    return this.withSerializableTransaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
        select: { id: true, status: true },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new ConflictException('Only pending reservations can be rejected');
      }

      const result = await tx.reservation.updateMany({
        where: { id, status: ReservationStatus.PENDING },
        data: {
          status: ReservationStatus.REJECTED,
          rejectionReason,
        },
      });
      if (result.count === 0) {
        throw new ConflictException('Only pending reservations can be rejected');
      }

      return tx.reservation.findUniqueOrThrow({
        where: { id },
        select: adminReservationSelect,
      });
    });
  }

  async cancel(id: number) {
    return this.withSerializableTransaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
        select: { id: true, status: true },
      });
      if (!reservation) throw new NotFoundException('Reservation not found');

      assertReservationTransition(
        reservation.status,
        ReservationStatus.CANCELLED,
      );

      const charge = await tx.financialCharge.findUnique({
        where: { reservationId: reservation.id },
        select: { id: true, status: true },
      });
      if (charge?.status === FinancialChargeStatus.PAID) {
        throw new ConflictException(
          'Paid reservation requires financial reconciliation before cancellation',
        );
      }
      if (charge?.status === FinancialChargeStatus.PENDING) {
        await tx.financialCharge.update({
          where: { id: charge.id },
          data: { status: FinancialChargeStatus.CANCELLED },
        });
      }

      return tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        select: adminReservationSelect,
      });
    });
  }

  private assertTimeRange(startAt: Date, endAt: Date) {
    if (endAt <= startAt) {
      throw new BadRequestException('End date must be after start date');
    }
    if (startAt < new Date()) {
      throw new BadRequestException('Reservation start date cannot be in the past');
    }
    const duration = endAt.getTime() - startAt.getTime();
    if (duration < 60 * 60 * 1000) {
      throw new BadRequestException('Reservation duration must be at least one hour');
    }
    if (duration > 12 * 60 * 60 * 1000) {
      throw new BadRequestException('Reservation duration cannot exceed twelve hours');
    }
  }

  private async requireActiveResource(
    client: Pick<ReservationTransaction, 'reservableResource'> | PrismaService,
    id: number,
  ) {
    const resource = await client.reservableResource.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!resource) throw new NotFoundException('Reservable resource not found');
    if (resource.status !== ReservableResourceStatus.ACTIVE) {
      throw new ConflictException('Reservable resource is inactive');
    }
  }

  private async requireEvent(tx: ReservationTransaction, id: number) {
    const event = await tx.event.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!event) throw new NotFoundException('Event not found');
  }

  private findBlockingReservation(
    client: Pick<ReservationTransaction, 'reservation'> | PrismaService,
    resourceId: number,
    startAt: Date,
    endAt: Date,
  ) {
    return client.reservation.findFirst({
      where: {
        resourceId,
        status: { in: [...BLOCKING_STATUSES] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
  }

  private findBlockingReservationExcluding(
    client: Pick<ReservationTransaction, 'reservation'> | PrismaService,
    resourceId: number,
    startAt: Date,
    endAt: Date,
    excludeId: number,
  ) {
    return client.reservation.findFirst({
      where: {
        id: { not: excludeId },
        resourceId,
        status: { in: [...BLOCKING_STATUSES] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
  }

  private async withSerializableTransaction<T>(
    work: (tx: ReservationTransaction) => Promise<T>,
  ): Promise<T> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (!isSerializationConflict(error)) throw error;
        if (attempt === maxAttempts) {
          throw new ConflictException('Resource is no longer available');
        }
      }
    }
    throw new Error('Reservation transaction retry exhausted.');
  }
}

function isSerializationConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

function isChargeUniqueConstraintViolation(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }
  const target = error.meta?.target;
  return (
    Array.isArray(target) &&
    target.some((entry) => String(entry) === 'reservationId')
  );
}

function parseCostaRicaDayStart(value: string): Date {
  const parts = parseCostaRicaCalendarDay(value);
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 6, 0, 0, 0),
  );
}

function parseCostaRicaExclusiveDayEnd(value: string): Date {
  const parts = parseCostaRicaCalendarDay(value);
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + 1, 6, 0, 0, 0),
  );
}

function parseCostaRicaCalendarDay(value: string) {
  const match = COSTA_RICA_DAY_PATTERN.exec(value);
  if (!match) {
    throw new BadRequestException('Date filters must use YYYY-MM-DD format');
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day, 6, 0, 0, 0));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new BadRequestException('Date filters must contain valid calendar dates');
  }

  return { year, month, day };
}
