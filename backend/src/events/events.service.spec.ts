import { BadRequestException } from '@nestjs/common';
import { EventStatus, PublicationStatus } from '../../generated/prisma/enums';
import { AuditAction } from '../audit/audit-actions';
import { EventsService } from './events.service';

const startAt = new Date('2030-01-02T10:00:00.000Z');
const event = {
  id: 7,
  publicId: '3a7fd28e-b5b1-4a9c-ae4c-5e07d8282bf9',
  title: 'Reunión comunitaria',
  summary: 'Información pública.',
  description: null,
  startAt,
  endAt: null,
  location: 'Salón comunal',
  status: EventStatus.SCHEDULED,
  publicationStatus: PublicationStatus.DRAFT,
  createdAt: startAt,
  updatedAt: startAt,
};

describe('EventsService', () => {
  const prisma = {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = { log: jest.fn() };
  const service = new EventsService(prisma as never, audit as never);

  beforeEach(() => jest.clearAllMocks());

  it.each([PublicationStatus.INTERNAL, PublicationStatus.DRAFT, PublicationStatus.REVIEW, PublicationStatus.ARCHIVED])(
    'hides %s events from public responses',
    async (publicationStatus) => {
      prisma.event.findMany.mockResolvedValue([]);

      await expect(service.findPublic()).resolves.toEqual([]);
      expect(prisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { publicationStatus: PublicationStatus.PUBLISHED },
      }));
      expect(publicationStatus).not.toBe(PublicationStatus.PUBLISHED);
    },
  );

  it('returns only allow-listed fields for published events', async () => {
    prisma.event.findMany.mockResolvedValue([{ ...event, publicationStatus: PublicationStatus.PUBLISHED }]);

    await expect(service.findPublic()).resolves.toEqual([{
      publicId: event.publicId,
      title: event.title,
      summary: event.summary,
      description: event.description,
      startAt: event.startAt,
      endAt: event.endAt,
      location: event.location,
      status: event.status,
    }]);
  });

  it('publishes a cancelled event without changing its business status', async () => {
    prisma.event.findUnique.mockResolvedValue({ ...event, status: EventStatus.CANCELLED });
    prisma.event.update.mockResolvedValue({ ...event, status: EventStatus.CANCELLED, publicationStatus: PublicationStatus.PUBLISHED });

    const result = await service.publish(event.id, 3);

    expect(result.status).toBe(EventStatus.CANCELLED);
    expect(prisma.event.update).toHaveBeenCalledWith(expect.objectContaining({ data: { publicationStatus: PublicationStatus.PUBLISHED } }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: AuditAction.EVENT_PUBLISHED, userId: 3 }));
  });

  it('rejects an end date before its start date', async () => {
    await expect(service.create({ ...event, startAt, endAt: new Date('2030-01-02T09:00:00.000Z') }, 3)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('archives through AuditService', async () => {
    prisma.event.findUnique.mockResolvedValue(event);
    prisma.event.update.mockResolvedValue({ ...event, publicationStatus: PublicationStatus.ARCHIVED });

    await service.archive(event.id, 3);

    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: AuditAction.EVENT_ARCHIVED, userId: 3 }));
  });
});
