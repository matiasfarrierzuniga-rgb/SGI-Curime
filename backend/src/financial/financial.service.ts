import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FinancialChargeStatus,
  PaymentStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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

type FinancialTransaction = Pick<
  Prisma.TransactionClient,
  'financialCharge' | 'payment'
>;

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

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
    return {
      data: data.map((charge) => this.withBalance(charge)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(id: number) {
    const charge = await this.prisma.financialCharge.findUnique({
      where: { id },
      select: chargeDetailSelect,
    });
    if (!charge) throw new NotFoundException('Financial charge not found');
    return this.withBalance(charge);
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
      const balance = this.balanceFor(charge.status, charge.amount);
      if (!amount.equals(balance)) {
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

      return { payment, charge: this.withBalance(updatedCharge) };
    });
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
    const amount = new Prisma.Decimal(value);
    if (amount.lte(0)) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
    return amount;
  }

  private normalizeReference(reference: string | undefined): string | null {
    const normalized = reference?.trim();
    return normalized || null;
  }

  private withBalance<T extends { amount: Prisma.Decimal; status: FinancialChargeStatus }>(
    charge: T,
  ) {
    return { ...charge, balance: this.balanceFor(charge.status, charge.amount) };
  }

  private balanceFor(status: FinancialChargeStatus, amount: Prisma.Decimal) {
    return status === FinancialChargeStatus.PENDING
      ? amount
      : new Prisma.Decimal(0);
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
