import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PublicationStatus } from '../../generated/prisma/enums';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

const adminSelect = {
  id: true,
  publicId: true,
  title: true,
  summary: true,
  description: true,
  startAt: true,
  endAt: true,
  location: true,
  status: true,
  publicationStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventSelect;

const publicSelect = {
  publicId: true,
  title: true,
  summary: true,
  description: true,
  startAt: true,
  endAt: true,
  location: true,
  status: true,
} satisfies Prisma.EventSelect;

type PublicEventRecord = Prisma.EventGetPayload<{ select: typeof publicSelect }>;

export function toPublicEvent(event: PublicEventRecord) {
  return {
    publicId: event.publicId,
    title: event.title,
    summary: event.summary,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    location: event.location,
    status: event.status,
  };
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async findAll() {
    return this.prisma.event.findMany({ select: adminSelect, orderBy: { startAt: 'desc' } });
  }

  async findPublic() {
    const events = await this.prisma.event.findMany({
      where: { publicationStatus: PublicationStatus.PUBLISHED },
      select: publicSelect,
      orderBy: { startAt: 'asc' },
    });
    return events.map(toPublicEvent);
  }

  async create(dto: CreateEventDto, actorId: number, context: AuditContext = {}) {
    this.assertDateRange(dto.startAt, dto.endAt);
    const event = await this.prisma.event.create({ data: dto, select: adminSelect });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.EVENT_CREATED,
      module: 'EVENTS',
      entityType: 'Event',
      entityId: event.id,
      ...context,
    });
    return event;
  }

  async update(id: number, dto: UpdateEventDto, actorId: number, context: AuditContext = {}) {
    const existing = await this.findOne(id);
    this.assertDateRange(dto.startAt ?? existing.startAt, dto.endAt ?? existing.endAt);
    const event = await this.prisma.event.update({ where: { id }, data: dto, select: adminSelect });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.EVENT_UPDATED,
      module: 'EVENTS',
      entityType: 'Event',
      entityId: id,
      details: { fields: Object.keys(dto) },
      ...context,
    });
    return event;
  }

  async publish(id: number, actorId: number, context: AuditContext = {}) {
    const existing = await this.findOne(id);
    if (existing.publicationStatus === PublicationStatus.ARCHIVED) {
      throw new BadRequestException('Archived events cannot be republished');
    }
    const event = await this.prisma.event.update({
      where: { id },
      data: { publicationStatus: PublicationStatus.PUBLISHED },
      select: adminSelect,
    });
    await this.audit?.log({ userId: actorId, action: AuditAction.EVENT_PUBLISHED, module: 'EVENTS', entityType: 'Event', entityId: id, ...context });
    return event;
  }

  async archive(id: number, actorId: number, context: AuditContext = {}) {
    await this.findOne(id);
    const event = await this.prisma.event.update({
      where: { id },
      data: { publicationStatus: PublicationStatus.ARCHIVED },
      select: adminSelect,
    });
    await this.audit?.log({ userId: actorId, action: AuditAction.EVENT_ARCHIVED, module: 'EVENTS', entityType: 'Event', entityId: id, ...context });
    return event;
  }

  private async findOne(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id }, select: adminSelect });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private assertDateRange(startAt: Date, endAt?: Date | null) {
    if (endAt && endAt <= startAt) throw new BadRequestException('End date must be after start date');
  }
}
