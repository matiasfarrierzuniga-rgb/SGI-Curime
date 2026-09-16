import { Injectable } from '@nestjs/common';
import {
  FinancialMovementSource,
  FinancialMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildReportMetadata,
  type ReportGeneratedBy,
} from '../reporting/report-metadata';

type AnnualGroup = {
  type: FinancialMovementType;
  source: FinancialMovementSource;
  _sum: { amount: Prisma.Decimal | null };
  _count: { _all: number };
};

type MovementSummary = {
  total: Prisma.Decimal;
  count: number;
  bySource: Partial<
    Record<FinancialMovementSource, { total: Prisma.Decimal; count: number }>
  >;
};

@Injectable()
export class DinadecoReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async annual(year: number, generatedBy: ReportGeneratedBy) {
    const from = new Date(Date.UTC(year, 0, 1));
    const to = new Date(Date.UTC(year + 1, 0, 1));
    const [openingGroups, annualGroups] = await this.prisma.$transaction([
      this.prisma.financialMovement.groupBy({
        by: ['type'],
        orderBy: { type: 'asc' },
        where: { occurredAt: { lt: from } },
        _sum: { amount: true },
      }),
      this.prisma.financialMovement.groupBy({
        by: ['type', 'source'],
        orderBy: [{ type: 'asc' }, { source: 'asc' }],
        where: { occurredAt: { gte: from, lt: to } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    let openingIncome = new Prisma.Decimal(0);
    let openingExpenses = new Prisma.Decimal(0);
    for (const group of openingGroups as Array<{
      type: FinancialMovementType;
      _sum: { amount: Prisma.Decimal | null };
    }>) {
      const amount = group._sum.amount ?? new Prisma.Decimal(0);
      if (group.type === FinancialMovementType.INCOME) openingIncome = amount;
      if (group.type === FinancialMovementType.EXPENSE) openingExpenses = amount;
    }

    const income = this.summarizeType(
      annualGroups as AnnualGroup[],
      FinancialMovementType.INCOME,
    );
    const expenses = this.summarizeType(
      annualGroups as AnnualGroup[],
      FinancialMovementType.EXPENSE,
    );
    const openingBalance = openingIncome.minus(openingExpenses);
    const netMovement = income.total.minus(expenses.total);

    return {
      metadata: buildReportMetadata({
        generatedBy,
        dateFrom: from,
        dateTo: to,
        filters: { year },
        dataSource: 'FINANCIAL_MOVEMENT',
      }),
      data: {
        year,
        currency: 'CRC' as const,
        openingBalance: openingBalance.toFixed(2),
        income: this.serializeSummary(income),
        expenses: this.serializeSummary(expenses),
        netMovement: netMovement.toFixed(2),
        closingBalance: openingBalance.plus(netMovement).toFixed(2),
        movementCount: income.count + expenses.count,
      },
    };
  }

  private summarizeType(
    groups: AnnualGroup[],
    type: FinancialMovementType,
  ): MovementSummary {
    const bySource: Partial<
      Record<FinancialMovementSource, { total: Prisma.Decimal; count: number }>
    > = {};
    let total = new Prisma.Decimal(0);
    let count = 0;
    for (const group of groups.filter((item) => item.type === type)) {
      const amount = group._sum.amount ?? new Prisma.Decimal(0);
      total = total.plus(amount);
      count += group._count._all;
      bySource[group.source] = { total: amount, count: group._count._all };
    }
    return { total, count, bySource };
  }

  private serializeSummary(summary: MovementSummary) {
    return {
      total: summary.total.toFixed(2),
      count: summary.count,
      bySource: Object.fromEntries(
        Object.entries(summary.bySource).map(([source, value]) => [
          source,
          { total: value.total.toFixed(2), count: value.count },
        ]),
      ),
    };
  }
}
