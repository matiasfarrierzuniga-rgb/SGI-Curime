import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InventoryItemStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';

const itemSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  currentQuantity: true,
  minimumQuantity: true,
  unit: true,
  location: true,
  status: true,
  condition: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InventoryItemSelect;

type SafeItem = Prisma.InventoryItemGetPayload<{ select: typeof itemSelect }>;

@Injectable()
export class InventoryItemsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async create(
    dto: CreateInventoryItemDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    await this.requireActiveCategory(dto.categoryId);
    try {
      const created = await this.prisma.inventoryItem.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description ?? null,
          categoryId: dto.categoryId,
          minimumQuantity: dto.minimumQuantity ?? 0,
          unit: dto.unit ?? 'unidad',
          location: dto.location ?? null,
          condition: dto.condition,
          currentQuantity: 0,
          status: InventoryItemStatus.ACTIVE,
        },
        select: itemSelect,
      });
      await this.audit?.log({
        userId: actorId,
        action: AuditAction.INVENTORY_ITEM_CREATED,
        module: 'INVENTORY',
        entityType: 'InventoryItem',
        entityId: created.id,
        details: { code: created.code, categoryId: created.categoryId },
        ...context,
      });
      return created;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Inventory item code is already in use');
      }
      throw error;
    }
  }

  async findAll(query: QueryInventoryItemsDto) {
    const lowStockCondition: Prisma.InventoryItemWhereInput | undefined =
      query.lowStock === true
        ? {
            status: InventoryItemStatus.ACTIVE,
            currentQuantity: {
              lte: this.prisma.inventoryItem.fields.minimumQuantity,
            },
          }
        : undefined;
    const where: Prisma.InventoryItemWhereInput = {
      name: query.search
        ? { contains: query.search, mode: 'insensitive' }
        : undefined,
      code: query.code
        ? { contains: query.code, mode: 'insensitive' }
        : undefined,
      categoryId: query.categoryId,
      status: query.status,
      AND: lowStockCondition ? [lowStockCondition] : undefined,
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        select: itemSelect,
        orderBy: { name: 'asc' },
        skip,
        take: query.limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      select: itemSelect,
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async update(
    id: number,
    dto: UpdateInventoryItemDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one editable field is required');
    }
    const existing = await this.requireItem(id);
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      await this.requireActiveCategory(dto.categoryId);
    }
    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.inventoryItem.findFirst({
        where: { code: dto.code, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('Inventory item code is already in use');
      }
    }
    try {
      const updated = await this.prisma.inventoryItem.update({
        where: { id },
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          categoryId: dto.categoryId,
          minimumQuantity: dto.minimumQuantity,
          unit: dto.unit,
          location: dto.location,
          condition: dto.condition,
        },
        select: itemSelect,
      });
      await this.audit?.log({
        userId: actorId,
        action: AuditAction.INVENTORY_ITEM_UPDATED,
        module: 'INVENTORY',
        entityType: 'InventoryItem',
        entityId: id,
        details: { changedFields: Object.keys(dto) },
        ...context,
      });
      return updated;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Inventory item code is already in use');
      }
      throw error;
    }
  }

  async setActive(
    id: number,
    active: boolean,
    actorId?: number,
    context: AuditContext = {},
  ) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    if ((item.status === InventoryItemStatus.ACTIVE) === active) {
      throw new ConflictException(
        active
          ? 'Inventory item is already active'
          : 'Inventory item is already inactive',
      );
    }
    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        status: active
          ? InventoryItemStatus.ACTIVE
          : InventoryItemStatus.INACTIVE,
      },
      select: itemSelect,
    });
    await this.audit?.log({
      userId: actorId,
      action: active
        ? AuditAction.INVENTORY_ITEM_ACTIVATED
        : AuditAction.INVENTORY_ITEM_DEACTIVATED,
      module: 'INVENTORY',
      entityType: 'InventoryItem',
      entityId: id,
      ...context,
    });
    return updated;
  }

  private async requireItem(id: number) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, code: true, categoryId: true, status: true },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  private async requireActiveCategory(categoryId: number) {
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true },
    });
    if (!category) throw new NotFoundException('Inventory category not found');
    if (!category.isActive) {
      throw new ConflictException('Inventory category is inactive');
    }
    return category;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}

export type { SafeItem };
