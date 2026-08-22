import { ConflictException, NotFoundException } from '@nestjs/common';
import { AffiliateRequestsService } from './affiliate-requests.service';

describe('AffiliateRequestsService', () => {
  const pending = {
    id: 10,
    fullName: 'Persona Afiliada',
    identificationType: 'NATIONAL' as const,
    identification: '123456789',
    birthDate: new Date('1990-01-01'),
    gender: null,
    phoneCountryCode: null,
    phoneNationalNumber: null,
    email: 'affiliate@example.com',
    address: 'Curime',
    occupation: null,
    workplace: null,
    affiliationReason: 'Participar en la comunidad',
    status: 'PENDING',
    rejectionReason: null,
    reviewedAt: null,
    reviewedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const tx = {
    affiliateRequest: {
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    affiliate: { create: jest.fn() },
  };
  const prisma = {
    affiliateRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    affiliate: { findFirst: jest.fn() },
    $transaction: jest.fn((operation: (client: typeof tx) => unknown) =>
      operation(tx),
    ),
  };
  const audit = { log: jest.fn() };
  const service = new AffiliateRequestsService(prisma as never, audit as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.affiliate.findFirst.mockResolvedValue(null);
    prisma.affiliateRequest.findFirst.mockResolvedValue(null);
    prisma.affiliateRequest.findUnique.mockResolvedValue(pending);
    prisma.affiliateRequest.create.mockResolvedValue(pending);
    prisma.affiliateRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.affiliateRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.affiliateRequest.findUniqueOrThrow.mockResolvedValue({
      ...pending,
      status: 'APPROVED',
      reviewedById: 1,
    });
    tx.affiliate.create.mockResolvedValue({ id: 20, status: 'ACTIVE' });
    audit.log.mockResolvedValue({ id: 1 });
  });

  it('creates only a pending request', async () => {
    await service.create({
      fullName: pending.fullName,
      identificationType: pending.identificationType,
      identification: pending.identification,
      birthDate: pending.birthDate,
      email: pending.email,
      address: pending.address,
      affiliationReason: pending.affiliationReason,
    });
    expect(prisma.affiliateRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING' }),
      }),
    );
    expect(tx.affiliate.create).not.toHaveBeenCalled();
  });

  it('rejects duplicates already present in the affiliate registry', async () => {
    prisma.affiliate.findFirst.mockResolvedValue({ id: 2 });
    await expect(
      service.create({
        fullName: pending.fullName,
        identificationType: pending.identificationType,
        identification: pending.identification,
        birthDate: pending.birthDate,
        email: pending.email,
        address: pending.address,
        affiliationReason: pending.affiliationReason,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a pending duplicate by identification or email', async () => {
    prisma.affiliateRequest.findFirst.mockResolvedValue({ id: 3 });
    await expect(service.create({
      fullName: pending.fullName,
      identificationType: pending.identificationType,
      identification: pending.identification,
      birthDate: pending.birthDate,
      email: pending.email,
      address: pending.address,
      affiliationReason: pending.affiliationReason,
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('approves atomically and creates an Affiliate, not a User', async () => {
    const result = await service.approve(10, 1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.affiliateRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10, status: 'PENDING' },
        data: expect.objectContaining({
          status: 'APPROVED',
          reviewedById: 1,
        }),
      }),
    );
    expect(tx.affiliate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identification: pending.identification,
        email: pending.email,
      }),
    });
    expect(result.affiliate.id).toBe(20);
  });

  it('does not resolve an already reviewed request', async () => {
    prisma.affiliateRequest.findUnique.mockResolvedValue({
      ...pending,
      status: 'REJECTED',
    });
    await expect(service.approve(10, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns 404 for an unknown request', async () => {
    prisma.affiliateRequest.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
