import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  FinancialChargeStatus,
  FinancialMovementSource,
  FinancialMovementType,
  PaymentStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { CreateFinancialMovementDto } from './dto/create-financial-movement.dto';
import { QueryFinancialMovementSummaryDto } from './dto/query-financial-movement-summary.dto';
import { QueryFinancialMovementsDto } from './dto/query-financial-movements.dto';
import { QueryFinancialChargesDto } from './dto/query-financial-charges.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

const chargeListSelect = {
  id: true,
  reservationId: true,
  amount: true,
  currency: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FinancialChargeSelect;

const paymentSelect = {
  id: true,
  chargeId: true,
  amount: true,
  status: true,
  method: true,
  reference: true,
  paidAt: true,
  recordedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PaymentSelect;

const chargeDetailSelect = {
  ...chargeListSelect,
  payments: { select: paymentSelect, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.FinancialChargeSelect;

const financialMovementSelect = {
  id: true,
  type: true,
  source: true,
  amount: true,
  currency: true,
  description: true,
  reference: true,
  occurredAt: true,
  sourceId: true,
  recordedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FinancialMovementSelect;

const financialMovementDetailSelect = {
  ...financialMovementSelect,
  recordedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.FinancialMovementSelect;

type FinancialTransaction = Pick<
  Prisma.TransactionClient,
  'financialCharge' | 'payment'
>;

@Injectable()
export class FinancialService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async findAll(query: QueryFinancialChargesDto) {
    const where: Prisma.FinancialChargeWhereInput = {
      status: query.status,
      reservationId: query.reservationId,
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.financialCharge.findMany({
        where,
        select: chargeListSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.financialCharge.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const charge = await this.prisma.financialCharge.findUnique({
      where: { id },
      select: chargeDetailSelect,
    });
    if (!charge) throw new NotFoundException('Financial charge not found');
    return charge;
  }

  async recordPayment(id: number, dto: RecordPaymentDto, actorId: number) {
    const amount = this.parseAmount(dto.amount);
    return this.withSerializableTransaction(async (tx) => {
      const charge = await tx.financialCharge.findUnique({
        where: { id },
        select: { id: true, amount: true, currency: true, status: true },
      });
      if (!charge) throw new NotFoundException('Financial charge not found');
      if (charge.status !== FinancialChargeStatus.PENDING) {
        throw new ConflictException('Financial charge is not pending');
      }
      if (charge.currency !== 'CRC') {
        throw new ConflictException('Financial charge currency is not supported');
      }
      if (!amount.equals(charge.amount)) {
        throw new ConflictException('Payment amount must match financial charge amount');
      }

      const payment = await tx.payment.create({
        data: {
          chargeId: charge.id,
          amount,
          status: PaymentStatus.CONFIRMED,
          method: dto.method,
          reference: this.normalizeReference(dto.reference),
          paidAt: new Date(),
          recordedById: actorId,
        },
        select: paymentSelect,
      });
      const updatedCharge = await tx.financialCharge.update({
        where: { id: charge.id },
        data: { status: FinancialChargeStatus.PAID },
        select: chargeListSelect,
      });

      return { payment, charge: updatedCharge };
    });
  }

  async createMovement(
    dto: CreateFinancialMovementDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const created = await this.prisma.financialMovement.create({
      data: {
        type: dto.type,
        source: FinancialMovementSource.MANUAL,
        sourceId: null,
        amount: new Prisma.Decimal(dto.amount),
        currency: 'CRC',
        description: dto.description.trim(),
        reference: this.normalizeReference(dto.reference),
        occurredAt: new Date(dto.occurredAt),
        recordedById: actorId,
      },
      select: financialMovementSelect,
    });

    await this.audit?.log({
      userId: actorId,
      action: AuditAction.FINANCIAL_MOVEMENT_CREATED,
      module: 'FINANCIAL',
      entityType: 'FinancialMovement',
      entityId: created.id,
      details: {
        movementId: created.id,
        type: created.type,
        amount: created.amount.toFixed(2),
        occurredAt: created.occurredAt,
      },
      ...context,
    });

    return this.serializeMovement(created);
  }

  async findMovements(query: QueryFinancialMovementsDto) {
    const where = this.movementWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.financialMovement.findMany({
        where,
        select: financialMovementSelect,
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.financialMovement.count({ where }),
    ]);

    return {
      data: data.map((movement) => this.serializeMovement(movement)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findMovement(id: number) {
    const movement = await this.prisma.financialMovement.findUnique({
      where: { id },
      select: financialMovementDetailSelect,
    });
    if (!movement) {
      throw new NotFoundException('Financial movement not found');
    }
    return this.serializeMovement(movement);
  }

  async summarizeMovements(query: QueryFinancialMovementSummaryDto) {
    const totals = await this.prisma.financialMovement.groupBy({
      by: ['type'],
      where: this.movementWhere(query),
      _sum: { amount: true },
    });
    let totalIncome = new Prisma.Decimal(0);
    let totalExpenses = new Prisma.Decimal(0);

    for (const total of totals) {
      const amount = total._sum.amount ?? new Prisma.Decimal(0);
      if (total.type === FinancialMovementType.INCOME) {
        totalIncome = amount;
      } else if (total.type === FinancialMovementType.EXPENSE) {
        totalExpenses = amount;
      }
    }

    return {
      currency: 'CRC',
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      balance: totalIncome.minus(totalExpenses).toFixed(2),
    };
  }

  private movementWhere(query: {
    type?: FinancialMovementType;
    dateFrom?: string;
    dateTo?: string;
  }): Prisma.FinancialMovementWhereInput {
    return {
      type: query.type,
      occurredAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
            }
          : undefined,
    };
  }

  private serializeMovement<T extends { amount: Prisma.Decimal }>(
    movement: T,
  ): Omit<T, 'amount'> & { amount: string } {
    return { ...movement, amount: movement.amount.toFixed(2) };
  }

  private parseAmount(value: unknown): Prisma.Decimal {
    if (
      typeof value !== 'string' ||
      !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)
    ) {
      throw new BadRequestException(
        'Payment amount must be a valid decimal with up to two decimal places',
      );
    }
    return new Prisma.Decimal(value);
  }

  private normalizeReference(reference: string | undefined): string | null {
    const normalized = reference?.trim();
    return normalized || null;
  }

  private async withSerializableTransaction<T>(
    work: (tx: FinancialTransaction) => Promise<T>,
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
          throw new ConflictException('Financial charge payment conflict');
        }
      }
    }
    throw new Error('Financial transaction retry exhausted.');
  }
}

function isSerializationConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}
