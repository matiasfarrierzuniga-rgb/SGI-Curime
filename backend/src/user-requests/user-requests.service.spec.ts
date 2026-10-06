/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest mocks intentionally model Prisma's generated client dynamically. */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { UserRequestsService } from './user-requests.service';

describe('UserRequestsService', () => {
  const pending = {
    id: 10,
    personId: 12,
    fullName: 'Persona Solicitante',
    identificationType: 'NATIONAL' as const,
    identification: '123456789',
    email: 'persona@example.com',
    phoneCountryCode: null,
    phoneNationalNumber: null,
    address: null,
    reason: 'Necesito acceso',
    status: 'PENDING',
    rejectionReason: null,
    reviewedAt: null,
    reviewedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const tx = {
    userRequest: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    user: { create: jest.fn(), findUnique: jest.fn() },
    person: { findUnique: jest.fn() },
    identityReconciliationManifest: { upsert: jest.fn() },
    accountActivationToken: { create: jest.fn() },
  };
  const prisma = {
    user: { findFirst: jest.fn(), findUnique: jest.fn() },
    userRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    role: { findUnique: jest.fn() },
    $transaction: jest.fn((argument: unknown) =>
      Array.isArray(argument)
        ? Promise.all(argument)
        : (argument as (client: typeof tx) => unknown)(tx),
    ),
  };
  const rawToken = 'raw-secret-token';
  const generated = {
    token: rawToken,
    tokenHash: createHash('sha256').update(rawToken).digest('hex'),
    expiresAt: new Date(Date.now() + 86_400_000),
  };
  const tokenService = { generate: jest.fn(() => generated) };
  const delivery = { deliver: jest.fn() };
  const person = {
    id: 12,
    firstName: 'Persona',
    firstSurname: 'Solicitante',
    secondSurname: null,
    identification: pending.identification,
    identificationType: pending.identificationType,
    normalizedIdentification: pending.identification,
    phoneCountryCode: null,
    phoneNationalNumber: null,
    address: null,
  };
  const personResolver = {
    findSafeExisting: jest.fn(),
    resolveWithinTransaction: jest.fn(),
    resolveExistingForReviewWithinTransaction: jest.fn(),
  };
  const service = new UserRequestsService(
    prisma as never,
    tokenService,
    delivery as never,
    personResolver as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.userRequest.findFirst.mockResolvedValue(null);
    prisma.userRequest.findUnique.mockResolvedValue(pending);
    prisma.userRequest.create.mockResolvedValue(pending);
    prisma.userRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.role.findUnique.mockResolvedValue({ id: 2, isActive: true });
    tx.userRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.userRequest.create.mockResolvedValue(pending);
    tx.userRequest.findUniqueOrThrow.mockResolvedValue({
      ...pending,
      status: 'APPROVED',
    });
    tx.user.create.mockResolvedValue({
      id: 22,
      fullName: pending.fullName,
      email: pending.email,
      status: 'INACTIVE',
      roleId: 2,
    });
    tx.user.findUnique.mockResolvedValue(null);
    tx.person.findUnique.mockResolvedValue(person);
    personResolver.resolveWithinTransaction.mockResolvedValue({
      status: 'PERSON_REUSED',
      person,
      profileEnrichmentRequired: false,
    });
    personResolver.findSafeExisting.mockResolvedValue(null);
    personResolver.resolveExistingForReviewWithinTransaction.mockResolvedValue({
      status: 'PERSON_REUSED',
      person,
    });
    tx.accountActivationToken.create.mockResolvedValue({ id: 4 });
    delivery.deliver.mockResolvedValue(undefined);
  });

  it('creates a pending request without creating a user', async () => {
    await service.create({
      fullName: pending.fullName,
      identificationType: pending.identificationType,
      identification: pending.identification,
      email: pending.email,
      reason: pending.reason,
    });
    expect(tx.userRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING',
          submittedFullName: pending.fullName,
          submittedIdentification: pending.identification,
          submittedEmail: pending.email,
          submittedReason: pending.reason,
        }),
      }),
    );
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it('links only an existing safe Person when structured identity is supplied', async () => {
    personResolver.findSafeExisting.mockResolvedValue({
      status: 'PERSON_REUSED',
      person,
      profileEnrichmentRequired: false,
    });
    await service.create({
      firstName: person.firstName,
      firstSurname: person.firstSurname,
      fullName: pending.fullName,
      identificationType: pending.identificationType,
      identification: pending.identification,
      email: pending.email,
      reason: pending.reason,
    });

    expect(personResolver.findSafeExisting).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: person.firstName,
        firstSurname: person.firstSurname,
      }),
      tx,
    );
    expect(tx.userRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: 'Persona Solicitante',
          personId: person.id,
        }),
      }),
    );
  });

  it('accepts structured identity without a safe Person link', async () => {
    await service.create({
      firstName: person.firstName,
      firstSurname: person.firstSurname,
      fullName: pending.fullName,
      identificationType: pending.identificationType,
      identification: pending.identification,
      email: pending.email,
      reason: pending.reason,
    });

    expect(tx.userRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ personId: undefined }),
      }),
    );
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it.each([
    ['email', { id: 1 }, null],
    ['identification', null, { id: 1 }],
  ])('rejects an existing user by %s', async (_, emailUser, idUser) => {
    prisma.user.findFirst.mockResolvedValueOnce(emailUser);
    prisma.user.findUnique.mockResolvedValueOnce(idUser);
    await expect(
      service.create({
        fullName: pending.fullName,
        identificationType: pending.identificationType,
        identification: pending.identification,
        email: pending.email,
        reason: pending.reason,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it.each([
    ['email', { id: 2 }, null],
    ['identification', null, { id: 2 }],
  ])('rejects a pending duplicate by %s', async (_, emailReq, idReq) => {
    prisma.userRequest.findFirst
      .mockResolvedValueOnce(emailReq)
      .mockResolvedValueOnce(idReq);
    await expect(
      service.create({
        fullName: pending.fullName,
        identificationType: pending.identificationType,
        identification: pending.identification,
        email: pending.email,
        reason: pending.reason,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 for an unknown request', async () => {
    prisma.userRequest.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a pending request with the administrator id', async () => {
    await service.reject(10, 'No cumple requisitos', 1);
    expect(prisma.userRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 10, status: 'PENDING' },
      data: expect.objectContaining({
        status: 'REJECTED',
        rejectionReason: 'No cumple requisitos',
        reviewedById: 1,
      }),
    });
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.accountActivationToken.create).not.toHaveBeenCalled();
  });

  it('rejects an already resolved request', async () => {
    prisma.userRequest.findUnique.mockResolvedValue({
      ...pending,
      status: 'REJECTED',
    });
    await expect(service.reject(10, 'Motivo', 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('approves Person-first and creates an inactive user and hashed token', async () => {
    prisma.userRequest.findUnique.mockResolvedValue({
      ...pending,
      fullName: 'Historical display name',
    });

    const result = await service.approve(10, { roleId: 2 }, 1);
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          personId: person.id,
          fullName: 'Persona Solicitante',
          passwordHash: null,
          status: 'INACTIVE',
          roleId: 2,
        }),
      }),
    );
    expect(tx.accountActivationToken.create).toHaveBeenCalledWith({
      data: {
        userId: 22,
        tokenHash: generated.tokenHash,
        expiresAt: generated.expiresAt,
      },
    });
    expect(generated.tokenHash).not.toBe(rawToken);
    expect(tx.userRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED', reviewedById: 1 }),
      }),
    );
    expect(delivery.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 22,
        email: pending.email,
        fullName: pending.fullName,
        token: rawToken,
        expiresAt: generated.expiresAt,
      }),
    );
    expect(result.userRequest.status).toBe('APPROVED');
  });

  it('validates an already linked Person without invoking creation-capable resolution', async () => {
    await service.approve(10, { roleId: 2 }, 1);

    expect(tx.person.findUnique).toHaveBeenCalledWith({
      where: { id: pending.personId },
    });
    expect(personResolver.resolveWithinTransaction).not.toHaveBeenCalled();
    expect(personResolver.resolveExistingForReviewWithinTransaction).not.toHaveBeenCalled();
    expect(tx.identityReconciliationManifest.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          selectedPersonId: person.id,
          reviewRequired: false,
          personCreationAllowed: false,
        }),
      }),
    );
  });

  it('keeps a mismatched linked request pending without invoking Person resolution', async () => {
    tx.person.findUnique.mockResolvedValue({
      ...person,
      normalizedIdentification: '423456789',
    });

    await expect(service.approve(10, { roleId: 2 }, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(personResolver.resolveWithinTransaction).not.toHaveBeenCalled();
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.accountActivationToken.create).not.toHaveBeenCalled();
    expect(tx.userRequest.updateMany).not.toHaveBeenCalled();
    expect(tx.identityReconciliationManifest.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ reviewRequired: true }),
      }),
    );
  });

  it('reuses an unlinked request Person only by typed identity key during approval', async () => {
    prisma.userRequest.findUnique.mockResolvedValue({
      ...pending,
      personId: null,
    });

    await service.approve(10, { roleId: 2 }, 1);

    expect(personResolver.resolveExistingForReviewWithinTransaction).toHaveBeenCalledWith(
      pending.identificationType,
      pending.identification,
      tx,
    );
    expect(personResolver.resolveWithinTransaction).not.toHaveBeenCalled();
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          personId: person.id,
          status: 'INACTIVE',
          phoneCountryCode: null,
        }),
      }),
    );
    expect(tx.accountActivationToken.create).toHaveBeenCalledTimes(1);
  });

  it('does not create a User or token when unlinked review-time reconciliation conflicts', async () => {
    prisma.userRequest.findUnique.mockResolvedValue({
      ...pending,
      personId: null,
    });
    personResolver.resolveExistingForReviewWithinTransaction.mockResolvedValue({
      status: 'MANUAL_REVIEW_REQUIRED',
      reason: 'Canonical Person requires structured identity review',
    });

    await expect(service.approve(10, { roleId: 2 }, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.accountActivationToken.create).not.toHaveBeenCalled();
    expect(delivery.deliver).not.toHaveBeenCalled();
    expect(tx.userRequest.updateMany).not.toHaveBeenCalled();
    expect(tx.identityReconciliationManifest.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sourceModel: 'UserRequest',
          sourceId: pending.id,
          reviewRequired: true,
          personCreationAllowed: false,
        }),
      }),
    );
  });

  it('projects legacy request snapshots as submitted aliases on reads', async () => {
    await expect(service.findOne(pending.id)).resolves.toMatchObject({
      fullName: pending.fullName,
      submittedFullName: pending.fullName,
      submittedIdentification: pending.identification,
      submittedEmail: pending.email,
      submittedReason: pending.reason,
    });
  });

  it('does not replay approval for a resolved request', async () => {
    prisma.userRequest.findUnique.mockResolvedValue({
      ...pending,
      status: 'APPROVED',
    });

    await expect(service.approve(10, { roleId: 2 }, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.accountActivationToken.create).not.toHaveBeenCalled();
  });

  it('does not create another token when post-commit delivery fails', async () => {
    delivery.deliver.mockRejectedValueOnce(new Error('delivery unavailable'));

    await expect(service.approve(10, { roleId: 2 }, 1)).rejects.toThrow(
      'delivery unavailable',
    );

    expect(tx.user.create).toHaveBeenCalledTimes(1);
    expect(tx.accountActivationToken.create).toHaveBeenCalledTimes(1);
    expect(tx.accountActivationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tokenHash: generated.tokenHash }),
    });
  });

  it('rejects an unknown role', async () => {
    prisma.role.findUnique.mockResolvedValue(null);
    await expect(
      service.approve(10, { roleId: 999 }, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an inactive role', async () => {
    prisma.role.findUnique.mockResolvedValue({ id: 2, isActive: false });
    await expect(service.approve(10, { roleId: 2 }, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
