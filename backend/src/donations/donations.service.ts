import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  DonationStatus,
  FinancialMovementSource,
  FinancialMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CancelDonationDto } from './dto/cancel-donation.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { QueryDonationsDto } from './dto/query-donations.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';

const donationSelect = {
  id: true,
  donorName: true,
  donorIdentification: true,
  amount: true,
  currency: true,
  method: true,
  reference: true,
  description: true,
  receivedAt: true,
  status: true,
  recordedById: true,
  originalMovementId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DonationSelect;

const donationListSelect = {
  id: true,
  donorName: true,
  donorIdentification: true,
  amount: true,
  currency: true,
  method: true,
  reference: true,
  receivedAt: true,
  status: true,
  recordedById: true,
  cancelledById: true,
  cancelledAt: true,
  cancellationReason: true,
  originalMovementId: true,
  reversalMovementId: true,
  createdAt: true,
  updatedAt: true,
  recordedBy: { select: { id: true, fullName: true } },
  cancelledBy: { select: { id: true, fullName: true } },
} satisfies Prisma.DonationSelect;

const donationDetailSelect = {
  ...donationListSelect,
  description: true,
  originalMovement: { select: { id: true } },
} satisfies Prisma.DonationSelect;

const donationCancellationSelect = {
  ...donationSelect,
  cancelledById: true,
  cancelledAt: true,
  cancellationReason: true,
  reversalMovementId: true,
} satisfies Prisma.DonationSelect;

const donationDeletionSelect = {
  ...donationSelect,
  reversalMovementId: true,
} satisfies Prisma.DonationSelect;

@Injectable()
export class DonationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateDonationDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const amount = this.parseAmount(dto.amount);
    const receivedAt = this.parseReceivedAt(dto.receivedAt);

    const donation = await this.prisma.$transaction(async (tx) => {
      const createdDonation = await tx.donation.create({
        data: {
          donorName: this.normalizeOptionalString(dto.donorName),
          donorIdentification: this.normalizeOptionalString(
            dto.donorIdentification,
          ),
          amount,
          currency: 'CRC',
          method: dto.method,
          reference: this.normalizeOptionalString(dto.reference),
          description: this.normalizeOptionalString(dto.description),
          receivedAt,
          status: DonationStatus.CONFIRMED,
          recordedById: actorId,
          originalMovementId: null,
        },
        select: donationSelect,
      });

      const movement = await tx.financialMovement.create({
        data: {
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.DONATION,
          sourceId: createdDonation.id,
          amount,
          currency: 'CRC',
          description: 'Donación recibida',
          reference: this.normalizeOptionalString(dto.reference),
          occurredAt: receivedAt,
          recordedById: actorId,
        },
        select: { id: true },
      });

      const updatedDonation = await tx.donation.update({
        where: { id: createdDonation.id },
        data: { originalMovementId: movement.id },
        select: donationSelect,
      });

      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.DONATION_CREATED,
          module: 'DONATIONS',
          entityType: 'Donation',
          entityId: updatedDonation.id,
          details: {
            amount: updatedDonation.amount.toFixed(2),
            method: updatedDonation.method,
            originalMovementId: movement.id,
          },
          ...context,
        },
        tx,
      );

      return updatedDonation;
    });

    return this.serializeDonation(donation);
  }

  async findAll(query: QueryDonationsDto) {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException('INVALID_DONATION_DATE_RANGE');
    }

    const search = this.normalizeOptionalString(query.search) ?? undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.DonationWhereInput = {
      status: query.status,
      method: query.method,
      receivedAt:
        dateFrom || dateTo
          ? {
              gte: dateFrom,
              lte: dateTo,
            }
          : undefined,
      OR: search
        ? [
            { donorName: { contains: search, mode: 'insensitive' } },
            {
              donorIdentification: {
                contains: search,
                mode: 'insensitive',
              },
            },
            { reference: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where,
        select: donationListSelect,
        orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.donation.count({ where }),
    ]);

    return {
      data: data.map((donation) => this.serializeDonation(donation)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      select: donationDetailSelect,
    });
    if (!donation) throw new NotFoundException('DONATION_NOT_FOUND');
    if (!donation.originalMovementId || !donation.originalMovement) {
      throw new InternalServerErrorException(
        'DONATION_ORIGINAL_MOVEMENT_MISSING',
      );
    }

    const { originalMovement: _originalMovement, ...detail } = donation;
    return this.serializeDonation(detail);
  }

  async update(
    id: number,
    dto: UpdateDonationDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const amount = dto.amount === undefined ? undefined : this.parseAmount(dto.amount);
    const receivedAt =
      dto.receivedAt === undefined
        ? undefined
        : this.parseReceivedAt(dto.receivedAt);

    const donation = await this.prisma.$transaction(async (tx) => {
      const current = await tx.donation.findUnique({
        where: { id },
        select: donationSelect,
      });
      if (!current) throw new NotFoundException('DONATION_NOT_FOUND');
      if (current.status === DonationStatus.CANCELLED) {
        throw new ConflictException('CANCELLED_DONATION_CANNOT_BE_EDITED');
      }

      const data: Prisma.DonationUpdateInput = {};
      const changedFields: string[] = [];
      this.assignUpdatedString(data, changedFields, 'donorName', dto.donorName, current.donorName);
      this.assignUpdatedString(
        data,
        changedFields,
        'donorIdentification',
        dto.donorIdentification,
        current.donorIdentification,
      );
      this.assignUpdatedValue(data, changedFields, 'method', dto.method, current.method);
      this.assignUpdatedString(data, changedFields, 'reference', dto.reference, current.reference);
      this.assignUpdatedString(
        data,
        changedFields,
        'description',
        dto.description,
        current.description,
      );
      if (amount && !amount.equals(current.amount)) {
        data.amount = amount;
        changedFields.push('amount');
      }
      if (receivedAt && receivedAt.getTime() !== current.receivedAt.getTime()) {
        data.receivedAt = receivedAt;
        changedFields.push('receivedAt');
      }

      const financialChanged = changedFields.includes('amount') || changedFields.includes('receivedAt');
      if (financialChanged) {
        if (!current.originalMovementId) {
          throw new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_MISSING');
        }
        const originalMovement = await tx.financialMovement.findUnique({
          where: { id: current.originalMovementId },
          select: { id: true, type: true, source: true, sourceId: true },
        });
        if (
          !originalMovement ||
          originalMovement.type !== FinancialMovementType.INCOME ||
          originalMovement.source !== FinancialMovementSource.DONATION ||
          originalMovement.sourceId !== current.id
        ) {
          throw new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_INVALID');
        }
      }

      const updatedDonation = await tx.donation.update({
        where: { id },
        data,
        select: donationSelect,
      });

      if (financialChanged) {
        await tx.financialMovement.update({
          where: { id: current.originalMovementId! },
          data: {
            amount: data.amount as Prisma.Decimal | undefined,
            occurredAt: data.receivedAt as Date | undefined,
          },
        });
      }

      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.DONATION_UPDATED,
          module: 'DONATIONS',
          entityType: 'Donation',
          entityId: updatedDonation.id,
          details: { changedFields },
          ...context,
        },
        tx,
      );

      return updatedDonation;
    });

    return this.serializeDonation(donation);
  }

  async cancel(
    id: number,
    dto: CancelDonationDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const cancellationReason = dto.cancellationReason.trim();
    if (!cancellationReason) {
      throw new BadRequestException('INVALID_DONATION_CANCELLATION_REASON');
    }

    const donation = await this.withSerializableTransaction(async (tx) => {
      const current = await tx.donation.findUnique({
        where: { id },
        select: donationSelect,
      });
      if (!current) throw new NotFoundException('DONATION_NOT_FOUND');
      if (current.status !== DonationStatus.CONFIRMED) {
        throw new ConflictException('DONATION_ALREADY_CANCELLED');
      }
      if (!current.originalMovementId) {
        throw new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_MISSING');
      }

      const originalMovement = await tx.financialMovement.findUnique({
        where: { id: current.originalMovementId },
        select: {
          id: true,
          type: true,
          source: true,
          sourceId: true,
          amount: true,
          currency: true,
        },
      });
      if (
        !originalMovement ||
        originalMovement.type !== FinancialMovementType.INCOME ||
        originalMovement.source !== FinancialMovementSource.DONATION ||
        originalMovement.sourceId !== current.id ||
        !originalMovement.amount.equals(current.amount) ||
        originalMovement.currency !== current.currency
      ) {
        throw new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_INVALID');
      }

      const cancelledAt = new Date();
      const reversal = await tx.financialMovement.create({
        data: {
          type: FinancialMovementType.EXPENSE,
          source: FinancialMovementSource.DONATION,
          sourceId: current.id,
          amount: originalMovement.amount,
          currency: originalMovement.currency,
          description: `Reversión de donación #${current.id}`,
          occurredAt: cancelledAt,
          recordedById: actorId,
        },
        select: { id: true },
      });

      const cancelledDonation = await tx.donation.update({
        where: { id: current.id },
        data: {
          status: DonationStatus.CANCELLED,
          cancelledAt,
          cancelledById: actorId,
          cancellationReason,
          reversalMovementId: reversal.id,
        },
        select: donationCancellationSelect,
      });

      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.DONATION_CANCELLED,
          module: 'DONATIONS',
          entityType: 'Donation',
          entityId: cancelledDonation.id,
          details: {
            amount: originalMovement.amount.toFixed(2),
            originalMovementId: originalMovement.id,
            reversalMovementId: reversal.id,
          },
          ...context,
        },
        tx,
      );

      return cancelledDonation;
    });

    return this.serializeDonation(donation);
  }

  async remove(
    id: number,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.withSerializableTransaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id },
        select: donationDeletionSelect,
      });
      if (!donation) throw new NotFoundException('DONATION_NOT_FOUND');
      if (donation.status !== DonationStatus.CONFIRMED) {
        throw new ConflictException('CANCELLED_DONATION_CANNOT_BE_DELETED');
      }
      if (donation.reversalMovementId) {
        throw new ConflictException('DONATION_HAS_FINANCIAL_EFFECTS');
      }
      if (!donation.originalMovementId) {
        throw new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_MISSING');
      }

      const originalMovement = await tx.financialMovement.findUnique({
        where: { id: donation.originalMovementId },
        select: {
          id: true,
          type: true,
          source: true,
          sourceId: true,
          amount: true,
          currency: true,
        },
      });
      if (
        !originalMovement ||
        originalMovement.type !== FinancialMovementType.INCOME ||
        originalMovement.source !== FinancialMovementSource.DONATION ||
        originalMovement.sourceId !== donation.id ||
        !originalMovement.amount.equals(donation.amount) ||
        originalMovement.currency !== donation.currency
      ) {
        throw new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_INVALID');
      }

      const donationMovements = await tx.financialMovement.findMany({
        where: {
          source: FinancialMovementSource.DONATION,
          sourceId: donation.id,
        },
        select: { id: true },
      });
      if (
        donationMovements.length !== 1 ||
        donationMovements[0].id !== donation.originalMovementId
      ) {
        throw new ConflictException('DONATION_HAS_FINANCIAL_EFFECTS');
      }

      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.DONATION_DELETED,
          module: 'DONATIONS',
          entityType: 'Donation',
          entityId: donation.id,
          details: {
            amount: donation.amount.toFixed(2),
            method: donation.method,
            originalMovementId: originalMovement.id,
          },
          ...context,
        },
        tx,
      );

      await tx.donation.delete({ where: { id: donation.id } });
      await tx.financialMovement.delete({ where: { id: originalMovement.id } });
    });

    return { deleted: true, id };
  }

  private parseAmount(value: unknown): Prisma.Decimal {
    if (
      typeof value !== 'string' ||
      !/^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)
    ) {
      throw new BadRequestException('INVALID_DONATION_AMOUNT');
    }
    return new Prisma.Decimal(value);
  }

  private parseReceivedAt(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new BadRequestException('INVALID_DONATION_RECEIVED_AT');
    }
    const receivedAt = new Date(value);
    if (Number.isNaN(receivedAt.getTime())) {
      throw new BadRequestException('INVALID_DONATION_RECEIVED_AT');
    }
    return receivedAt;
  }

  private normalizeOptionalString(value: string | undefined): string | null {
    const normalized = value?.trim();
    return normalized || null;
  }

  private assignUpdatedString(
    data: Prisma.DonationUpdateInput,
    changedFields: string[],
    field: 'donorName' | 'donorIdentification' | 'reference' | 'description',
    value: string | undefined,
    currentValue: string | null,
  ) {
    if (value === undefined) return;
    const normalized = this.normalizeOptionalString(value);
    if (normalized !== currentValue) {
      data[field] = normalized;
      changedFields.push(field);
    }
  }

  private assignUpdatedValue<T extends keyof Pick<Prisma.DonationUpdateInput, 'method'>>(
    data: Prisma.DonationUpdateInput,
    changedFields: string[],
    field: T,
    value: Prisma.DonationUpdateInput[T] | undefined,
    currentValue: Prisma.DonationUpdateInput[T],
  ) {
    if (value !== undefined && value !== currentValue) {
      data[field] = value;
      changedFields.push(field);
    }
  }

  private async withSerializableTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
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
          throw new ConflictException('DONATION_CANCELLATION_CONFLICT');
        }
      }
    }
    throw new Error('Donation cancellation retry exhausted.');
  }

  private serializeDonation<T extends { amount: Prisma.Decimal }>(
    donation: T,
  ): Omit<T, 'amount'> & { amount: string } {
    return { ...donation, amount: donation.amount.toFixed(2) };
  }
}

function isSerializationConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}
