import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { DonationRequestsService } from './donation-requests.service';

describe('DonationRequestsService', () => {
  const dto = {
    donorName: 'Persona',
    email: 'persona@example.org',
    kind: 'MONETARY' as const,
    modality: 'DIGITAL' as const,
    paymentPreference: 'SINPE' as const,
    approximateAmount: '1000.00',
    anonymousPublic: true,
  };
  const key = 'test-idempotency-key-123456';
  const request = {
    id: 'e0c8b1d7-81cc-4aca-ae62-e95174b33302',
    status: 'PENDING' as const,
  };
  let createdData: Record<string, unknown> | undefined;
  const create = jest.fn((args: { data: Record<string, unknown> }) => {
    createdData = args.data;
    return Promise.resolve(request);
  });
  const findUnique = jest.fn().mockResolvedValue(null);
  const updateMany = jest.fn().mockResolvedValue({ count: 1 });
  const audit = { log: jest.fn().mockResolvedValue({}) };
  const prisma = {
    donationRequest: {
      findUnique,
      create,
      updateMany,
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ ...request, status: 'IN_REVIEW' }),
    },
    $transaction: jest.fn((callback: (client: unknown) => unknown) =>
      callback(prisma),
    ),
  };
  const service = new DonationRequestsService(
    prisma as PrismaService,
    audit as unknown as AuditService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    createdData = undefined;
    findUnique.mockResolvedValue(null);
    updateMany.mockResolvedValue({ count: 1 });
  });

  it('creates only a pending request and an audit record', async () => {
    await expect(service.create(dto, key)).resolves.toEqual(request);
    expect(createdData).toMatchObject({
      kind: 'MONETARY',
      approximateAmount: '1000.00',
    });
    expect(createdData).not.toHaveProperty('status', 'CONFIRMED');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DONATION_REQUEST_CREATED' }),
      prisma,
    );
  });

  it('rejects invalid contact and goods delivery combinations', async () => {
    await expect(service.create(dto, 'short')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.create({ ...dto, email: undefined }, key),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create(
        {
          ...dto,
          kind: 'IN_KIND',
          modality: 'DIGITAL',
          approximateAmount: undefined,
          goodsDescription: 'Sillas',
        } as never,
        key,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('replays the same key and rejects a changed payload', async () => {
    await service.create(dto, key);
    const hash = String(createdData?.payloadHash);
    findUnique.mockResolvedValue({ ...request, payloadHash: hash });
    await expect(service.create(dto, key)).resolves.toEqual(request);
    await expect(
      service.create({ ...dto, comments: 'Otro aporte' }, key),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('changes status once and audits actor without contact details', async () => {
    await service.transition(request.id, 'IN_REVIEW', 7);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: request.id, status: { in: ['PENDING'] } },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        action: 'DONATION_REQUEST_IN_REVIEW',
        details: { status: 'IN_REVIEW' },
      }),
      prisma,
    );
    updateMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue({ id: request.id });
    await expect(
      service.transition(request.id, 'IN_REVIEW', 7),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
