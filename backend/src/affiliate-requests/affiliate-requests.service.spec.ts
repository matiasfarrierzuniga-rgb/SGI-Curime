import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PersonLogicalIdentityRaceError } from '../identity/runtime-person-resolver.service';
import { AuditAction } from '../audit/audit-actions';
import { AffiliateRequestsService } from './affiliate-requests.service';

describe('AffiliateRequestsService', () => {
  const pending = {
    id: 10,
    personId: 5,
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
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    affiliate: { create: jest.fn(), findFirst: jest.fn() },
  };
  const prisma = {
    affiliateRequest: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    affiliate: { findFirst: jest.fn() },
    $transaction: jest.fn((operation: (client: typeof tx) => unknown) =>
      operation(tx),
    ),
  };
  const audit = { log: jest.fn() };
  const personResolver = { resolveWithinTransaction: jest.fn() };
  const service = new AffiliateRequestsService(
    prisma as never,
    personResolver as never,
    audit as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.affiliate.findFirst.mockResolvedValue(null);
    tx.affiliate.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.findUnique.mockResolvedValue(pending);
    prisma.affiliateRequest.findUnique.mockResolvedValue(pending);
    tx.affiliateRequest.create.mockResolvedValue(pending);
    prisma.affiliateRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.affiliateRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.affiliateRequest.findUniqueOrThrow.mockResolvedValue({
      ...pending,
      status: 'APPROVED',
      reviewedById: 1,
    });
    tx.affiliate.create.mockResolvedValue({ id: 20, status: 'ACTIVE' });
    audit.log.mockResolvedValue({ id: 1 });
    personResolver.resolveWithinTransaction.mockResolvedValue({
      status: 'PERSON_CREATED',
      person: { id: 5 },
      profileEnrichmentRequired: false,
    });
  });

  it('creates only a pending request', async () => {
    await service.create({
      firstName: 'Persona',
      firstSurname: 'Afiliada',
      identificationType: pending.identificationType,
      identification: pending.identification,
      birthDate: pending.birthDate,
      email: pending.email,
      address: pending.address,
      affiliationReason: pending.affiliationReason,
    });
    expect(tx.affiliateRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          fullName: 'Persona Afiliada',
          identification: pending.identification,
          identificationType: pending.identificationType,
          birthDate: pending.birthDate,
          gender: undefined,
          phoneCountryCode: undefined,
          phoneNationalNumber: undefined,
          email: pending.email,
          address: pending.address,
          occupation: undefined,
          workplace: undefined,
          affiliationReason: pending.affiliationReason,
          personId: 5,
          status: 'PENDING',
        },
      }),
    );
    expect(personResolver.resolveWithinTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Persona' }),
      tx,
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(tx.affiliate.create).not.toHaveBeenCalled();
  });

  it('retries the whole Person-first transaction after a logical identity race', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new PersonLogicalIdentityRaceError(),
    );

    await service.create({
      firstName: 'Persona',
      firstSurname: 'Afiliada',
      identificationType: pending.identificationType,
      identification: pending.identification,
      birthDate: pending.birthDate,
      address: pending.address,
      affiliationReason: pending.affiliationReason,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('rejects duplicates already present in the affiliate registry', async () => {
    tx.affiliate.findFirst.mockResolvedValue({ id: 2 });
    await expect(
      service.create({
        firstName: 'Persona',
        firstSurname: 'Afiliada',
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
    tx.affiliateRequest.findFirst.mockResolvedValue({ id: 3 });
    await expect(
      service.create({
        firstName: 'Persona',
        firstSurname: 'Afiliada',
        identificationType: pending.identificationType,
        identification: pending.identification,
        birthDate: pending.birthDate,
        email: pending.email,
        address: pending.address,
        affiliationReason: pending.affiliationReason,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects structured identity conflicts without creating a request', async () => {
    personResolver.resolveWithinTransaction.mockResolvedValue({
      status: 'IDENTITY_CONFLICT',
      conflictFields: ['firstName'],
    });

    await expect(
      service.create({
        firstName: 'Persona',
        firstSurname: 'Afiliada',
        identificationType: pending.identificationType,
        identification: pending.identification,
        birthDate: pending.birthDate,
        address: pending.address,
        affiliationReason: pending.affiliationReason,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.affiliateRequest.create).not.toHaveBeenCalled();
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
      data: {
        personId: pending.personId,
        fullName: pending.fullName,
        identification: pending.identification,
        identificationType: pending.identificationType,
        birthDate: pending.birthDate,
        gender: pending.gender,
        phoneCountryCode: pending.phoneCountryCode,
        phoneNationalNumber: pending.phoneNationalNumber,
        email: pending.email,
        address: pending.address,
        occupation: pending.occupation,
        workplace: pending.workplace,
      },
    });
    expect(personResolver.resolveWithinTransaction).not.toHaveBeenCalled();
    expect(result.affiliate.id).toBe(20);
    expect(result.affiliate.status).toBe('ACTIVE');
    expect(audit.log).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: AuditAction.AFFILIATE_CREATED,
        entityId: 20,
        userId: 1,
      }),
    );
    expect(audit.log).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: AuditAction.AFFILIATE_REQUEST_APPROVED,
        entityId: 10,
        userId: 1,
      }),
    );
  });

  it('rejects successfully, persists review data, and audits the decision', async () => {
    const rejected = {
      ...pending,
      status: 'REJECTED',
      rejectionReason: 'Documentación incompleta',
      reviewedById: 1,
    };
    prisma.affiliateRequest.findUnique
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(rejected);

    await expect(
      service.reject(10, rejected.rejectionReason, 1),
    ).resolves.toEqual(rejected);

    expect(prisma.affiliateRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10, status: 'PENDING' },
        data: expect.objectContaining({
          status: 'REJECTED',
          rejectionReason: rejected.rejectionReason,
          reviewedById: 1,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.AFFILIATE_REQUEST_REJECTED,
        entityId: 10,
        userId: 1,
      }),
    );
  });

  it('does not process an already reviewed request through approve or reject', async () => {
    const rejectedRequest = {
      ...pending,
      status: 'REJECTED',
    };
    prisma.affiliateRequest.findUnique.mockResolvedValue(rejectedRequest);
    tx.affiliateRequest.findUnique.mockResolvedValue(rejectedRequest);
    await expect(service.approve(10, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(
      service.reject(10, 'Documentación incompleta', 1),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents duplicate processing when the approval claim affects no request', async () => {
    tx.affiliateRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.approve(10, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(tx.affiliate.create).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('prevents duplicate processing when the rejection claim affects no request', async () => {
    prisma.affiliateRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.reject(10, 'Documentación incompleta', 1),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('rejects approval when the affiliate already exists', async () => {
    tx.affiliate.findFirst.mockResolvedValue({ id: 20 });

    await expect(service.approve(10, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(tx.affiliate.create).not.toHaveBeenCalled();
  });

  it('blocks a legacy request without personId without identity fallback', async () => {
    tx.affiliateRequest.findUnique.mockResolvedValue({
      ...pending,
      personId: null,
    });

    await expect(service.approve(10, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.affiliate.findFirst).not.toHaveBeenCalled();
    expect(tx.affiliate.create).not.toHaveBeenCalled();
    expect(personResolver.resolveWithinTransaction).not.toHaveBeenCalled();
  });

  it('maps Affiliate personId unique races to a conflict', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('unique race', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    await expect(service.approve(10, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('propagates affiliate creation failure without emitting post-transaction audit events', async () => {
    tx.affiliate.create.mockRejectedValue(new Error('database failure'));

    await expect(service.approve(10, 1)).rejects.toThrow('database failure');

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown request', async () => {
    prisma.affiliateRequest.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
