/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers are typed as any. */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AffiliateRequestsService } from './affiliate-requests.service';

describe('AffiliateRequestsService AFFILIATION-01', () => {
  const request = {
    id: 10,
    personId: 5,
    fullName: 'Ana Pérez',
    identification: '123456789',
    identificationType: 'NATIONAL',
    birthDate: new Date('1990-01-01'),
    gender: null,
    phoneCountryCode: '+506',
    phoneNationalNumber: '88888888',
    phone: '+50688888888',
    email: 'ana@example.com',
    address: 'Curime',
    occupation: null,
    workplace: null,
    affiliationReason: 'Participar',
    status: 'PENDING',
    rejectionReason: null,
    reviewedAt: null,
    reviewedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const person = {
    id: 5,
    firstName: 'Ana',
    firstSurname: 'Pérez',
    secondSurname: null,
    identification: request.identification,
    identificationType: request.identificationType,
    birthDate: request.birthDate,
    phoneCountryCode: request.phoneCountryCode,
    phoneNationalNumber: request.phoneNationalNumber,
    address: request.address,
  };
  const dto = {
    identificationType: 'NATIONAL' as const,
    identification: request.identification,
    firstName: 'Ana',
    firstSurname: 'Pérez',
    birthDate: request.birthDate,
    address: 'Nueva dirección',
    email: request.email,
    affiliationReason: request.affiliationReason,
  };
  const tx = {
    person: { findUnique: jest.fn(), update: jest.fn() },
    affiliate: { findFirst: jest.fn(), create: jest.fn() },
    affiliateRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const prisma = {
    affiliateRequest: { findUnique: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(
      (work: ((client: typeof tx) => unknown) | unknown[]) =>
        typeof work === 'function' ? work(tx) : Promise.resolve(work),
    ),
  };
  const personResolver = { resolveWithinTransaction: jest.fn() };
  const audit = { log: jest.fn() };
  const service = new AffiliateRequestsService(
    prisma as never,
    audit as never,
    personResolver as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    personResolver.resolveWithinTransaction.mockResolvedValue({
      status: 'PERSON_REUSED',
      person,
      profileEnrichmentRequired: false,
    });
    tx.affiliate.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.create.mockResolvedValue({ ...request, status: 'PENDING' });
    tx.affiliateRequest.findUnique.mockResolvedValue(request);
    tx.affiliateRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.affiliateRequest.findUniqueOrThrow.mockResolvedValue({
      ...request,
      status: 'APPROVED',
      reviewedAt: expect.any(Date),
      reviewedById: 99,
    });
    tx.person.findUnique.mockResolvedValue(person);
    tx.affiliate.create.mockResolvedValue({
      id: 20,
      personId: 5,
      status: 'ACTIVE',
      legacyRoleId: null,
    });
    prisma.affiliateRequest.findUnique.mockResolvedValue(request);
    prisma.affiliateRequest.updateMany.mockResolvedValue({ count: 1 });
  });

  it('creates public pending request without authenticated User or JWT context', async () => {
    const result = await service.create(dto, {});

    expect(result).toMatchObject({ status: 'PENDING' });
    expect(personResolver.resolveWithinTransaction).toHaveBeenCalledWith(
      dto,
      tx,
    );
    expect(tx.affiliateRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          personId: 5,
          fullName: 'Ana Pérez',
          identification: dto.identification,
          status: 'PENDING',
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalled();
  });

  it('resolves valid Person identity before creating request', async () => {
    await service.create(dto);

    expect(personResolver.resolveWithinTransaction).toHaveBeenCalledTimes(1);
    expect(tx.person.findUnique).not.toHaveBeenCalled();
    expect(tx.affiliateRequest.create.mock.calls[0][0].data.personId).toBe(5);
  });

  it('protects public create from existing Affiliate and pending duplicates', async () => {
    tx.affiliate.findFirst.mockResolvedValueOnce({ id: 1 });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);

    tx.affiliate.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.findFirst.mockResolvedValue({ id: 2 });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('approves only PENDING request and creates Affiliate without roleId', async () => {
    const result = await service.approve(10, 99, {});

    expect(tx.affiliate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ personId: 5, email: request.email }),
      }),
    );
    expect(tx.affiliate.create.mock.calls[0][0].data).not.toHaveProperty(
      'legacyRoleId',
    );
    expect(result.affiliate).toMatchObject({ id: 20, legacyRoleId: null });
    expect(tx.affiliateRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10, status: 'PENDING' },
        data: expect.objectContaining({
          status: 'APPROVED',
          reviewedAt: expect.any(Date),
          reviewedById: 99,
        }),
      }),
    );
  });

  it('does not create User or mutate User.roleId during approval', async () => {
    await service.approve(10, 99, {});

    expect(tx).not.toHaveProperty('user');
    expect(tx.affiliate.create.mock.calls[0][0].data).not.toHaveProperty('roleId');
  });

  it('rejects resolved request and records reason and review metadata', async () => {
    await service.reject(10, 'No cumple requisitos', 99, {});

    expect(prisma.affiliateRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 10, status: 'PENDING' },
      data: expect.objectContaining({
        status: 'REJECTED',
        rejectionReason: 'No cumple requisitos',
        reviewedAt: expect.any(Date),
        reviewedById: 99,
      }),
    });
    expect(tx.affiliate.create).not.toHaveBeenCalled();
  });

  it('rejects approval when request is no longer PENDING', async () => {
    tx.affiliateRequest.findUnique.mockResolvedValue({ ...request, status: 'REJECTED' });

    await expect(service.approve(10, 99, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.affiliate.create).not.toHaveBeenCalled();
  });

  it('rejects approval when Person identity does not resolve consistently', async () => {
    tx.person.findUnique.mockResolvedValue({ ...person, firstName: 'Otra' });

    await expect(service.approve(10, 99, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.affiliate.create).not.toHaveBeenCalled();
  });

  it('rejects missing request', async () => {
    tx.affiliateRequest.findUnique.mockResolvedValue(null);

    await expect(service.approve(10, 99, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
