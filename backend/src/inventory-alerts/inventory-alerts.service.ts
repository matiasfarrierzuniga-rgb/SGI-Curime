import { Injectable } from '@nestjs/common';
import {
  InventoryItemCondition,
  InventoryItemStatus,
  InventoryLoanStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const itemAlertSelect = {
  id: true,
  code: true,
  name: true,
  currentQuantity: true,
  minimumQuantity: true,
  unit: true,
  location: true,
  status: true,
  condition: true,
} satisfies Prisma.InventoryItemSelect;

const loanAlertSelect = {
  id: true,
  quantity: true,
  borrowerName: true,
  loanDate: true,
  expectedReturnDate: true,
  item: {
    select: { id: true, code: true, name: true, unit: true },
  },
  affiliate: {
    select: { id: true, fullName: true },
  },
} satisfies Prisma.InventoryLoanSelect;

@Injectable()
export class InventoryAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const now = new Date();
    const [lowStock, outOfStock, overdueLoans, inactiveItems, damagedItems] =
      await Promise.all([
        this.prisma.inventoryItem.findMany({
          where: {
            status: InventoryItemStatus.ACTIVE,
            currentQuantity: {
              gt: 0,
              lte: this.prisma.inventoryItem.fields.minimumQuantity,
            },
          },
          select: itemAlertSelect,
          orderBy: { name: 'asc' },
        }),
        this.prisma.inventoryItem.findMany({
          where: {
            status: InventoryItemStatus.ACTIVE,
            currentQuantity: 0,
          },
          select: itemAlertSelect,
          orderBy: { name: 'asc' },
        }),
        this.prisma.inventoryLoan.findMany({
          where: {
            status: InventoryLoanStatus.ACTIVE,
            expectedReturnDate: { lt: now },
          },
          select: loanAlertSelect,
          orderBy: { expectedReturnDate: 'asc' },
        }),
        this.prisma.inventoryItem.findMany({
          where: { status: InventoryItemStatus.INACTIVE },
          select: itemAlertSelect,
          orderBy: { name: 'asc' },
        }),
        this.prisma.inventoryItem.findMany({
          where: {
            condition: {
              in: [
                InventoryItemCondition.DAMAGED,
                InventoryItemCondition.UNDER_REPAIR,
              ],
            },
          },
          select: itemAlertSelect,
          orderBy: { name: 'asc' },
        }),
      ]);

    return {
      summary: {
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        overdueLoans: overdueLoans.length,
        inactiveItems: inactiveItems.length,
        damagedItems: damagedItems.length,
      },
      lowStock,
      outOfStock,
      overdueLoans,
      inactiveItems,
      damagedItems,
    };
  }
}
