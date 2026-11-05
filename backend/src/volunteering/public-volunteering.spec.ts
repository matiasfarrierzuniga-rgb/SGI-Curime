import { GUARDS_METADATA } from '@nestjs/common/constants';
import { NotFoundException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryPublicVolunteerOpportunitiesDto } from './dto/volunteer-opportunity.dto';
import { PublicVolunteeringOpportunitiesController } from './volunteering-opportunities.controller';
import { VolunteeringOpportunitiesService } from './volunteering-opportunities.service';

describe('public volunteering opportunities', () => {
  const prisma = {
    $transaction: jest.fn(),
    volunteerOpportunity: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    volunteerSession: { count: jest.fn() },
  };
  const service = new VolunteeringOpportunitiesService(
    prisma as never,
    { log: jest.fn() } as never,
  );
  const controller = new PublicVolunteeringOpportunitiesController(service, {
    submit: jest.fn(),
  } as never);

  beforeEach(() => jest.clearAllMocks());

  it('has no administrative guards and validates pagination', async () => {
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        PublicVolunteeringOpportunitiesController,
      ),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        Reflect.get(
          PublicVolunteeringOpportunitiesController.prototype,
          'apply',
        ),
      ),
    ).toEqual([ThrottlerGuard]);
    const query = plainToInstance(QueryPublicVolunteerOpportunitiesDto, {
      search: '  parque  ',
      page: '2',
      limit: '12',
    });
    expect(await validate(query)).toEqual([]);
    expect(query).toMatchObject({ search: 'parque', page: 2, limit: 12 });
    expect(
      await validate(
        plainToInstance(QueryPublicVolunteerOpportunitiesDto, {
          page: '0',
          limit: '101',
        }),
      ),
    ).not.toEqual([]);
  });

  it('lists only published records and selects no private or administrative fields', async () => {
    prisma.$transaction.mockResolvedValue([[{ id: 5, title: 'Parque' }], 1]);
    await expect(
      controller.findAll({ page: 2, limit: 12, search: 'parque' }),
    ).resolves.toEqual({
      data: [{ id: 5, title: 'Parque' }],
      total: 1,
      page: 2,
      limit: 12,
    });
    expect(prisma.volunteerOpportunity.findMany).toHaveBeenCalledWith({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: 'parque', mode: 'insensitive' } },
          { description: { contains: 'parque', mode: 'insensitive' } },
          { location: { contains: 'parque', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        capacity: true,
        applicationDeadline: true,
      },
      skip: 12,
      take: 12,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
    expect(prisma.volunteerOpportunity.count).toHaveBeenCalledWith({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: 'parque', mode: 'insensitive' } },
          { description: { contains: 'parque', mode: 'insensitive' } },
          { location: { contains: 'parque', mode: 'insensitive' } },
        ],
      },
    });
  });

  it('hides unpublished details as not found', async () => {
    prisma.volunteerOpportunity.findFirst.mockResolvedValue(null);
    await expect(controller.findOne(5)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.volunteerOpportunity.findFirst).toHaveBeenCalledWith({
      where: { id: 5, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        capacity: true,
        applicationDeadline: true,
      },
    });
  });
});
