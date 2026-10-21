import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { VenturePublicationStatus, VentureStatus } from '../../generated/prisma/enums';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVentureDto,
  QueryPublicVenturesDto,
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

const publicVentureSelect = {
  id: true,
  name: true,
  description: true,
  offerDescription: true,
  businessPhone: true,
  businessEmail: true,
  websiteUrl: true,
  socialUrl: true,
  locationText: true,
} satisfies Prisma.VentureSelect;

type PublicVentureRecord = Prisma.VentureGetPayload<{ select: typeof publicVentureSelect }>;

function toPublicVenture(venture: PublicVentureRecord) {
  return {
    id: venture.id,
    name: venture.name,
    description: venture.description,
    offerDescription: venture.offerDescription,
    businessPhone: venture.businessPhone,
    businessEmail: venture.businessEmail,
    websiteUrl: venture.websiteUrl,
    socialUrl: venture.socialUrl,
    locationText: venture.locationText,
  };
}

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

  async findPublic(query: QueryPublicVenturesDto) {
    const where: Prisma.VentureWhereInput = {
      status: VentureStatus.ACTIVE,
      publicationStatus: VenturePublicationStatus.PUBLISHED,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { offerDescription: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.venture.findMany({
        where,
        select: publicVentureSelect,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.venture.count({ where }),
    ]);
    return { data: data.map(toPublicVenture), total, page: query.page, limit: query.limit };
  }

  async findPublicOne(id: number) {
    const venture = await this.prisma.venture.findFirst({
      where: {
        id,
        status: VentureStatus.ACTIVE,
        publicationStatus: VenturePublicationStatus.PUBLISHED,
      },
      select: publicVentureSelect,
    });
    if (!venture) throw new NotFoundException('Public venture not found');
    return toPublicVenture(venture);
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

  async publish(id: number, actorId: number, context: AuditContext = {}) {
    return this.transitionPublication(id, 'UNPUBLISHED', 'PUBLISHED', actorId, AuditAction.VENTURE_PUBLISHED, context);
  }

  async unpublish(id: number, actorId: number, context: AuditContext = {}) {
    return this.transitionPublication(id, 'PUBLISHED', 'UNPUBLISHED', actorId, AuditAction.VENTURE_UNPUBLISHED, context);
  }

  private async transitionPublication(
    id: number,
    from: 'UNPUBLISHED' | 'PUBLISHED',
    to: 'UNPUBLISHED' | 'PUBLISHED',
    actorId: number,
    action: AuditAction,
    context: AuditContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.venture.findUnique({ where: { id }, select: ventureSelect });
      if (!existing) throw new NotFoundException('Venture not found');
      if (to === 'PUBLISHED' && existing.status !== 'ACTIVE') {
        throw new BadRequestException('Only active ventures can be published');
      }
      if (existing.publicationStatus !== from) {
        throw new ConflictException('Venture publication state changed. Refresh and try again.');
      }

      const result = await tx.venture.updateMany({
        where: { id, publicationStatus: from, ...(to === 'PUBLISHED' ? { status: 'ACTIVE' } : {}) },
        data: { publicationStatus: to },
      });
      if (result.count !== 1) {
        throw new ConflictException('Venture publication state changed. Refresh and try again.');
      }

      const venture = await tx.venture.findUniqueOrThrow({ where: { id }, select: ventureSelect });
      await this.audit.log({
        userId: actorId,
        action,
        module: 'ENTREPRENEURSHIP',
        entityType: 'Venture',
        entityId: id,
        details: { from, to },
        ...context,
      }, tx);
      return venture;
    });
  }
}
