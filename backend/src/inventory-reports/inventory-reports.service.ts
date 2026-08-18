import { Injectable } from '@nestjs/common';
import {
  InventoryItemStatus,
  InventoryLoanStatus,
  InventoryMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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

  async summary() {
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
      totalItems,
      activeItems,
      inactiveItems,
      totalCategories,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      activeLoans,
      overdueLoans,
    };
  }

  async stock(query: QueryReportsDto) {
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
    return { data, total, page: query.page, limit: query.limit };
  }

  async movements(query: QueryReportsDto) {
    const where: Prisma.InventoryMovementWhereInput = {
      type: query.type,
      item: query.categoryId ? { categoryId: query.categoryId } : undefined,
      createdAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
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
    return { period, summary };
  }

  async loans(query: QueryReportsDto) {
    const now = new Date();
    const base: Prisma.InventoryLoanWhereInput = {
      item: query.categoryId ? { categoryId: query.categoryId } : undefined,
      loanDate:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
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
      period: {
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null,
      },
      summary: { active, returned, cancelled, overdue, total },
    };
  }
}
