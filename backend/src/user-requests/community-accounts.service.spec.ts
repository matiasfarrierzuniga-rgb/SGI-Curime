import { BadRequestException, ConflictException } from '@nestjs/common';
import { CommunityAccountsService } from './community-accounts.service';

describe('CommunityAccountsService', () => {
  const prisma = {
    accountActivationToken: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const tokens = { generate: jest.fn() };
  const delivery = { deliver: jest.fn() };
  const hasher = { hash: jest.fn() };
  const audit = { log: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('rejects a legacy ADI activation token from the community verification endpoint', async () => {
    prisma.accountActivationToken.findUnique.mockResolvedValue({
      id: 1,
      userId: 2,
      purpose: 'LEGACY_ACCOUNT_ACTIVATION',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { status: 'INACTIVE' },
    });
    const service = new CommunityAccountsService(
      prisma as never,
      tokens,
      delivery as never,
      hasher,
      audit as never,
    );

    await expect(service.verify('legacy-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('reports an expired community token without attempting activation', async () => {
    prisma.accountActivationToken.findUnique.mockResolvedValue({
      id: 1,
      userId: 2,
      purpose: 'COMMUNITY_EMAIL_VERIFICATION',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1),
      user: { status: 'PENDING_EMAIL_VERIFICATION' },
    });
    const service = new CommunityAccountsService(
      prisma as never,
      tokens,
      delivery as never,
      hasher,
      audit as never,
    );

    await expect(service.verify('expired-token')).rejects.toMatchObject({
      message: 'El enlace de verificación venció.',
    } satisfies Partial<ConflictException>);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
