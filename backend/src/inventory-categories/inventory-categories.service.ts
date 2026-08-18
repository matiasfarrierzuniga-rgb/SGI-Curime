import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { QueryInventoryCategoriesDto } from './dto/query-inventory-categories.dto';

const categorySelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InventoryCategorySelect;

type SafeCategory = Prisma.InventoryCategoryGetPayload<{
  select: typeof categorySelect;
}>;

@Injectable()
export class InventoryCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async create(
    dto: CreateInventoryCategoryDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    try {
      const created = await this.prisma.inventoryCategory.create({
        data: { name: dto.name, description: dto.description ?? null },
        select: categorySelect,
      });
      await this.audit?.log({
        userId: actorId,
        action: AuditAction.INVENTORY_CATEGORY_CREATED,
        module: 'INVENTORY',
        entityType: 'InventoryCategory',
        entityId: created.id,
        ...context,
      });
      return created;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Inventory category name is already in use',
        );
      }
      throw error;
    }
  }

  async findAll(query: QueryInventoryCategoriesDto) {
    const where: Prisma.InventoryCategoryWhereInput = {
      name: query.search
        ? { contains: query.search, mode: 'insensitive' }
        : undefined,
      isActive: query.active,
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryCategory.findMany({
        where,
        select: categorySelect,
        orderBy: { name: 'asc' },
        skip,
        take: query.limit,
      }),
      this.prisma.inventoryCategory.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id },
      select: categorySelect,
    });
    if (!category) throw new NotFoundException('Inventory category not found');
    return category;
  }

  async update(
    id: number,
    dto: UpdateInventoryCategoryDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one editable field is required');
    }
    await this.requireCategory(id);
    if (dto.name) {
      const duplicate = await this.prisma.inventoryCategory.findFirst({
        where: { name: dto.name, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          'Inventory category name is already in use',
        );
      }
    }
    try {
      const updated = await this.prisma.inventoryCategory.update({
        where: { id },
        data: { name: dto.name, description: dto.description },
        select: categorySelect,
      });
      await this.audit?.log({
        userId: actorId,
        action: AuditAction.INVENTORY_CATEGORY_UPDATED,
        module: 'INVENTORY',
        entityType: 'InventoryCategory',
        entityId: id,
        details: { changedFields: Object.keys(dto) },
        ...context,
      });
      return updated;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Inventory category name is already in use',
        );
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
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!category) throw new NotFoundException('Inventory category not found');
    if (category.isActive === active) {
      throw new ConflictException(
        active
          ? 'Inventory category is already active'
          : 'Inventory category is already inactive',
      );
    }
    const updated = await this.prisma.inventoryCategory.update({
      where: { id },
      data: { isActive: active },
      select: categorySelect,
    });
    await this.audit?.log({
      userId: actorId,
      action: active
        ? AuditAction.INVENTORY_CATEGORY_ACTIVATED
        : AuditAction.INVENTORY_CATEGORY_DEACTIVATED,
      module: 'INVENTORY',
      entityType: 'InventoryCategory',
      entityId: id,
      ...context,
    });
    return updated;
  }

  private async requireCategory(id: number) {
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('Inventory category not found');
    return category;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}

export type { SafeCategory };
