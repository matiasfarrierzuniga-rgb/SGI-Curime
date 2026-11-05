import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { VolunteerOpportunityStatus } from '../../generated/prisma/enums';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVolunteerOpportunityDto,
  CreateVolunteerSessionDto,
  QueryPublicVolunteerOpportunitiesDto,
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
  publishedAt: true,
  closedAt: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VolunteerOpportunitySelect;

const publicOpportunitySelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  capacity: true,
  applicationDeadline: true,
} satisfies Prisma.VolunteerOpportunitySelect;

@Injectable()
export class VolunteeringOpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findPublic(query: QueryPublicVolunteerOpportunitiesDto) {
    const where: Prisma.VolunteerOpportunityWhereInput = {
      status: VolunteerOpportunityStatus.PUBLISHED,
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
        select: publicOpportunitySelect,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.volunteerOpportunity.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findPublicOne(id: number) {
    const opportunity = await this.prisma.volunteerOpportunity.findFirst({
      where: { id, status: VolunteerOpportunityStatus.PUBLISHED },
      select: publicOpportunitySelect,
    });
    if (!opportunity)
      throw new NotFoundException('Volunteer opportunity not found');
    const confirmed =
      opportunity.capacity === null
        ? 0
        : await this.prisma.volunteerParticipation.count({
            where: { opportunityId: id, status: 'CONFIRMED' },
          });
    const upcomingSessions = await this.prisma.volunteerSession.count({
      where: {
        opportunityId: id,
        status: 'SCHEDULED',
        startAt: { gt: new Date() },
      },
    });
    return {
      ...opportunity,
      acceptingApplications:
        (opportunity.applicationDeadline === null ||
          opportunity.applicationDeadline >= new Date()) &&
        (opportunity.capacity === null || confirmed < opportunity.capacity) &&
        upcomingSessions > 0,
    };
  }

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
    if (!opportunity)
      throw new NotFoundException('Volunteer opportunity not found');
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

  async findSessions(id: number) {
    await this.findOne(id);
    return this.prisma.volunteerSession.findMany({
      where: { opportunityId: id },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        status: true,
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async addSession(
    id: number,
    dto: CreateVolunteerSessionDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    if (dto.startAt >= dto.endAt || dto.startAt <= new Date()) {
      throw new BadRequestException(
        'Session must have a future start before its end',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1::integer AS locked FROM (SELECT pg_advisory_xact_lock(hashtextextended(${`volunteer-opportunity:${id}`}, 0))) opportunity_lock`;
      const opportunity = await tx.volunteerOpportunity.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!opportunity)
        throw new NotFoundException('Volunteer opportunity not found');
      if (opportunity.status !== 'DRAFT')
        throw new ConflictException('Sessions can only be added to drafts');
      const session = await tx.volunteerSession.create({
        data: {
          opportunityId: id,
          title: dto.title,
          startAt: dto.startAt,
          endAt: dto.endAt,
        },
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          status: true,
        },
      });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.VOLUNTEER_SESSION_CREATED,
          module: 'VOLUNTEERING',
          entityType: 'VolunteerSession',
          entityId: session.id,
          ...context,
        },
        tx,
      );
      return session;
    });
  }

  async publish(id: number, actorId: number, context: AuditContext = {}) {
    return this.transition(
      id,
      'DRAFT',
      'PUBLISHED',
      actorId,
      AuditAction.VOLUNTEER_OPPORTUNITY_PUBLISHED,
      context,
    );
  }

  async close(id: number, actorId: number, context: AuditContext = {}) {
    return this.transition(
      id,
      'PUBLISHED',
      'CLOSED',
      actorId,
      AuditAction.VOLUNTEER_OPPORTUNITY_CLOSED,
      context,
    );
  }

  private async transition(
    id: number,
    from: 'DRAFT' | 'PUBLISHED',
    to: 'PUBLISHED' | 'CLOSED',
    actorId: number,
    action: AuditAction,
    context: AuditContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1::integer AS locked FROM (SELECT pg_advisory_xact_lock(hashtextextended(${`volunteer-opportunity:${id}`}, 0))) opportunity_lock`;
      const opportunity = await tx.volunteerOpportunity.findUnique({
        where: { id },
        select: { status: true, applicationDeadline: true },
      });
      if (!opportunity)
        throw new NotFoundException('Volunteer opportunity not found');
      if (opportunity.status !== from)
        throw new ConflictException('Opportunity state changed');
      const now = new Date();
      if (to === 'PUBLISHED') {
        if (
          opportunity.applicationDeadline &&
          opportunity.applicationDeadline <= now
        )
          throw new BadRequestException('Application deadline has passed');
        const sessions = await tx.volunteerSession.count({
          where: {
            opportunityId: id,
            status: 'SCHEDULED',
            startAt: { gt: now },
            endAt: { gt: now },
          },
        });
        if (sessions === 0)
          throw new BadRequestException(
            'A future scheduled session is required',
          );
      }
      const updated = await tx.volunteerOpportunity.updateMany({
        where: { id, status: from },
        data: {
          status: to,
          ...(to === 'PUBLISHED' ? { publishedAt: now } : { closedAt: now }),
        },
      });
      if (updated.count !== 1)
        throw new ConflictException('Opportunity state changed');
      const result = await tx.volunteerOpportunity.findUniqueOrThrow({
        where: { id },
        select: opportunitySelect,
      });
      await this.audit.log(
        {
          userId: actorId,
          action,
          module: 'VOLUNTEERING',
          entityType: 'VolunteerOpportunity',
          entityId: id,
          details: { from, to },
          ...context,
        },
        tx,
      );
      return result;
    });
  }
}
