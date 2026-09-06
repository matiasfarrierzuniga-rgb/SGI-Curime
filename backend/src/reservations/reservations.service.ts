import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReservableResourceStatus, ReservationStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationAvailabilityDto } from './dto/query-reservation-availability.dto';

const BLOCKING_STATUSES = [
  ReservationStatus.PENDING,
  ReservationStatus.APPROVED,
  ReservationStatus.CONFIRMED,
] as const;

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

type ReservationTransaction = Pick<
  Prisma.TransactionClient,
  'reservableResource' | 'reservation' | 'event'
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
