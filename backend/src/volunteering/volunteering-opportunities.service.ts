import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVolunteerOpportunityDto,
  QueryVolunteerOpportunitiesDto,
  UpdateVolunteerOpportunityDto,
} from './dto/volunteer-opportunity.dto';

const opportunitySelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  capacity: true,
  applicationDeadline: true,
  status: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VolunteerOpportunitySelect;

@Injectable()
export class VolunteeringOpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(query: QueryVolunteerOpportunitiesDto) {
    const where: Prisma.VolunteerOpportunityWhereInput = {
      status: query.status,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { location: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.volunteerOpportunity.findMany({
        where,
        select: opportunitySelect,
        orderBy: { title: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.volunteerOpportunity.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number) {
    const opportunity = await this.prisma.volunteerOpportunity.findUnique({
      where: { id },
      select: opportunitySelect,
    });
    if (!opportunity) throw new NotFoundException('Volunteer opportunity not found');
    return opportunity;
  }

  async create(
    dto: CreateVolunteerOpportunityDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const opportunity = await this.prisma.volunteerOpportunity.create({
      data: { ...dto, createdByUserId: actorId },
      select: opportunitySelect,
    });
    await this.audit.log({
      userId: actorId,
      action: AuditAction.VOLUNTEER_OPPORTUNITY_CREATED,
      module: 'VOLUNTEERING',
      entityType: 'VolunteerOpportunity',
      entityId: opportunity.id,
      ...context,
    });
    return opportunity;
  }

  async update(
    id: number,
    dto: UpdateVolunteerOpportunityDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.findOne(id);
    const opportunity = await this.prisma.volunteerOpportunity.update({
      where: { id },
      data: dto,
      select: opportunitySelect,
    });
    await this.audit.log({
      userId: actorId,
      action: AuditAction.VOLUNTEER_OPPORTUNITY_UPDATED,
      module: 'VOLUNTEERING',
      entityType: 'VolunteerOpportunity',
      entityId: opportunity.id,
      details: { fields: Object.keys(dto) },
      ...context,
    });
    return opportunity;
  }
}
