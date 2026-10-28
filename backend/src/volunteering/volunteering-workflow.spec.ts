import { BadRequestException, ConflictException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import {
  VolunteeringApplicationsController,
  VolunteeringOpportunitiesController,
} from './volunteering-opportunities.controller';
import { VolunteeringOpportunitiesService } from './volunteering-opportunities.service';

describe('volunteering ERP workflow', () => {
  const tx = {
    $queryRaw: jest.fn(),
    volunteerOpportunity: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    volunteerSession: { count: jest.fn(), create: jest.fn() },
  };
  const prisma = { $transaction: jest.fn() };
  const audit = { log: jest.fn() };
  const service = new VolunteeringOpportunitiesService(
    prisma as never,
    audit as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    );
    tx.volunteerOpportunity.findUnique.mockResolvedValue({
      status: 'DRAFT',
      applicationDeadline: null,
    });
    tx.volunteerOpportunity.updateMany.mockResolvedValue({ count: 1 });
    tx.volunteerOpportunity.findUniqueOrThrow.mockResolvedValue({
      id: 4,
      status: 'PUBLISHED',
    });
    tx.volunteerSession.count.mockResolvedValue(1);
  });

  it('guards publication, closure and review with existing ERP capabilities', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, VolunteeringOpportunitiesController),
    ).toEqual([JwtAuthGuard, CapabilityGuard]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, VolunteeringApplicationsController),
    ).toEqual([JwtAuthGuard, CapabilityGuard]);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        Reflect.get(VolunteeringOpportunitiesController.prototype, 'publish'),
      ),
    ).toEqual(['vol.opportunities.update']);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        Reflect.get(VolunteeringOpportunitiesController.prototype, 'close'),
      ),
    ).toEqual(['vol.opportunities.update']);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        Reflect.get(VolunteeringApplicationsController.prototype, 'list'),
      ),
    ).toEqual(['vol.opportunities.read']);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        Reflect.get(VolunteeringApplicationsController.prototype, 'approve'),
      ),
    ).toEqual(['vol.opportunities.update']);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        Reflect.get(VolunteeringApplicationsController.prototype, 'reject'),
      ),
    ).toEqual(['vol.opportunities.update']);
  });

  it('publishes only a draft with a future session', async () => {
    const dateMatcher: unknown = expect.any(Date);
    await service.publish(4, 3);
    expect(tx.volunteerSession.count).toHaveBeenCalledWith({
      where: {
        opportunityId: 4,
        status: 'SCHEDULED',
        startAt: { gt: dateMatcher },
        endAt: { gt: dateMatcher },
      },
    });
    expect(tx.volunteerOpportunity.updateMany).toHaveBeenCalledWith({
      where: { id: 4, status: 'DRAFT' },
      data: {
        status: 'PUBLISHED',
        publishedAt: dateMatcher,
      },
    });
    tx.volunteerSession.count.mockResolvedValueOnce(0);
    await expect(service.publish(4, 3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('closes published opportunities and refuses repeated transitions', async () => {
    const dateMatcher: unknown = expect.any(Date);
    tx.volunteerOpportunity.findUnique.mockResolvedValueOnce({
      status: 'PUBLISHED',
      applicationDeadline: null,
    });
    await service.close(4, 3);
    expect(tx.volunteerOpportunity.updateMany).toHaveBeenCalledWith({
      where: { id: 4, status: 'PUBLISHED' },
      data: { status: 'CLOSED', closedAt: dateMatcher },
    });
    await expect(service.close(4, 3)).rejects.toBeInstanceOf(ConflictException);
  });
});
