import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  InventoryItemStatus,
  InventoryMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateExitDto } from './dto/create-exit.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';

const movementSelect = {
  id: true,
  type: true,
  quantity: true,
  reason: true,
  reference: true,
  notes: true,
  itemId: true,
  createdAt: true,
  item: {
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} satisfies Prisma.InventoryMovementSelect;

type SafeMovement = Prisma.InventoryMovementGetPayload<{
  select: typeof movementSelect;
}>;

@Injectable()
export class InventoryMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async recordEntry(
    itemId: number,
    dto: CreateEntryDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    const movement = await this.prisma.$transaction(async (tx) => {
      await this.requireActiveItem(tx, itemId);
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { currentQuantity: { increment: dto.quantity } },
        select: { id: true },
      });
      return tx.inventoryMovement.create({
        data: {
          itemId,
          type: InventoryMovementType.ENTRY,
          quantity: dto.quantity,
          reason: dto.reason,
          reference: dto.reference ?? null,
          notes: dto.notes ?? null,
          createdById: actorId,
        },
        select: movementSelect,
      });
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.INVENTORY_ENTRY_RECORDED,
      module: 'INVENTORY',
      entityType: 'InventoryItem',
      entityId: itemId,
      details: {
        quantity: dto.quantity,
        reason: dto.reason,
        reference: dto.reference ?? null,
      },
      ...context,
    });
    return movement;
  }

  async recordExit(
    itemId: number,
    dto: CreateExitDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    const movement = await this.prisma.$transaction(async (tx) => {
      const item = await this.requireActiveItem(tx, itemId);
      if (item.currentQuantity < dto.quantity) {
        throw new ConflictException('Insufficient stock');
      }
      const result = await tx.inventoryItem.updateMany({
        where: { id: itemId, currentQuantity: { gte: dto.quantity } },
        data: { currentQuantity: { decrement: dto.quantity } },
      });
      if (result.count !== 1) {
        throw new ConflictException('Insufficient stock');
      }
      return tx.inventoryMovement.create({
        data: {
          itemId,
          type: InventoryMovementType.EXIT,
          quantity: dto.quantity,
          reason: dto.reason,
          reference: dto.reference ?? null,
          notes: dto.notes ?? null,
          createdById: actorId,
        },
        select: movementSelect,
      });
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.INVENTORY_EXIT_RECORDED,
      module: 'INVENTORY',
      entityType: 'InventoryItem',
      entityId: itemId,
      details: {
        quantity: dto.quantity,
        reason: dto.reason,
        reference: dto.reference ?? null,
      },
      ...context,
    });
    return movement;
  }

  async recordAdjustment(
    itemId: number,
    dto: CreateAdjustmentDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    const movement = await this.prisma.$transaction(async (tx) => {
      const item = await this.requireActiveItem(tx, itemId);
      const result = await tx.inventoryItem.updateMany({
        where: {
          id: itemId,
          currentQuantity: { equals: item.currentQuantity },
        },
        data: { currentQuantity: dto.newQuantity },
      });
      if (result.count !== 1) {
        throw new ConflictException(
          'Stock changed concurrently; please retry the adjustment',
        );
      }
      return tx.inventoryMovement.create({
        data: {
          itemId,
          type: InventoryMovementType.ADJUSTMENT,
          quantity: dto.newQuantity - item.currentQuantity,
          reason: dto.reason,
          reference: null,
          notes: dto.notes ?? null,
          createdById: actorId,
        },
        select: movementSelect,
      });
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.INVENTORY_ADJUSTMENT_RECORDED,
      module: 'INVENTORY',
      entityType: 'InventoryItem',
      entityId: itemId,
      details: {
        newQuantity: dto.newQuantity,
        reason: dto.reason,
      },
      ...context,
    });
    return movement;
  }

  async findAll(query: QueryMovementsDto) {
    const where: Prisma.InventoryMovementWhereInput = {
      itemId: query.itemId,
      type: query.type,
      createdById: query.userId,
      item: query.categoryId ? { categoryId: query.categoryId } : undefined,
      createdAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
            }
          : undefined,
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        select: movementSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findItemMovements(itemId: number, query: QueryMovementsDto) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    const where: Prisma.InventoryMovementWhereInput = {
      itemId,
      type: query.type,
      createdById: query.userId,
      createdAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
            }
          : undefined,
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        select: movementSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  private async requireActiveItem(
    tx: Prisma.TransactionClient,
    itemId: number,
  ) {
    const item = await tx.inventoryItem.findUnique({
      where: { id: itemId },
      select: { id: true, status: true, currentQuantity: true },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    if (item.status !== InventoryItemStatus.ACTIVE) {
      throw new ConflictException('Inventory item is inactive');
    }
    return item;
  }
}

export type { SafeMovement };
