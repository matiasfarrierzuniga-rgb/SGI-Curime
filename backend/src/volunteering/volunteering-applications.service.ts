import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApproveVolunteerApplicationDto,
  CreateVolunteerApplicationDto,
  RejectVolunteerApplicationDto,
} from './dto/volunteer-application.dto';

const applicationSelect = {
  id: true,
  opportunityId: true,
  personId: true,
  submittedFullName: true,
  submittedEmail: true,
  submittedPhone: true,
  motivation: true,
  status: true,
  requestedAt: true,
  reviewedAt: true,
  rejectionReason: true,
} satisfies Prisma.VolunteerApplicationSelect;

@Injectable()
export class VolunteeringApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async submit(
    opportunityId: number,
    dto: CreateVolunteerApplicationDto,
    context: AuditContext = {},
  ) {
    const phone =
      dto.phoneCountryCode && dto.phoneNationalNumber
        ? `${dto.phoneCountryCode}${dto.phoneNationalNumber}`
        : null;
    const email = dto.email ?? null;
    if (!email && !phone)
      throw new BadRequestException('Email or phone is required');

    await this.prisma.$transaction(async (tx) => {
      await this.lockOpportunity(tx, opportunityId);
      const opportunity = await tx.volunteerOpportunity.findUnique({
        where: { id: opportunityId },
        select: {
          id: true,
          status: true,
          applicationDeadline: true,
          capacity: true,
        },
      });
      if (!opportunity)
        throw new NotFoundException('Volunteer opportunity not found');
      if (
        opportunity.status !== 'PUBLISHED' ||
        (opportunity.applicationDeadline &&
          opportunity.applicationDeadline < new Date())
      ) {
        throw new ConflictException('Applications are closed');
      }
      const upcomingSessions = await tx.volunteerSession.count({
        where: {
          opportunityId,
          status: 'SCHEDULED',
          startAt: { gt: new Date() },
        },
      });
      if (upcomingSessions === 0)
        throw new ConflictException('Applications are closed');
      if (opportunity.capacity !== null) {
        const confirmed = await tx.volunteerParticipation.count({
          where: { opportunityId, status: 'CONFIRMED' },
        });
        if (confirmed >= opportunity.capacity)
          throw new ConflictException('Applications are closed');
      }
      const duplicate = await tx.volunteerApplication.findFirst({
        where: {
          opportunityId,
          status: { in: ['PENDING', 'APPROVED'] },
          OR: [
            ...(email
              ? [
                  {
                    submittedEmail: {
                      equals: email,
                      mode: 'insensitive' as const,
                    },
                  },
                ]
              : []),
            ...(phone ? [{ submittedPhone: phone }] : []),
          ],
        },
        select: { id: true },
      });
      if (duplicate)
        throw new ConflictException('Application could not be received');
      const application = await tx.volunteerApplication.create({
        data: {
          opportunityId,
          submittedFullName: dto.fullName,
          submittedEmail: email,
          submittedPhone: phone,
          motivation: dto.motivation ?? null,
          status: 'PENDING',
        },
        select: { id: true },
      });
      await this.audit.log(
        {
          action: AuditAction.VOLUNTEER_APPLICATION_SUBMITTED,
          module: 'VOLUNTEERING',
          entityType: 'VolunteerApplication',
          entityId: application.id,
          ...context,
        },
        tx,
      );
    });
    return { received: true };
  }

  async list(opportunityId: number) {
    const opportunity = await this.prisma.volunteerOpportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true },
    });
    if (!opportunity)
      throw new NotFoundException('Volunteer opportunity not found');
    return this.prisma.volunteerApplication.findMany({
      where: { opportunityId },
      select: applicationSelect,
      orderBy: { requestedAt: 'desc' },
    });
  }

  async approve(
    id: number,
    dto: ApproveVolunteerApplicationDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    if (Boolean(dto.personId) === Boolean(dto.createPerson))
      throw new BadRequestException('Choose an existing or new person');
    return this.prisma.$transaction(async (tx) => {
      const initial = await tx.volunteerApplication.findUnique({
        where: { id },
        select: { opportunityId: true },
      });
      if (!initial)
        throw new NotFoundException('Volunteer application not found');
      await this.lockOpportunity(tx, initial.opportunityId);
      const application = await tx.volunteerApplication.findUnique({
        where: { id },
        select: applicationSelect,
      });
      if (!application || application.status !== 'PENDING')
        throw new ConflictException('Application has already been resolved');
      const opportunity = await tx.volunteerOpportunity.findUnique({
        where: { id: application.opportunityId },
        select: { capacity: true },
      });
      if (!opportunity)
        throw new NotFoundException('Volunteer opportunity not found');
      if (opportunity.capacity !== null) {
        const confirmed = await tx.volunteerParticipation.count({
          where: {
            opportunityId: application.opportunityId,
            status: 'CONFIRMED',
          },
        });
        if (confirmed >= opportunity.capacity)
          throw new ConflictException('Opportunity is full');
      }
      let personId = dto.personId;
      if (personId) {
        const person = await tx.person.findUnique({
          where: { id: personId },
          select: { id: true },
        });
        if (!person) throw new NotFoundException('Person not found');
        const participation = await tx.volunteerParticipation.findUnique({
          where: {
            opportunityId_personId: {
              opportunityId: application.opportunityId,
              personId,
            },
          },
          select: { id: true },
        });
        if (participation)
          throw new ConflictException('Person already participates');
      } else {
        const person = await tx.person.create({
          data: {
            legacyFullName: application.submittedFullName,
            email: application.submittedEmail,
          },
          select: { id: true },
        });
        personId = person.id;
      }
      const claimed = await tx.volunteerApplication.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          personId,
          reviewedByUserId: actorId,
          reviewedAt: new Date(),
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException('Application has already been resolved');
      await tx.volunteerParticipation.create({
        data: {
          applicationId: id,
          opportunityId: application.opportunityId,
          personId,
          status: 'CONFIRMED',
        },
      });
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.VOLUNTEER_APPLICATION_APPROVED,
          module: 'VOLUNTEERING',
          entityType: 'VolunteerApplication',
          entityId: id,
          ...context,
        },
        tx,
      );
      return tx.volunteerApplication.findUniqueOrThrow({
        where: { id },
        select: applicationSelect,
      });
    });
  }

  async reject(
    id: number,
    dto: RejectVolunteerApplicationDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const initial = await tx.volunteerApplication.findUnique({
        where: { id },
        select: { opportunityId: true },
      });
      if (!initial)
        throw new NotFoundException('Volunteer application not found');
      await this.lockOpportunity(tx, initial.opportunityId);
      const claimed = await tx.volunteerApplication.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          reviewedByUserId: actorId,
          reviewedAt: new Date(),
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException('Application has already been resolved');
      await this.audit.log(
        {
          userId: actorId,
          action: AuditAction.VOLUNTEER_APPLICATION_REJECTED,
          module: 'VOLUNTEERING',
          entityType: 'VolunteerApplication',
          entityId: id,
          ...context,
        },
        tx,
      );
      return tx.volunteerApplication.findUniqueOrThrow({
        where: { id },
        select: applicationSelect,
      });
    });
  }

  private async lockOpportunity(tx: Prisma.TransactionClient, id: number) {
    await tx.$queryRaw`SELECT 1::integer AS locked FROM (SELECT pg_advisory_xact_lock(hashtextextended(${`volunteer-opportunity:${id}`}, 0))) opportunity_lock`;
  }
}
