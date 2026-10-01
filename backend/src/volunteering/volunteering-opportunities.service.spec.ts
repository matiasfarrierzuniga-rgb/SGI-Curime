import { NotFoundException } from '@nestjs/common';
import { AuditAction } from '../audit/audit-actions';
import { VolunteeringOpportunitiesService } from './volunteering-opportunities.service';

const opportunity = {
  id: 7,
  title: 'Limpieza del parque',
  description: 'Jornada comunitaria',
  location: 'Parque central',
  capacity: 20,
  applicationDeadline: new Date('2026-02-01T12:00:00.000Z'),
  status: 'DRAFT',
  createdByUserId: 2,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('VolunteeringOpportunitiesService', () => {
  const prisma = {
    $transaction: jest.fn(),
    volunteerOpportunity: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = { log: jest.fn() };
  const service = new VolunteeringOpportunitiesService(
    prisma as never,
    audit as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue([[], 0]);
  });

  it('returns search and status-filtered pagination response', async () => {
    const matches = [{ ...opportunity, id: 1 }, { ...opportunity, id: 2 }];
    prisma.$transaction.mockResolvedValue([matches, 2]);

    await expect(
      service.findAll({
        search: 'parque',
        status: 'PUBLISHED' as never,
        page: 2,
        limit: 10,
      }),
    ).resolves.toEqual({ data: matches, total: 2, page: 2, limit: 10 });
    expect(prisma.volunteerOpportunity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: 'parque', mode: 'insensitive' } },
            { description: { contains: 'parque', mode: 'insensitive' } },
            { location: { contains: 'parque', mode: 'insensitive' } },
          ],
        },
      }),
    );
    expect(prisma.volunteerOpportunity.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ status: 'PUBLISHED' }),
    });
  });

  it('returns not found for an unknown opportunity', async () => {
    prisma.volunteerOpportunity.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates with actor and audit context', async () => {
    const dto = { title: 'Limpieza del parque' };
    prisma.volunteerOpportunity.create.mockResolvedValue(opportunity);

    await service.create(dto, 2, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });

    expect(prisma.volunteerOpportunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { ...dto, createdByUserId: 2 },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        action: AuditAction.VOLUNTEER_OPPORTUNITY_CREATED,
        entityId: 7,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }),
    );
  });

  it('updates only supplied mutable fields and audits actor context', async () => {
    prisma.volunteerOpportunity.findUnique.mockResolvedValue(opportunity);
    prisma.volunteerOpportunity.update.mockResolvedValue({
      ...opportunity,
      title: 'Limpieza del río',
    });

    await service.update(
      7,
      { title: 'Limpieza del río' },
      3,
      { ipAddress: '::1', userAgent: 'test-agent' },
    );

    expect(prisma.volunteerOpportunity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: { title: 'Limpieza del río' },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 3,
        action: AuditAction.VOLUNTEER_OPPORTUNITY_UPDATED,
        entityId: 7,
        details: { fields: ['title'] },
        ipAddress: '::1',
        userAgent: 'test-agent',
      }),
    );
  });
});
