import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuditAction } from '../audit/audit-actions';
import { EntrepreneurshipService } from './entrepreneurship.service';

const venture = {
  id: 7,
  name: 'Café Curime',
  description: null,
  offerDescription: null,
  businessPhone: null,
  businessEmail: null,
  websiteUrl: null,
  socialUrl: null,
  locationText: null,
  status: 'ACTIVE',
  publicationStatus: 'UNPUBLISHED',
  incorporatedAt: new Date('2020-01-01T00:00:00.000Z'),
  createdAt: new Date('2020-01-01T00:00:00.000Z'),
  updatedAt: new Date('2020-01-01T00:00:00.000Z'),
  associations: [{
    id: 11,
    personId: 3,
    ventureId: 7,
    startedAt: new Date('2020-01-01T00:00:00.000Z'),
    endedAt: null,
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    person: {
      id: 3,
      firstName: 'Ana',
      firstSurname: 'Mora',
      secondSurname: null,
      identification: '1-1111-1111',
      identificationType: 'NATIONAL',
    },
  }],
};

describe('EntrepreneurshipService', () => {
  const prisma = {
    $transaction: jest.fn(),
    venture: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const audit = { log: jest.fn() };
  const service = new EntrepreneurshipService(prisma as never, audit as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue([[], 0]);
  });

  it('lists three matching ventures with search, combined filters, and frontend pagination', async () => {
    const matchingVentures = [
      { ...venture, id: 1, name: 'Postres Ana' },
      { ...venture, id: 2, name: 'Café Curime', description: 'Postres caseros' },
      { ...venture, id: 3, name: 'Dulces', offerDescription: 'Postres para eventos' },
    ];
    prisma.$transaction.mockResolvedValue([matchingVentures, 3]);

    await expect(service.findAll({
      search: 'postre',
      status: 'ACTIVE' as never,
      publicationStatus: 'UNPUBLISHED' as never,
      page: 2,
      limit: 10,
    })).resolves.toEqual({ data: matchingVentures, total: 3, page: 2, limit: 10 });
    expect(prisma.venture.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 10,
      take: 10,
      where: {
        status: 'ACTIVE',
        publicationStatus: 'UNPUBLISHED',
        OR: [
          { name: { contains: 'postre', mode: 'insensitive' } },
          { description: { contains: 'postre', mode: 'insensitive' } },
          { offerDescription: { contains: 'postre', mode: 'insensitive' } },
          { businessEmail: { contains: 'postre', mode: 'insensitive' } },
        ],
      },
    }));
    expect(prisma.venture.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'ACTIVE', publicationStatus: 'UNPUBLISHED' }),
    }));
  });

  it('does not retain prior filters when a later frontend query resets or changes them', async () => {
    await service.findAll({ status: 'ACTIVE' as never, page: 1, limit: 20 });
    await service.findAll({ page: 1, limit: 20 });
    await service.findAll({ publicationStatus: 'PUBLISHED' as never, page: 1, limit: 20 });

    expect(prisma.venture.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { status: 'ACTIVE', publicationStatus: undefined, OR: undefined },
    }));
    expect(prisma.venture.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { status: undefined, publicationStatus: undefined, OR: undefined },
    }));
    expect(prisma.venture.findMany).toHaveBeenNthCalledWith(3, expect.objectContaining({
      where: { status: undefined, publicationStatus: 'PUBLISHED', OR: undefined },
    }));
  });

  it('returns venture detail with its canonical Person associations', async () => {
    prisma.venture.findUnique.mockResolvedValue(venture);

    await expect(service.findOne(7)).resolves.toEqual(venture);
    expect(prisma.venture.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7 },
      select: expect.objectContaining({ associations: expect.any(Object) }),
    }));
  });

  it('does not require an associated Person to create a venture', async () => {
    const dto = { name: 'Café Curime', incorporatedAt: new Date('2020-01-01') };
    prisma.venture.create.mockResolvedValue({ ...venture, associations: [] });

    await service.create(dto, 2);

    expect(prisma.venture.create).toHaveBeenCalledWith(expect.objectContaining({ data: dto }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: AuditAction.VENTURE_CREATED,
      entityId: 7,
      userId: 2,
    }));
  });

  it('updates only supplied mutable fields and audits them', async () => {
    prisma.venture.findUnique.mockResolvedValue(venture);
    prisma.venture.update.mockResolvedValue({ ...venture, name: 'Nuevo nombre' });

    await service.update(7, { name: 'Nuevo nombre' }, 2);

    expect(prisma.venture.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7 },
      data: { name: 'Nuevo nombre' },
    }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: AuditAction.VENTURE_UPDATED,
      details: { fields: ['name'] },
    }));
  });

  it('returns not found for unknown venture detail', async () => {
    prisma.venture.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists only active published ventures with search, stable pagination, and public fields', async () => {
    const publicRecord = {
      ...venture,
      publicationStatus: 'PUBLISHED',
      incorporatedAt: new Date('2020-01-01T00:00:00.000Z'),
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
      associations: [],
    };
    prisma.$transaction.mockResolvedValue([[publicRecord], 1]);

    await expect(service.findPublic({ search: ' café ', page: 2, limit: 10 })).resolves.toEqual({
      data: [{
        id: venture.id,
        name: venture.name,
        description: venture.description,
        offerDescription: venture.offerDescription,
        businessPhone: venture.businessPhone,
        businessEmail: venture.businessEmail,
        websiteUrl: venture.websiteUrl,
        socialUrl: venture.socialUrl,
        locationText: venture.locationText,
      }],
      total: 1,
      page: 2,
      limit: 10,
    });
    expect(prisma.venture.findMany).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
        publicationStatus: 'PUBLISHED',
        OR: [
          { name: { contains: ' café ', mode: 'insensitive' } },
          { description: { contains: ' café ', mode: 'insensitive' } },
          { offerDescription: { contains: ' café ', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        offerDescription: true,
        businessPhone: true,
        businessEmail: true,
        websiteUrl: true,
        socialUrl: true,
        locationText: true,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: 10,
      take: 10,
    });
    expect(prisma.venture.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'ACTIVE', publicationStatus: 'PUBLISHED' }),
    }));
  });

  it.each([
    { status: 'SUSPENDED', publicationStatus: 'PUBLISHED' },
    { status: 'ACTIVE', publicationStatus: 'UNPUBLISHED' },
  ])(
    'does not reveal $status/$publicationStatus ventures through public detail',
    async () => {
      prisma.venture.findFirst.mockResolvedValue(null);

      await expect(service.findPublicOne(venture.id)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.venture.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          id: venture.id,
          status: 'ACTIVE',
          publicationStatus: 'PUBLISHED',
        },
      }));
    },
  );

  it('returns 404 for a nonexistent public venture', async () => {
    prisma.venture.findFirst.mockResolvedValue(null);

    await expect(service.findPublicOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns only approved fields for public venture detail', async () => {
    prisma.venture.findFirst.mockResolvedValue({
      ...venture,
      publicationStatus: 'PUBLISHED',
      incorporatedAt: new Date('2020-01-01T00:00:00.000Z'),
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
      associations: [],
    });

    await expect(service.findPublicOne(venture.id)).resolves.toEqual({
      id: venture.id,
      name: venture.name,
      description: venture.description,
      offerDescription: venture.offerDescription,
      businessPhone: venture.businessPhone,
      businessEmail: venture.businessEmail,
      websiteUrl: venture.websiteUrl,
      socialUrl: venture.socialUrl,
      locationText: venture.locationText,
    });
    expect(prisma.venture.findFirst).toHaveBeenCalledWith({
      where: {
        id: venture.id,
        status: 'ACTIVE',
        publicationStatus: 'PUBLISHED',
      },
      select: {
        id: true,
        name: true,
        description: true,
        offerDescription: true,
        businessPhone: true,
        businessEmail: true,
        websiteUrl: true,
        socialUrl: true,
        locationText: true,
      },
    });
  });

  it('publishes only active unpublished ventures atomically and audits the transition', async () => {
    prisma.venture.findUnique.mockResolvedValue(venture);
    prisma.venture.updateMany.mockResolvedValue({ count: 1 });
    prisma.venture.findUniqueOrThrow.mockResolvedValue({ ...venture, publicationStatus: 'PUBLISHED' });
    prisma.$transaction.mockImplementation(async (operation: (tx: { venture: typeof prisma.venture }) => Promise<unknown>) => operation({ venture: prisma.venture }));

    await expect(service.publish(7, 2)).resolves.toMatchObject({ publicationStatus: 'PUBLISHED' });
    expect(prisma.venture.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7, publicationStatus: 'UNPUBLISHED', status: 'ACTIVE' },
      data: { publicationStatus: 'PUBLISHED' },
    }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: AuditAction.VENTURE_PUBLISHED,
      details: { from: 'UNPUBLISHED', to: 'PUBLISHED' },
    }), expect.anything());
  });

  it('rejects inactive publication and concurrent transition conflicts without auditing', async () => {
    prisma.$transaction.mockImplementation(async (operation: (tx: { venture: typeof prisma.venture }) => Promise<unknown>) => operation({ venture: prisma.venture }));
    prisma.venture.findUnique.mockResolvedValue({ ...venture, status: 'SUSPENDED' });
    await expect(service.publish(7, 2)).rejects.toBeInstanceOf(BadRequestException);

    prisma.venture.findUnique.mockResolvedValue(venture);
    prisma.venture.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.publish(7, 2)).rejects.toBeInstanceOf(ConflictException);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('unpublishes only published ventures and audits the transition', async () => {
    prisma.venture.findUnique.mockResolvedValue({ ...venture, publicationStatus: 'PUBLISHED' });
    prisma.venture.updateMany.mockResolvedValue({ count: 1 });
    prisma.venture.findUniqueOrThrow.mockResolvedValue(venture);
    prisma.$transaction.mockImplementation(async (operation: (tx: { venture: typeof prisma.venture }) => Promise<unknown>) => operation({ venture: prisma.venture }));

    await service.unpublish(7, 2);

    expect(prisma.venture.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7, publicationStatus: 'PUBLISHED' },
      data: { publicationStatus: 'UNPUBLISHED' },
    }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: AuditAction.VENTURE_UNPUBLISHED }), expect.anything());
  });
});
