import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Prisma } from '../../generated/prisma/client';
import { CommunityAccountsService } from './community-accounts.service';
import { CreateCommunityAccountDto } from './dto/create-community-account.dto';
import { CompleteCommunityActivationDto } from './dto/community-verification.dto';

describe('community account registration and activation', () => {
  const tx = {
    user: { findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    role: { findUnique: jest.fn() },
    accountActivationToken: { create: jest.fn(), updateMany: jest.fn() },
  };
  const prisma = {
    accountActivationToken: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const tokens = { generate: jest.fn() };
  const delivery = { deliver: jest.fn() };
  const hasher = { hash: jest.fn() };
  let service: CommunityAccountsService;
  const payload = {
    firstName: 'Ana',
    firstSurname: 'Pérez',
    identificationType: 'NATIONAL',
    identification: '123456789',
    email: 'ana@example.test',
    privacyAcknowledgement: true,
  };
  const validToken = () => ({
    id: 1,
    userId: 2,
    purpose: 'COMMUNITY_EMAIL_VERIFICATION',
    usedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    user: { status: 'PENDING_EMAIL_VERIFICATION', passwordHash: null },
  });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (work: (client: typeof tx) => Promise<unknown>) => work(tx),
    );
    tx.user.findUnique.mockResolvedValue(null);
    tx.role.findUnique.mockResolvedValue({
      id: 3,
      isActive: true,
      permissions: [],
    });
    tx.user.create.mockResolvedValue({
      id: 2,
      fullName: 'Ana Pérez',
      email: 'ana@example.test',
    });
    tx.user.updateMany.mockResolvedValue({ count: 1 });
    tx.accountActivationToken.updateMany.mockResolvedValue({ count: 1 });
    tokens.generate.mockReturnValue({
      token: 'secret',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
    });
    delivery.deliver.mockResolvedValue(true);
    hasher.hash.mockResolvedValue('password-hash');
    prisma.accountActivationToken.findUnique.mockResolvedValue(validToken());
    service = new CommunityAccountsService(
      prisma as never,
      tokens,
      delivery as never,
      hasher,
    );
  });

  it('registers valid identity without password and creates a pending account and hashed token', async () => {
    const dto = plainToInstance(CreateCommunityAccountDto, payload);
    expect(await validate(dto)).toHaveLength(0);
    await service.register(dto);
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: null,
          status: 'PENDING_EMAIL_VERIFICATION',
          identification: '123456789',
        }) as unknown,
      }),
    );
    expect(tx.accountActivationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: 'hash',
          purpose: 'COMMUNITY_EMAIL_VERIFICATION',
        }) as unknown,
      }),
    );
    // eslint-disable-next-line prettier/prettier -- Tuple cast prevents unsafe mock-data access in this assertion.
    const [[createArgument]] = tx.user.create.mock.calls as unknown as Array<[{ data: Record<string, unknown> }]>;
    expect(createArgument.data).not.toHaveProperty('personId');
    expect(createArgument.data).not.toHaveProperty('affiliate');
    expect(hasher.hash).not.toHaveBeenCalled();
    expect(delivery.deliver).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid identity and missing acceptance at the DTO boundary', async () => {
    const errors = await validate(
      plainToInstance(CreateCommunityAccountDto, {
        ...payload,
        identification: 'abc',
        email: 'invalid',
        privacyAcknowledgement: false,
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'identification',
        'email',
        'privacyAcknowledgement',
      ]),
    );
  });

  it('rejects duplicate account email or identification without creating another account', async () => {
    tx.user.findUnique.mockResolvedValueOnce({ id: 8 });
    await expect(
      service.register(plainToInstance(CreateCommunityAccountDto, payload)),
    ).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    tx.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 9 });
    await expect(
      service.register(plainToInstance(CreateCommunityAccountDto, payload)),
    ).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it('identifies the duplicate field if a concurrent registration reaches the unique constraint', async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      }),
    );
    await expect(
      service.register(plainToInstance(CreateCommunityAccountDto, payload)),
    ).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('retains the pending account and reports immediate email delivery failure', async () => {
    delivery.deliver.mockResolvedValue(false);
    await expect(
      service.register(plainToInstance(CreateCommunityAccountDto, payload)),
    ).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(tx.user.create).toHaveBeenCalledTimes(1);
    expect(tx.accountActivationToken.create).toHaveBeenCalledTimes(1);
  });

  it('rejects unsafe passwords at the DTO boundary', async () => {
    const errors = await validate(
      plainToInstance(CompleteCommunityActivationDto, {
        token: 'token',
        password: 'weak',
        passwordConfirmation: 'weak',
      }),
    );
    expect(errors.map((error) => error.property)).toContain('password');
  });

  it('validates a token without consuming it or activating the account', async () => {
    await expect(service.validateToken('token')).resolves.toEqual({
      message: 'El enlace es válido.',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid, expired, and already used tokens', async () => {
    prisma.accountActivationToken.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...validToken(), expiresAt: new Date(0) })
      .mockResolvedValueOnce({ ...validToken(), usedAt: new Date() });
    await expect(service.validateToken('invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.validateToken('expired')).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.validateToken('used')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('requires matching passwords and does not activate a new account without one', async () => {
    await expect(
      service.verify('token', {}, 'Password123', 'different'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.verify('token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('consumes a valid token and saves only a password hash in the same transaction', async () => {
    await service.verify('token', {}, 'Password123', 'Password123');
    expect(tx.accountActivationToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usedAt: null,
          purpose: 'COMMUNITY_EMAIL_VERIFICATION',
        }) as unknown,
      }),
    );
    expect(tx.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING_EMAIL_VERIFICATION',
        }) as unknown,
        data: {
          status: 'ACTIVE',
          passwordHash: 'password-hash',
          communityEmailVerifiedAt: expect.any(Date) as unknown as Date,
        },
      }),
    );
  });

  it('does not activate when another request already consumed the token', async () => {
    tx.accountActivationToken.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.verify('token', {}, 'Password123', 'Password123'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });

  it('accepts an already-issued community token while requiring the mailbox holder to set a password', async () => {
    prisma.accountActivationToken.findUnique.mockResolvedValue({
      ...validToken(),
      user: { status: 'PENDING_EMAIL_VERIFICATION', passwordHash: 'old-hash' },
    });
    await service.verify(
      'legacy-community-token',
      {},
      'Password123',
      'Password123',
    );
    expect(tx.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: 'ACTIVE',
          passwordHash: 'password-hash',
          communityEmailVerifiedAt: expect.any(Date) as unknown as Date,
        },
      }),
    );
  });
});
