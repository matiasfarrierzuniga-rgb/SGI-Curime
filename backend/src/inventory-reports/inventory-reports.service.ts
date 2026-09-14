import { Injectable } from '@nestjs/common';
import {
  InventoryItemStatus,
  InventoryLoanStatus,
  InventoryMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildReportMetadata,
  type ReportGeneratedBy,
} from '../reporting/report-metadata';
import { QueryReportsDto } from './dto/query-reports.dto';

const stockSelect = {
  id: true,
  code: true,
  name: true,
  currentQuantity: true,
  minimumQuantity: true,
  unit: true,
  location: true,
  status: true,
  condition: true,
  categoryId: true,
  category: {
    select: { id: true, name: true },
  },
} satisfies Prisma.InventoryItemSelect;

@Injectable()
export class InventoryReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(generatedBy: ReportGeneratedBy | null = null) {
    const now = new Date();
    const [
      totalItems,
      activeItems,
      inactiveItems,
      totalCategories,
      lowStock,
      outOfStock,
      activeLoans,
      overdueLoans,
    ] = await Promise.all([
      this.prisma.inventoryItem.count(),
      this.prisma.inventoryItem.count({
        where: { status: InventoryItemStatus.ACTIVE },
      }),
      this.prisma.inventoryItem.count({
        where: { status: InventoryItemStatus.INACTIVE },
      }),
      this.prisma.inventoryCategory.count(),
      this.prisma.inventoryItem.count({
        where: {
          status: InventoryItemStatus.ACTIVE,
          currentQuantity: {
            gt: 0,
            lte: this.prisma.inventoryItem.fields.minimumQuantity,
          },
        },
      }),
      this.prisma.inventoryItem.count({
        where: {
          status: InventoryItemStatus.ACTIVE,
          currentQuantity: 0,
        },
      }),
      this.prisma.inventoryLoan.count({
        where: { status: InventoryLoanStatus.ACTIVE },
      }),
      this.prisma.inventoryLoan.count({
        where: {
          status: InventoryLoanStatus.ACTIVE,
          expectedReturnDate: { lt: now },
        },
      }),
    ]);

    return {
      metadata: buildReportMetadata({
        generatedBy,
        dataSource: [
          'INVENTORY_ITEM',
          'INVENTORY_CATEGORY',
          'INVENTORY_LOAN',
        ],
      }),
      data: {
        totalItems,
        activeItems,
        inactiveItems,
        totalCategories,
        lowStockCount: lowStock,
        outOfStockCount: outOfStock,
        activeLoans,
        overdueLoans,
      },
    };
  }

  async stock(
    query: QueryReportsDto,
    generatedBy: ReportGeneratedBy | null = null,
  ) {
    const where: Prisma.InventoryItemWhereInput = {
      categoryId: query.categoryId,
      status: query.status,
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        select: stockSelect,
        orderBy: { name: 'asc' },
        skip,
        take: query.limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return {
      metadata: buildReportMetadata({
        generatedBy,
        filters: {
          categoryId: query.categoryId,
          status: query.status,
          page: query.page,
          limit: query.limit,
        },
        dataSource: 'INVENTORY_ITEM',
      }),
      data: { data, total, page: query.page, limit: query.limit },
    };
  }

  async movements(
    query: QueryReportsDto,
    generatedBy: ReportGeneratedBy | null = null,
  ) {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    const where: Prisma.InventoryMovementWhereInput = {
      type: query.type,
      item: query.categoryId ? { categoryId: query.categoryId } : undefined,
      createdAt:
        query.dateFrom || query.dateTo
          ? {
              gte: dateFrom,
              lte: dateTo,
            }
          : undefined,
    };
    const grouped = await this.prisma.inventoryMovement.groupBy({
      by: ['type'],
      where,
      _count: true,
      _sum: { quantity: true },
    });
    const period = {
      dateFrom: query.dateFrom ?? null,
      dateTo: query.dateTo ?? null,
    };
    const summary = {
      entries: { count: 0, quantity: 0 },
      exits: { count: 0, quantity: 0 },
      adjustments: { count: 0, quantity: 0 },
    };
    for (const row of grouped) {
      const key =
        row.type === InventoryMovementType.ENTRY
          ? 'entries'
          : row.type === InventoryMovementType.EXIT
            ? 'exits'
            : 'adjustments';
      summary[key] = {
        count: row._count,
        quantity: row._sum.quantity ?? 0,
      };
    }
    return {
      metadata: buildReportMetadata({
        generatedBy,
        dateFrom,
        dateTo,
        filters: {
          categoryId: query.categoryId,
          type: query.type,
          dateFrom,
          dateTo,
        },
        dataSource: 'INVENTORY_MOVEMENT',
      }),
      data: { period, summary },
    };
  }

  async loans(
    query: QueryReportsDto,
    generatedBy: ReportGeneratedBy | null = null,
  ) {
    const now = new Date();
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    const base: Prisma.InventoryLoanWhereInput = {
      item: query.categoryId ? { categoryId: query.categoryId } : undefined,
      loanDate:
        query.dateFrom || query.dateTo
          ? {
              gte: dateFrom,
              lte: dateTo,
            }
          : undefined,
    };
    const [active, returned, cancelled, overdue, total] = await Promise.all([
      this.prisma.inventoryLoan.count({
        where: { ...base, status: InventoryLoanStatus.ACTIVE },
      }),
      this.prisma.inventoryLoan.count({
        where: { ...base, status: InventoryLoanStatus.RETURNED },
      }),
      this.prisma.inventoryLoan.count({
        where: { ...base, status: InventoryLoanStatus.CANCELLED },
      }),
      this.prisma.inventoryLoan.count({
        where: {
          ...base,
          status: InventoryLoanStatus.ACTIVE,
          expectedReturnDate: { lt: now },
        },
      }),
      this.prisma.inventoryLoan.count({ where: base }),
    ]);
    return {
      metadata: buildReportMetadata({
        generatedBy,
        dateFrom,
        dateTo,
        filters: { categoryId: query.categoryId, dateFrom, dateTo },
        dataSource: 'INVENTORY_LOAN',
      }),
      data: {
        period: {
          dateFrom: query.dateFrom ?? null,
          dateTo: query.dateTo ?? null,
        },
        summary: { active, returned, cancelled, overdue, total },
      },
    };
  }
}
