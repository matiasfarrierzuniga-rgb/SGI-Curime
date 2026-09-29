/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers are typed as any. */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AffiliateRequestsService } from './affiliate-requests.service';

describe('AffiliateRequestsService phase 1', () => {
  const pending = {
    id: 10,
    personId: 5,
    fullName: 'Ana Pérez',
    identification: '123456789',
    identificationType: 'NATIONAL',
    birthDate: new Date('1990-01-01'),
    gender: null,
    phoneCountryCode: '+506',
    phoneNationalNumber: '88888888',
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
  const account = {
    id: 7,
    fullName: 'Legacy Name',
    identification: 'legacy-id',
    identificationType: null,
    email: pending.email,
    phoneCountryCode: null,
    phoneNationalNumber: null,
    address: 'Legacy address',
    personId: 5,
    person: {
      id: 5,
      firstName: 'Ana',
      firstSurname: 'Pérez',
      secondSurname: null,
      identification: pending.identification,
      identificationType: pending.identificationType,
      phoneCountryCode: pending.phoneCountryCode,
      phoneNationalNumber: pending.phoneNationalNumber,
      address: pending.address,
    },
  };
  const linkedPerson = {
    id: 5,
    firstName: 'Ana',
    firstSurname: 'Pérez',
    secondSurname: null,
    identification: pending.identification,
    identificationType: pending.identificationType,
    birthDate: pending.birthDate,
    email: pending.email,
    phoneCountryCode: pending.phoneCountryCode,
    phoneNationalNumber: pending.phoneNationalNumber,
    address: pending.address,
    user: {
      id: 7,
      personId: 5,
    },
  };
  const tx = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    person: { findUnique: jest.fn(), update: jest.fn() },
    role: { findUnique: jest.fn() },
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
    affiliate: { findFirst: jest.fn() },
    affiliateRequest: { findUnique: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(
      (work: ((client: typeof tx) => unknown) | unknown[]) =>
        typeof work === 'function' ? work(tx) : Promise.resolve(work),
    ),
  };
  const audit = { log: jest.fn() };
  const service = new AffiliateRequestsService(prisma as never, audit as never);
  const dto = {
    birthDate: pending.birthDate,
    address: 'Nueva dirección',
    affiliationReason: pending.affiliationReason,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tx.user.findUnique.mockResolvedValue(account);
    tx.person.findUnique.mockResolvedValue(linkedPerson);
    tx.role.findUnique.mockResolvedValue({
      id: 4,
      name: 'Vecino/Afiliado',
      isActive: true,
    });
    tx.affiliate.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.findUnique.mockResolvedValue(pending);
    tx.affiliateRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.affiliateRequest.create.mockResolvedValue(pending);
    tx.person.update.mockResolvedValue({
      id: 5,
      birthDate: dto.birthDate,
      address: dto.address,
    });
    tx.affiliate.create.mockResolvedValue({
      id: 20,
      roleId: 4,
      status: 'ACTIVE',
    });
    tx.user.update.mockResolvedValue({ id: 7, roleId: 4 });
    tx.affiliateRequest.findUniqueOrThrow.mockResolvedValue({
      ...pending,
      status: 'APPROVED',
    });
    prisma.affiliateRequest.findUnique.mockResolvedValue(pending);
    prisma.affiliateRequest.updateMany.mockResolvedValue({ count: 1 });
  });

  it('creates a pending request from the authenticated User Person identity', async () => {
    await service.create(dto, 7);
    expect(tx.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 } }),
    );
    expect(tx.affiliateRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          personId: 5,
          fullName: pending.fullName,
          identification: pending.identification,
          email: account.email,
          address: dto.address,
        }),
      }),
    );
    expect(tx.user.update.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({
          fullName: pending.fullName,
          identification: pending.identification,
          address: dto.address,
        }),
      }),
    );
    expect(tx.user.update.mock.calls[0][0].data).not.toHaveProperty('email');
  });

  it('creates an affiliation request when Person email is null and User email is valid', async () => {
    tx.user.findUnique.mockResolvedValue({
      ...account,
      person: { ...account.person, email: null },
    });

    await service.create(dto, 7);

    expect(tx.affiliateRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: account.email }),
      }),
    );
  });

  it('does not change User email when Person contact email differs', async () => {
    tx.user.findUnique.mockResolvedValue({
      ...account,
      email: 'login@example.com',
      person: { ...account.person, email: 'contact@example.com' },
    });

    await service.create(dto, 7);

    expect(tx.user.update.mock.calls[0][0].data).not.toHaveProperty('email');
    expect(tx.affiliateRequest.create.mock.calls[0][0].data.email).toBe(
      'login@example.com',
    );
  });

  it('does not copy Person email to Affiliate during approval', async () => {
    tx.person.findUnique.mockResolvedValue({
      ...linkedPerson,
      email: 'person-contact@example.com',
    });

    await service.approve(10, 4, 1);

    expect(tx.affiliate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: null }),
      }),
    );
  });

  it('creates Affiliate with a valid null brownfield email', async () => {
    tx.person.findUnique.mockResolvedValue({
      ...linkedPerson,
      email: null,
    });

    await expect(service.approve(10, 4, 1)).resolves.toMatchObject({
      affiliate: { id: 20 },
    });
    expect(tx.affiliate.create.mock.calls[0][0].data.email).toBeNull();
  });

  it('rejects an authenticated account without Person', async () => {
    tx.user.findUnique.mockResolvedValue({
      ...account,
      personId: null,
      person: null,
    });
    await expect(service.create(dto, 7)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects an existing affiliate and a pending duplicate', async () => {
    tx.affiliate.findFirst.mockResolvedValueOnce({ id: 1 });
    await expect(service.create(dto, 7)).rejects.toBeInstanceOf(
      ConflictException,
    );
    tx.affiliate.findFirst.mockResolvedValue(null);
    tx.affiliateRequest.findFirst.mockResolvedValue({ id: 2 });
    await expect(service.create(dto, 7)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it.each([
    [null, NotFoundException],
    [{ id: 4, name: 'Vecino/Afiliado', isActive: false }, BadRequestException],
    [{ id: 5, name: 'Subscription_L1', isActive: true }, BadRequestException],
  ])('rejects an invalid affiliation role', async (role, error) => {
    tx.role.findUnique.mockResolvedValue(role);
    await expect(service.approve(10, 4, 1)).rejects.toBeInstanceOf(error);
    expect(tx.affiliate.create).not.toHaveBeenCalled();
  });

  it('approves with one functional role for Affiliate and User', async () => {
    const result = await service.approve(10, 4, 1);
    expect(tx.affiliate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ personId: 5, legacyRoleId: 4 }),
      }),
    );
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { roleId: 4 },
    });
    expect(tx.affiliateRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10, status: 'PENDING' } }),
    );
    expect(result.affiliate).toMatchObject({ roleId: 4 });
  });

  it('rolls back the approval path when User role synchronization fails', async () => {
    tx.user.update.mockRejectedValue(new Error('user update failed'));
    await expect(service.approve(10, 4, 1)).rejects.toThrow(
      'user update failed',
    );
    expect(tx.affiliateRequest.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('rejects inconsistent request and Person identity', async () => {
    tx.person.findUnique.mockResolvedValue({
      ...linkedPerson,
      firstName: 'Otra',
    });
    await expect(service.approve(10, 4, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('preserves atomicity when a concurrent approval wins', async () => {
    tx.affiliateRequest.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.approve(10, 4, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('rejects without changing the User role or creating an Affiliate', async () => {
    await service.reject(10, 'No cumple requisitos', 1);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.affiliate.create).not.toHaveBeenCalled();
  });
});
