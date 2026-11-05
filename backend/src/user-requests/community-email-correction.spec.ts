import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Prisma } from '../../generated/prisma/client';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CommunityAccountsController } from './community-accounts.controller';
import { CommunityAccountsService } from './community-accounts.service';
import { CorrectCommunityEmailDto } from './dto/correct-community-email.dto';

describe('administrative community email correction', () => {
  const tx = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    accountActivationToken: { updateMany: jest.fn(), create: jest.fn() },
    passwordResetToken: { updateMany: jest.fn() },
  };
  const prisma = { $transaction: jest.fn(), user: { findMany: jest.fn() } };
  const tokens = { generate: jest.fn() };
  const delivery = { deliver: jest.fn() };
  const audit = { log: jest.fn() };
  const dto: CorrectCommunityEmailDto = {
    email: 'NEW@example.test',
    identityVerified: true,
    verificationMethod: 'IN_PERSON',
  };
  let service: CommunityAccountsService;
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (work: (t: typeof tx) => Promise<unknown>) => work(tx),
    );
    tx.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'old@example.test',
      fullName: 'Example',
      status: 'PENDING_EMAIL_VERIFICATION',
      role: { name: 'Cuenta comunitaria' },
    });
    tx.user.findFirst.mockResolvedValue(null);
    tx.user.updateMany.mockResolvedValue({ count: 1 });
    tokens.generate.mockReturnValue({
      token: 'secret',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60000),
    });
    delivery.deliver.mockResolvedValue(true);
    service = new CommunityAccountsService(
      prisma as never,
      tokens,
      delivery as never,
      { hash: jest.fn() },
      audit as never,
    );
  });
  it('requires JWT authentication and persisted capability on both administrative routes', () => {
    for (const [method, capability] of [
      ['correctEmail', 'usr.users.update'],
      ['findPending', 'usr.users.read'],
    ] as const) {
      const handler = Object.getOwnPropertyDescriptor(
        CommunityAccountsController.prototype,
        method,
      )!.value as object;
      expect(Reflect.getMetadata('roles', handler)).toBeUndefined();
      expect(Reflect.getMetadata('capabilities', handler)).toEqual([
        capability,
      ]);
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
        JwtAuthGuard,
        CapabilityGuard,
      ]);
    }
  });

  it.each([
    ['ROLE_SYSTEM_ADMIN', true, ['usr.users.update'], true],
    ['ROLE_SYSTEM_ADMIN', true, [], false],
    ['ROLE_SYSTEM_ADMIN', false, ['usr.users.update'], false],
    ['Administrador', false, ['usr.users.update'], false],
    ['ROLE_COMMUNITY_USER', false, ['usr.users.update'], false],
    ['ROLE_INSTITUTIONAL_OPERATOR', true, [], false],
  ])(
    'requires ERP admission and persisted capability for %s',
    (role, canAccessErp, permissionCodes, allowed) => {
      const context = {
        getHandler: () => null,
        getClass: () => null,
        switchToHttp: () => ({
          getRequest: () => ({ user: { role, canAccessErp, permissionCodes } }),
        }),
      };
      const capabilityGuard = new CapabilityGuard({
        getAllAndOverride: (key: string) =>
          key === 'capabilities' ? ['usr.users.update'] : undefined,
      } as never);
      expect(capabilityGuard.canActivate(context as never)).toBe(allowed);
    },
  );

  it('normalizes and validates input and requires recorded identity attestation', async () => {
    const parsed = plainToInstance(CorrectCommunityEmailDto, {
      ...dto,
      email: ' NEW@example.test ',
    });
    expect(parsed.email).toBe('new@example.test');
    expect(await validate(parsed)).toHaveLength(0);
    expect(
      await validate(
        plainToInstance(CorrectCommunityEmailDto, {
          ...dto,
          email: 'bad',
          identityVerified: false,
        }),
      ),
    ).not.toHaveLength(0);
    await expect(
      service.correctEmail(1, { ...dto, identityVerified: false }, 9),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('updates a pending account, invalidates community tokens and audits in the transaction before delivery', async () => {
    await service.correctEmail(1, dto, 9);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { email: 'new@example.test' },
        where: expect.objectContaining({
          status: 'PENDING_EMAIL_VERIFICATION',
          email: 'old@example.test',
        }) as unknown,
      }),
    );
    expect(tx.accountActivationToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 1,
          purpose: 'COMMUNITY_EMAIL_VERIFICATION',
          usedAt: null,
        },
      }),
    );
    expect(tx.accountActivationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tokenHash: 'hash' }) as unknown,
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 9,
        details: { identityVerified: true, verificationMethod: 'IN_PERSON' },
      }),
      tx,
    );
    expect(JSON.stringify(audit.log.mock.calls)).not.toContain('example.test');
    expect(audit.log.mock.invocationCallOrder[0]).toBeLessThan(
      delivery.deliver.mock.invocationCallOrder[0],
    );
  });
  it.each(['ACTIVE', 'INACTIVE', 'BLOCKED'])(
    'rejects %s accounts',
    async (status) => {
      tx.user.findUnique.mockResolvedValue({
        status,
        role: { name: 'Cuenta comunitaria' },
      });
      await expect(service.correctEmail(1, dto, 9)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.user.updateMany).not.toHaveBeenCalled();
    },
  );
  it('rejects duplicate emails without changing the account', async () => {
    tx.user.findFirst.mockResolvedValue({ id: 8 });
    await expect(service.correctEmail(1, dto, 9)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: { equals: 'new@example.test', mode: 'insensitive' },
        }) as unknown,
      }),
    );
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });
  it('rejects concurrent state changes before issuing a token', async () => {
    tx.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.correctEmail(1, dto, 9)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.accountActivationToken.create).not.toHaveBeenCalled();
  });
  it('reports delivery failure after the transaction, retaining the new pending token', async () => {
    delivery.deliver.mockResolvedValue(false);
    await expect(service.correctEmail(1, dto, 9)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(audit.log).toHaveBeenCalledTimes(1);
    expect(tx.accountActivationToken.create).toHaveBeenCalledTimes(1);
  });

  it('starts audited reverification for an inactive historical account without evidence', async () => {
    await service.reverifyHistorical(1, 9);
    expect(tx.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'INACTIVE',
          communityEmailVerifiedAt: null,
        }) as unknown,
        data: { status: 'PENDING_EMAIL_VERIFICATION' },
      }),
    );
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'COMMUNITY_EMAIL_REVERIFICATION_STARTED',
        userId: 9,
      }),
      tx,
    );
    expect(delivery.deliver).toHaveBeenCalled();
  });
});
