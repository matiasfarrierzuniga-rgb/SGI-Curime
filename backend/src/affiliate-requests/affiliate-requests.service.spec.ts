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
    submittedProvinceCode: null,
    submittedCantonCode: null,
    submittedDistrictCode: null,
    submittedCommunity: null,
    submittedLocalityKey: null,
    submittedLocalityCategory: null,
    submittedTerritorialSource: null,
    submittedTerritorialVersion: null,
    submittedTerritorialIntegrity: null,
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
          submittedFullName: 'Ana Pérez',
          submittedIdentification: dto.identification,
          submittedAffiliationReason: dto.affiliationReason,
          status: 'PENDING',
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalled();
  });

  it('persists declared territorial values only as immutable request snapshots', async () => {
    const declaredDto = {
      ...dto,
      provinceCode: '7',
      cantonCode: '02',
      districtCode: '01',
      community: 'Curime Centro',
    };

    await service.create(declaredDto, {});

    expect(tx.affiliateRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          submittedProvinceCode: '7',
          submittedCantonCode: '02',
          submittedDistrictCode: '01',
          submittedCommunity: 'Curime Centro',
        }),
      }),
    );
    expect(tx.person.update).not.toHaveBeenCalled();
  });

  it('persists only the canonical territorial snapshot returned by the catalog', async () => {
    const territorialCatalog = {
      validate: jest.fn().mockReturnValue({
        catalogVersion: 'fixture-v1',
        source: { title: 'Fixture sintético', archiveSha256: 'a'.repeat(64) },
        province: { code: '5', name: 'GUANACASTE' },
        canton: { code: '02', name: 'NICOYA' },
        district: { code: '01', name: 'NICOYA' },
        locality: { localityKey: 'loc_1234567890abcdef12345678', name: 'CURIME', category: 'POBLADO' },
      }),
    };
    const catalogService = new AffiliateRequestsService(
      prisma as never, audit as never, personResolver as never, undefined, territorialCatalog as never,
    );

    await catalogService.create({
      ...dto, catalogVersion: 'fixture-v1', provinceCode: '5', cantonCode: '02', districtCode: '01',
      localityKey: 'loc_1234567890abcdef12345678', community: 'texto manipulado',
    }, {});

    expect(territorialCatalog.validate).toHaveBeenCalledWith({
      catalogVersion: 'fixture-v1', provinceCode: '5', cantonCode: '02', districtCode: '01', localityKey: 'loc_1234567890abcdef12345678',
    });
    expect(tx.affiliateRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        submittedProvinceCode: '5', submittedCantonCode: '02', submittedDistrictCode: '01',
        submittedCommunity: 'CURIME', submittedLocalityKey: 'loc_1234567890abcdef12345678',
        submittedLocalityCategory: 'POBLADO', submittedTerritorialSource: 'Fixture sintético',
        submittedTerritorialVersion: 'fixture-v1', submittedTerritorialIntegrity: 'a'.repeat(64),
      }),
    }));
  });

  it('rejects incomplete or inconsistent catalog selections without persisting them', async () => {
    const territorialCatalog = { validate: jest.fn().mockImplementation(() => { throw new ConflictException('Selección territorial inválida.'); }) };
    const catalogService = new AffiliateRequestsService(
      prisma as never, audit as never, personResolver as never, undefined, territorialCatalog as never,
    );

    await expect(catalogService.create({ ...dto, catalogVersion: 'fixture-v1', provinceCode: '5', localityKey: 'loc_1234567890abcdef12345678' }, {})).rejects.toBeInstanceOf(ConflictException);
    expect(tx.affiliateRequest.create).not.toHaveBeenCalled();

    await expect(catalogService.create({ ...dto, catalogVersion: 'fixture-v1', provinceCode: '5', cantonCode: '99', districtCode: '01', localityKey: 'loc_1234567890abcdef12345678' }, {})).rejects.toBeInstanceOf(ConflictException);
    expect(tx.affiliateRequest.create).not.toHaveBeenCalled();
  });

  it('does not copy declared territorial values into audit or notifications', async () => {
    const inboxNotifications = { notifyAffiliateRequestSubmitted: jest.fn() };
    const serviceWithNotifications = new AffiliateRequestsService(
      prisma as never,
      audit as never,
      personResolver as never,
      inboxNotifications as never,
    );

    await serviceWithNotifications.create(
      { ...dto, provinceCode: '7', community: 'Curime Centro' },
      {},
    );

    expect(inboxNotifications.notifyAffiliateRequestSubmitted).toHaveBeenCalledWith(tx, request.id);
    expect(audit.log).toHaveBeenCalledWith(
      expect.not.objectContaining({
        details: expect.objectContaining({ submittedProvinceCode: expect.anything() }),
      }),
    );
  });

  it('resolves valid Person identity before creating request', async () => {
    await service.create(dto);

    expect(personResolver.resolveWithinTransaction).toHaveBeenCalledTimes(1);
    expect(tx.person.findUnique).not.toHaveBeenCalled();
    expect(tx.affiliateRequest.create.mock.calls[0][0].data.personId).toBe(5);
  });

  it('projects legacy request snapshots as submitted aliases on reads', async () => {
    await expect(service.findOne(request.id)).resolves.toMatchObject({
      fullName: request.fullName,
      submittedFullName: request.fullName,
      submittedIdentification: request.identification,
      submittedAffiliationReason: request.affiliationReason,
      territorialDeclarationStatus: 'NOT_DECLARED',
    });
  });

  it('returns submitted territorial declarations without treating them as verified', async () => {
    prisma.affiliateRequest.findUnique.mockResolvedValue({
      ...request,
      submittedProvinceCode: '7',
      submittedCantonCode: '02',
      submittedDistrictCode: '01',
      submittedCommunity: 'Curime Centro',
    });

    await expect(service.findOne(request.id)).resolves.toMatchObject({
      submittedProvinceCode: '7',
      submittedCantonCode: '02',
      submittedDistrictCode: '01',
      submittedCommunity: 'Curime Centro',
      territorialDeclarationStatus: 'UNVERIFIED_DECLARATION',
    });
  });

  it('protects public create from existing Affiliate and pending duplicates', async () => {
    tx.affiliate.findFirst.mockResolvedValueOnce({ id: 1 });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);

    tx.affiliate.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.findFirst.mockResolvedValue({ id: 2 });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an incomplete reused Person before persisting a request link', async () => {
    personResolver.resolveWithinTransaction.mockResolvedValue({
      status: 'PERSON_REUSED',
      person: { ...person, firstSurname: null },
      profileEnrichmentRequired: true,
    });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);

    expect(tx.affiliateRequest.create).not.toHaveBeenCalled();
    expect(tx.person.update).not.toHaveBeenCalled();
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

  it('rejects pending request and records audit in the same transaction', async () => {
    await service.reject(10, 'No cumple requisitos', 99, {});

    expect(tx.affiliateRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 10, status: 'PENDING' },
      data: expect.objectContaining({
        status: 'REJECTED',
        rejectionReason: 'No cumple requisitos',
        reviewedAt: expect.any(Date),
        reviewedById: 99,
      }),
    });
    expect(tx.affiliate.create).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AFFILIATE_REQUEST_REJECTED',
        entityId: 10,
        userId: 99,
      }),
      tx,
    );
  });

  it('rolls back rejection when audit persistence fails', async () => {
    const persistedRequest = { ...request };
    tx.affiliateRequest.findUnique.mockImplementation(async () => persistedRequest);
    tx.affiliateRequest.updateMany.mockImplementation(async ({ data }) => {
      Object.assign(persistedRequest, data);
      return { count: 1 };
    });
    tx.affiliateRequest.findUniqueOrThrow.mockImplementation(async () => persistedRequest);
    audit.log.mockRejectedValueOnce(new Error('Audit persistence failed'));
    prisma.$transaction.mockImplementationOnce(async (work) => {
      const snapshot = { ...persistedRequest };
      try {
        return await (work as (client: typeof tx) => unknown)(tx);
      } catch (error) {
        Object.assign(persistedRequest, snapshot);
        throw error;
      }
    });

    await expect(service.reject(10, 'No cumple requisitos', 99, {})).rejects.toThrow(
      'Audit persistence failed',
    );

    expect(persistedRequest).toMatchObject({
      status: 'PENDING',
      rejectionReason: null,
      reviewedAt: null,
      reviewedById: null,
    });
  });

  it('rejects an already resolved request without modifying data', async () => {
    tx.affiliateRequest.findUnique.mockResolvedValue({
      ...request,
      status: 'APPROVED',
    });

    await expect(service.reject(10, 'No cumple requisitos', 99, {})).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(tx.affiliateRequest.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
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
