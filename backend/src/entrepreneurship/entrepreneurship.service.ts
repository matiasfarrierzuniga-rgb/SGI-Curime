import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVentureDto,
  QueryVenturesDto,
  UpdateVentureDto,
} from './dto/venture.dto';

const ventureSelect = {
  id: true,
  name: true,
  description: true,
  offerDescription: true,
  businessPhone: true,
  businessEmail: true,
  websiteUrl: true,
  socialUrl: true,
  locationText: true,
  status: true,
  publicationStatus: true,
  incorporatedAt: true,
  createdAt: true,
  updatedAt: true,
  associations: {
    select: {
      id: true,
      personId: true,
      ventureId: true,
      startedAt: true,
      endedAt: true,
      createdAt: true,
      updatedAt: true,
      person: {
        select: {
          id: true,
          firstName: true,
          firstSurname: true,
          secondSurname: true,
          identification: true,
          identificationType: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  },
} satisfies Prisma.VentureSelect;

@Injectable()
export class EntrepreneurshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(query: QueryVenturesDto) {
    const where: Prisma.VentureWhereInput = {
      status: query.status,
      publicationStatus: query.publicationStatus,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { offerDescription: { contains: query.search, mode: 'insensitive' } },
            { businessEmail: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.venture.findMany({
        where,
        select: ventureSelect,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.venture.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const venture = await this.prisma.venture.findUnique({
      where: { id },
      select: ventureSelect,
    });
    if (!venture) throw new NotFoundException('Venture not found');
    return venture;
  }

  async create(
    dto: CreateVentureDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const venture = await this.prisma.venture.create({
      data: dto,
      select: ventureSelect,
    });
    await this.audit.log({
      userId: actorId,
      action: AuditAction.VENTURE_CREATED,
      module: 'ENTREPRENEURSHIP',
      entityType: 'Venture',
      entityId: venture.id,
      ...context,
    });
    return venture;
  }

  async update(
    id: number,
    dto: UpdateVentureDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.findOne(id);
    const venture = await this.prisma.venture.update({
      where: { id },
      data: dto,
      select: ventureSelect,
    });
    await this.audit.log({
      userId: actorId,
      action: AuditAction.VENTURE_UPDATED,
      module: 'ENTREPRENEURSHIP',
      entityType: 'Venture',
      entityId: venture.id,
      details: { fields: Object.keys(dto) },
      ...context,
    });
    return venture;
  }
}
