import { createHash } from 'crypto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { CommunityAccountsService } from '../src/user-requests/community-accounts.service';

const connectionString = process.env.TEST_DATABASE_URL;
const describeIntegration = connectionString ? describe : describe.skip;

describeIntegration('community account PostgreSQL', () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString! }),
  });
  const tokens = { generate: jest.fn() };
  const delivery = { deliver: jest.fn() };
  const hasher = { hash: jest.fn() };
  const audit = { log: jest.fn() };
  const service = new CommunityAccountsService(
    prisma as unknown as PrismaService,
    tokens,
    delivery as never,
    hasher as never,
    audit as never,
  );

  beforeEach(async () => {
    jest.clearAllMocks();
    hasher.hash.mockResolvedValue('bcrypt-hash');
    delivery.deliver.mockResolvedValue(true);
    await prisma.session.deleteMany();
    await prisma.accountActivationToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.role.create({
      data: { name: 'Cuenta comunitaria', isActive: true },
    });
  });

  afterAll(async () => prisma.$disconnect());

  it('registers, verifies, and activates a community account without Person, privileges, or session', async () => {
    const generated = token('community-register-token');
    tokens.generate.mockReturnValue(generated);

    await expect(service.register(payload())).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    const pending = await prisma.user.findUniqueOrThrow({
      where: { email: 'community@example.test' },
      include: {
        role: { include: { permissions: true } },
        activationTokens: true,
      },
    });
    expect(pending).toMatchObject({
      personId: null,
      identification: null,
      status: 'PENDING_EMAIL_VERIFICATION',
    });
    expect(pending.role.name).toBe('Cuenta comunitaria');
    expect(pending.role.permissions).toHaveLength(0);
    expect(pending.activationTokens).toEqual([
      expect.objectContaining({
        purpose: 'COMMUNITY_EMAIL_VERIFICATION',
        tokenHash: generated.tokenHash,
        usedAt: null,
      }),
    ]);

    await expect(service.verify(generated.token)).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: pending.id } }))
        .status,
    ).toBe('ACTIVE');
    expect(await prisma.session.count({ where: { userId: pending.id } })).toBe(
      0,
    );
  });

  it('returns a neutral acknowledgement for an existing account without changing it', async () => {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: 'Cuenta comunitaria' },
    });
    await prisma.user.create({
      data: {
        fullName: 'Existing',
        email: 'community@example.test',
        passwordHash: 'existing',
        roleId: role.id,
        status: 'ACTIVE',
      },
    });
    await expect(service.register(payload())).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(
      await prisma.user.count({ where: { email: 'community@example.test' } }),
    ).toBe(1);
    expect(delivery.deliver).not.toHaveBeenCalled();
  });

  it('rejects an ADI activation token from community verification', async () => {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: 'Cuenta comunitaria' },
    });
    const user = await prisma.user.create({
      data: {
        fullName: 'Legacy',
        email: 'legacy@example.test',
        roleId: role.id,
        status: 'INACTIVE',
      },
    });
    const legacy = token('legacy-adi-token');
    await prisma.accountActivationToken.create({
      data: {
        userId: user.id,
        tokenHash: legacy.tokenHash,
        expiresAt: legacy.expiresAt,
        purpose: 'LEGACY_ACCOUNT_ACTIVATION',
      },
    });
    await expect(service.verify(legacy.token)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(
      (
        await prisma.accountActivationToken.findUniqueOrThrow({
          where: { tokenHash: legacy.tokenHash },
        })
      ).usedAt,
    ).toBeNull();
  });

  it('supersedes prior tokens on resend and permits a replacement exactly once', async () => {
    const original = token('community-original-token');
    const replacement = token('community-replacement-token');
    tokens.generate
      .mockReturnValueOnce(original)
      .mockReturnValueOnce(replacement);
    await service.register(payload());

    await expect(service.resend('community@example.test')).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(
      (
        await prisma.accountActivationToken.findUniqueOrThrow({
          where: { tokenHash: original.tokenHash },
        })
      ).usedAt,
    ).not.toBeNull();
    await expect(service.verify(original.token)).rejects.toBeInstanceOf(
      ConflictException,
    );

    await expect(service.verify(replacement.token)).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    await expect(service.verify(replacement.token)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects an expired community token without activating its pending account', async () => {
    const expired = {
      ...token('expired-community-token'),
      expiresAt: new Date(Date.now() - 1_000),
    };
    tokens.generate.mockReturnValue(expired);
    await service.register(payload());

    await expect(service.verify(expired.token)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(
      (
        await prisma.user.findUniqueOrThrow({
          where: { email: 'community@example.test' },
        })
      ).status,
    ).toBe('PENDING_EMAIL_VERIFICATION');
  });

  it('refuses registration when a pre-existing community role carries permissions', async () => {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: 'Cuenta comunitaria' },
    });
    const permission = await prisma.permission.create({
      data: { code: 'erp.dashboard.read', name: 'ERP dashboard' },
    });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });
    tokens.generate.mockReturnValue(token('blocked-role-token'));
    await expect(service.register(payload())).rejects.toThrow(
      'Community account role is not configured.',
    );
    expect(await prisma.user.count()).toBe(0);
    expect(
      await prisma.rolePermission.count({ where: { roleId: role.id } }),
    ).toBe(1);
  });
});

function payload() {
  return {
    fullName: 'Community Test',
    email: 'community@example.test',
    password: 'Password123',
    passwordConfirmation: 'Password123',
    privacyAcknowledgement: true,
  };
}

function token(value: string) {
  return {
    token: value,
    tokenHash: createHash('sha256').update(value).digest('hex'),
    expiresAt: new Date(Date.now() + 60_000),
  };
}
