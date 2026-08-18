import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  InventoryItemStatus,
  InventoryLoanStatus,
  InventoryMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ReturnLoanDto } from './dto/return-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';

const loanSelect = {
  id: true,
  quantity: true,
  borrowerName: true,
  borrowerAffiliateId: true,
  loanDate: true,
  expectedReturnDate: true,
  returnedAt: true,
  status: true,
  notes: true,
  itemId: true,
  createdAt: true,
  updatedAt: true,
  item: {
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      category: { select: { id: true, name: true } },
    },
  },
  affiliate: {
    select: { id: true, fullName: true, identification: true },
  },
  createdBy: {
    select: { id: true, fullName: true, email: true },
  },
  receivedBy: {
    select: { id: true, fullName: true, email: true },
  },
} satisfies Prisma.InventoryLoanSelect;

type SafeLoan = Prisma.InventoryLoanGetPayload<{ select: typeof loanSelect }>;

function withOverdue(
  loan: SafeLoan,
  now = new Date(),
): SafeLoan & { isOverdue: boolean } {
  return {
    ...loan,
    isOverdue:
      loan.status === InventoryLoanStatus.ACTIVE &&
      loan.expectedReturnDate < now,
  };
}

@Injectable()
export class InventoryLoansService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async create(
    dto: CreateLoanDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    const loanDate = dto.loanDate ? new Date(dto.loanDate) : new Date();
    const expectedReturnDate = new Date(dto.expectedReturnDate);
    if (expectedReturnDate <= loanDate) {
      throw new BadRequestException(
        'Expected return date must be after the loan date',
      );
    }
    const loan = await this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: dto.itemId },
        select: { id: true, status: true, currentQuantity: true },
      });
      if (!item) throw new NotFoundException('Inventory item not found');
      if (item.status !== InventoryItemStatus.ACTIVE) {
        throw new ConflictException('Inventory item is inactive');
      }
      if (item.currentQuantity < dto.quantity) {
        throw new ConflictException('Insufficient stock');
      }
      if (dto.borrowerAffiliateId) {
        const affiliate = await tx.affiliate.findUnique({
          where: { id: dto.borrowerAffiliateId },
          select: { id: true },
        });
        if (!affiliate) throw new NotFoundException('Affiliate not found');
      }
      const created = await tx.inventoryLoan.create({
        data: {
          itemId: dto.itemId,
          quantity: dto.quantity,
          borrowerName: dto.borrowerName,
          borrowerAffiliateId: dto.borrowerAffiliateId ?? null,
          loanDate,
          expectedReturnDate,
          notes: dto.notes ?? null,
          createdById: actorId,
        },
        select: loanSelect,
      });
      const reserved = await tx.inventoryItem.updateMany({
        where: { id: dto.itemId, currentQuantity: { gte: dto.quantity } },
        data: { currentQuantity: { decrement: dto.quantity } },
      });
      if (reserved.count !== 1) {
        throw new ConflictException('Insufficient stock');
      }
      await tx.inventoryMovement.create({
        data: {
          itemId: dto.itemId,
          type: InventoryMovementType.EXIT,
          quantity: dto.quantity,
          reason: 'Préstamo',
          reference: `LOAN-${created.id}`,
          notes: dto.notes ?? null,
          createdById: actorId,
        },
      });
      return created;
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.INVENTORY_LOAN_CREATED,
      module: 'INVENTORY',
      entityType: 'InventoryLoan',
      entityId: loan.id,
      details: { itemId: loan.itemId, quantity: loan.quantity },
      ...context,
    });
    return withOverdue(loan);
  }

  async findAll(query: QueryLoansDto) {
    const now = new Date();
    const where: Prisma.InventoryLoanWhereInput = {
      itemId: query.itemId,
      borrowerAffiliateId: query.affiliateId,
      status: query.status,
      loanDate:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
            }
          : undefined,
      ...(query.overdue === true
        ? {
            status: query.status ?? InventoryLoanStatus.ACTIVE,
            expectedReturnDate: { lt: now },
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryLoan.findMany({
        where,
        select: loanSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.inventoryLoan.count({ where }),
    ]);
    return {
      data: data.map((loan) => withOverdue(loan, now)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(id: number) {
    const loan = await this.prisma.inventoryLoan.findUnique({
      where: { id },
      select: loanSelect,
    });
    if (!loan) throw new NotFoundException('Inventory loan not found');
    return withOverdue(loan);
  }

  async return(
    id: number,
    dto: ReturnLoanDto,
    actorId?: number,
    context: AuditContext = {},
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const loan = await tx.inventoryLoan.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          itemId: true,
          quantity: true,
          notes: true,
        },
      });
      if (!loan) throw new NotFoundException('Inventory loan not found');
      if (loan.status !== InventoryLoanStatus.ACTIVE) {
        throw new ConflictException(
          'Loan is not active; it cannot be returned twice',
        );
      }
      const updatedLoan = await tx.inventoryLoan.update({
        where: { id },
        data: {
          status: InventoryLoanStatus.RETURNED,
          returnedAt: new Date(),
          receivedById: actorId,
          notes:
            dto.returnNotes !== undefined
              ? loan.notes
                ? `${loan.notes}\n${dto.returnNotes}`
                : dto.returnNotes
              : undefined,
        },
        select: loanSelect,
      });
      await tx.inventoryItem.update({
        where: { id: loan.itemId },
        data: { currentQuantity: { increment: loan.quantity } },
        select: { id: true },
      });
      if (dto.condition) {
        await tx.inventoryItem.update({
          where: { id: loan.itemId },
          data: { condition: dto.condition },
          select: { id: true },
        });
      }
      await tx.inventoryMovement.create({
        data: {
          itemId: loan.itemId,
          type: InventoryMovementType.ENTRY,
          quantity: loan.quantity,
          reason: 'Devolución de préstamo',
          reference: `LOAN-${id}`,
          notes: dto.returnNotes ?? null,
          createdById: actorId,
        },
      });
      return updatedLoan;
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.INVENTORY_LOAN_RETURNED,
      module: 'INVENTORY',
      entityType: 'InventoryLoan',
      entityId: id,
      details: { itemId: updated.itemId, quantity: updated.quantity },
      ...context,
    });
    return withOverdue(updated);
  }

  async cancel(
    id: number,
    actorId?: number,
    context: AuditContext = {},
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const loan = await tx.inventoryLoan.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          itemId: true,
          quantity: true,
          notes: true,
        },
      });
      if (!loan) throw new NotFoundException('Inventory loan not found');
      if (loan.status !== InventoryLoanStatus.ACTIVE) {
        throw new ConflictException(
          'Loan is not active; it cannot be cancelled',
        );
      }
      const updatedLoan = await tx.inventoryLoan.update({
        where: { id },
        data: {
          status: InventoryLoanStatus.CANCELLED,
          receivedById: actorId,
          notes: loan.notes
            ? `${loan.notes}\nPréstamo cancelado`
            : 'Préstamo cancelado',
        },
        select: loanSelect,
      });
      await tx.inventoryItem.update({
        where: { id: loan.itemId },
        data: { currentQuantity: { increment: loan.quantity } },
        select: { id: true },
      });
      await tx.inventoryMovement.create({
        data: {
          itemId: loan.itemId,
          type: InventoryMovementType.ENTRY,
          quantity: loan.quantity,
          reason: 'Cancelación de préstamo',
          reference: `LOAN-${id}`,
          notes: null,
          createdById: actorId,
        },
      });
      return updatedLoan;
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.INVENTORY_LOAN_CANCELLED,
      module: 'INVENTORY',
      entityType: 'InventoryLoan',
      entityId: id,
      details: { itemId: updated.itemId, quantity: updated.quantity },
      ...context,
    });
    return withOverdue(updated);
  }
}

export type { SafeLoan };
