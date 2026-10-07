import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
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
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { CreateFinancialMovementDto } from './dto/create-financial-movement.dto';
import { QueryFinancialMovementSummaryDto } from './dto/query-financial-movement-summary.dto';
import { QueryFinancialMovementsDto } from './dto/query-financial-movements.dto';
import { FinancialMovementFiltersDto } from './dto/financial-movement-filters.dto';
import { QueryFinancialChargesDto } from './dto/query-financial-charges.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

const chargeListSelect = {
  id: true,
  reservationId: true,
  amount: true,
  currency: true,
  status: true,
  dueAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FinancialChargeSelect;

const paymentSelect = {
  id: true,
  chargeId: true,
  amount: true,
  status: true,
  legacyMethod: true,
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
  legacySource: true,
  status: true,
  amount: true,
  currency: true,
  description: true,
  reference: true,
  occurredAt: true,
  legacySourceId: true,
  recordedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FinancialMovementSelect;

const financialMovementDetailSelect = {
  ...financialMovementSelect,
  recordedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.FinancialMovementSelect;

const PAYMENT_METHOD_BY_FINANCIAL_METHOD: Partial<
  Record<FinancialMethod, PaymentMethod>
> = {
  [FinancialMethod.CASH]: PaymentMethod.CASH,
  [FinancialMethod.BANK_TRANSFER]: PaymentMethod.BANK_TRANSFER,
  [FinancialMethod.SINPE_MOVIL]: PaymentMethod.SINPE_MOVIL,
  [FinancialMethod.OTHER]: PaymentMethod.OTHER,
};

type FinancialTransaction = Pick<
  Prisma.TransactionClient,
  'financialCharge' | 'payment' | 'financialMovement'
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
    return {
      ...charge,
      payments: charge.payments.map(({ legacyMethod, ...payment }) => ({
        ...payment,
        method: legacyMethod,
      })),
      balance:
        charge.status === FinancialChargeStatus.PENDING
          ? charge.amount.toFixed(2)
          : '0.00',
    };
  }

  async recordPayment(id: number, dto: RecordPaymentDto, actorId: number) {
    const amount = this.parseAmount(dto.amount);
    const reference = this.normalizeReference(dto.reference);
    return this.withSerializableTransaction(async (tx) => {
      const charge = await tx.financialCharge.findUnique({
        where: { id },
        select: {
          id: true,
          reservationId: true,
          amount: true,
          currency: true,
          status: true,
        },
      });
      if (!charge) throw new NotFoundException('Financial charge not found');
      if (charge.status !== FinancialChargeStatus.PENDING) {
        throw new ConflictException(
          'El cargo financiero no está pendiente de pago',
        );
      }
      if (!charge.amount.greaterThan(0)) {
        throw new ConflictException(
          'El cargo financiero no tiene un balance pendiente mayor que cero',
        );
      }
      if (charge.currency !== 'CRC') {
        throw new ConflictException(
          'La moneda del cargo financiero no está soportada',
        );
      }
      if (!amount.equals(charge.amount)) {
        throw new ConflictException(
          'El monto del pago debe ser exactamente igual al balance pendiente',
        );
      }

      const paidAt = new Date();
      const payment = await tx.payment.create({
        data: {
          chargeId: charge.id,
          amount,
          status: PaymentStatus.CONFIRMED,
          legacyMethod: dto.method,
          financialMethod: dto.method as FinancialMethod,
          reference,
          paidAt,
          recordedById: actorId,
        },
        select: paymentSelect,
      });
      const updatedCharge = await tx.financialCharge.update({
        where: { id: charge.id },
        data: { status: FinancialChargeStatus.PAID },
        select: chargeListSelect,
      });
      const movement = await tx.financialMovement.create({
        data: {
          type: FinancialMovementType.INCOME,
          legacySource: FinancialMovementSource.RESERVATION_PAYMENT,
          legacySourceId: payment.id,
          originType: FinancialMovementOriginType.PAYMENT,
          status: FinancialMovementStatus.POSTED,
          amount,
          currency: charge.currency,
          description: `Pago de reserva #${charge.reservationId}`,
          reference,
          occurredAt: paidAt,
          recordedById: actorId,
        },
        select: financialMovementSelect,
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: { movementId: movement.id },
        select: { id: true },
      });

      return {
        payment: this.serializePayment(payment),
        charge: { ...updatedCharge, balance: '0.00' },
      };
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
        legacySource: FinancialMovementSource.MANUAL,
        legacySourceId: null,
        originType: FinancialMovementOriginType.MANUAL,
        status: FinancialMovementStatus.POSTED,
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
    const [totals, paymentGroups] = await Promise.all([
      this.prisma.financialMovement.groupBy({
        by: ['type', 'legacySource'],
        orderBy: [{ legacySource: 'asc' }, { type: 'asc' }],
        where: this.movementWhere(query, true),
        _sum: { amount: true },
        _count: { _all: true },
      }),
      query.type === FinancialMovementType.EXPENSE
        ? Promise.resolve([])
        : this.prisma.payment.groupBy({
            by: ['legacyMethod'],
            orderBy: { legacyMethod: 'asc' },
            where: {
              status: PaymentStatus.CONFIRMED,
              ...(query.method
                ? {
                    OR: [
                      { financialMethod: query.method },
                      ...(PAYMENT_METHOD_BY_FINANCIAL_METHOD[query.method]
                        ? [
                            {
                              legacyMethod:
                                PAYMENT_METHOD_BY_FINANCIAL_METHOD[
                                  query.method
                                ],
                            },
                          ]
                        : []),
                    ],
                  }
                : {}),
              paidAt: { not: null, ...this.dateRange(query) },
              movement: {
                is: {
                  type: FinancialMovementType.INCOME,
                  status: query.status,
                  AND: [
                    ...(query.search
                      ? [
                          {
                            OR: [
                              {
                                description: {
                                  contains: query.search,
                                  mode: 'insensitive' as const,
                                },
                              },
                              {
                                reference: {
                                  contains: query.search,
                                  mode: 'insensitive' as const,
                                },
                              },
                            ],
                          },
                        ]
                      : []),
                    {
                      OR: [
                        {
                          status: {
                            not: FinancialMovementStatus.VOIDED,
                          },
                        },
                        { status: null },
                      ],
                    },
                  ],
                },
              },
            },
            _sum: { amount: true },
            _count: { _all: true },
          }),
    ]);
    let totalIncome = new Prisma.Decimal(0);
    let totalExpenses = new Prisma.Decimal(0);
    let incomeCount = 0;
    let expenseCount = 0;
    let confirmedPaymentTotal = new Prisma.Decimal(0);
    let confirmedPaymentCount = 0;
    const sourceTotals = new Map<
      FinancialMovementSource,
      {
        incomeTotal: Prisma.Decimal;
        incomeCount: number;
        expenseTotal: Prisma.Decimal;
        expenseCount: number;
      }
    >();

    for (const total of totals) {
      const amount = total._sum.amount ?? new Prisma.Decimal(0);
      const source = sourceTotals.get(total.legacySource) ?? {
        incomeTotal: new Prisma.Decimal(0),
        incomeCount: 0,
        expenseTotal: new Prisma.Decimal(0),
        expenseCount: 0,
      };
      if (total.type === FinancialMovementType.INCOME) {
        totalIncome = totalIncome.plus(amount);
        incomeCount += total._count._all;
        source.incomeTotal = source.incomeTotal.plus(amount);
        source.incomeCount += total._count._all;
      } else if (total.type === FinancialMovementType.EXPENSE) {
        totalExpenses = totalExpenses.plus(amount);
        expenseCount += total._count._all;
        source.expenseTotal = source.expenseTotal.plus(amount);
        source.expenseCount += total._count._all;
      }
      sourceTotals.set(total.legacySource, source);
    }

    const paymentsByMethod = paymentGroups.map((group) => {
      const amount = group._sum.amount ?? new Prisma.Decimal(0);
      confirmedPaymentTotal = confirmedPaymentTotal.plus(amount);
      confirmedPaymentCount += group._count._all;
      return {
        method: group.legacyMethod,
        total: amount.toFixed(2),
        count: group._count._all,
      };
    });

    return {
      currency: 'CRC',
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      balance: totalIncome.minus(totalExpenses).toFixed(2),
      incomeCount,
      expenseCount,
      movementCount: incomeCount + expenseCount,
      incomeAverage:
        incomeCount === 0
          ? '0.00'
          : totalIncome.dividedBy(incomeCount).toFixed(2),
      expenseAverage:
        expenseCount === 0
          ? '0.00'
          : totalExpenses.dividedBy(expenseCount).toFixed(2),
      bySource: Array.from(sourceTotals, ([source, values]) => ({
        source,
        incomeTotal: values.incomeTotal.toFixed(2),
        incomeCount: values.incomeCount,
        expenseTotal: values.expenseTotal.toFixed(2),
        expenseCount: values.expenseCount,
      })),
      confirmedPayments: {
        total: confirmedPaymentTotal.toFixed(2),
        count: confirmedPaymentCount,
        byMethod: paymentsByMethod,
      },
    };
  }

  private movementWhere(
    query: FinancialMovementFiltersDto,
    excludeVoided = false,
  ): Prisma.FinancialMovementWhereInput {
    const and: Prisma.FinancialMovementWhereInput[] = [];
    if (query.search) {
      and.push({
        OR: [
          {
            description: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            reference: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }
    if (query.method) {
      const paymentMethod = PAYMENT_METHOD_BY_FINANCIAL_METHOD[query.method];
      and.push({
        OR: [
          { payment: { is: { financialMethod: query.method } } },
          ...(paymentMethod
            ? [{ payment: { is: { legacyMethod: paymentMethod } } }]
            : []),
          { disbursement: { is: { method: query.method } } },
          { originalDonation: { is: { financialMethod: query.method } } },
          ...(paymentMethod
            ? [
                {
                  originalDonation: {
                    is: { legacyMethod: paymentMethod },
                  },
                },
              ]
            : []),
        ],
      });
    }
    if (excludeVoided) {
      and.push({
        OR: [
          { status: { not: FinancialMovementStatus.VOIDED } },
          { status: null },
        ],
      });
    }

    return {
      type: query.type,
      status: query.status,
      occurredAt:
        query.dateFrom || query.dateTo ? this.dateRange(query) : undefined,
      AND: and.length > 0 ? and : undefined,
    };
  }

  private dateRange(
    query: Pick<FinancialMovementFiltersDto, 'dateFrom' | 'dateTo'>,
  ) {
    const isDateOnly =
      query.dateTo !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(query.dateTo);
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    if (isDateOnly && dateTo) {
      dateTo.setUTCDate(dateTo.getUTCDate() + 1);
    }
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    if (dateFrom && dateTo) {
      const inclusiveDateTo = isDateOnly
        ? dateTo.getTime() - 1
        : dateTo.getTime();
      if (dateFrom.getTime() > inclusiveDateTo) {
        throw new BadRequestException(
          'La fecha inicial debe ser anterior o igual a la fecha final',
        );
      }
    }

    return {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(query.dateTo ? (isDateOnly ? { lt: dateTo } : { lte: dateTo }) : {}),
    };
  }

  private serializeMovement<T extends { amount: Prisma.Decimal }>(movement: T) {
    const { legacySource, legacySourceId, ...rest } = movement as T & {
      legacySource?: FinancialMovementSource;
      legacySourceId?: number | null;
    };
    return {
      ...rest,
      ...(legacySource !== undefined ? { source: legacySource } : {}),
      ...(legacySourceId !== undefined ? { sourceId: legacySourceId } : {}),
      amount: movement.amount.toFixed(2),
    };
  }

  private serializePayment<T extends { legacyMethod: unknown }>(payment: T) {
    const { legacyMethod, ...rest } = payment;
    return { ...rest, method: legacyMethod };
  }

  private parseAmount(value: unknown): Prisma.Decimal {
    if (
      typeof value !== 'string' ||
      !/^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)
    ) {
      throw new BadRequestException(
        'El monto del pago debe ser positivo y tener hasta dos decimales',
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
