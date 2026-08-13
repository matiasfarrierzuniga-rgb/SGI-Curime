import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };
  const service = new AuthService(prisma as never, jwtService as never);
  const user = {
    id: 1,
    fullName: 'Administrador de Prueba',
    email: 'admin@curime.test',
    passwordHash: 'hashed-password',
    status: 'ACTIVE' as const,
    failedLoginAttempts: 0,
    lockedAt: null,
    role: { name: 'Administrador' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.update.mockResolvedValue(user);
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );
    jwtService.signAsync.mockResolvedValue('signed-token');
  });

  it('logs in an active, unlocked user and returns only safe data', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      service.login({ email: user.email, password: 'valid-password' }),
    ).resolves.toEqual({
      accessToken: 'signed-token',
      user: {
        id: 1,
        fullName: 'Administrador de Prueba',
        email: 'admin@curime.test',
        status: 'ACTIVE',
        role: 'Administrador',
      },
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: user.email,
      role: 'Administrador',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        failedLoginAttempts: 0,
        lockedAt: null,
        lastLoginAt: expect.any(Date),
      },
    });
  });

  it.each([
    ['an unknown email', null],
    ['an inactive user', { ...user, status: 'INACTIVE' }],
    ['an administratively blocked user', { ...user, status: 'BLOCKED' }],
    ['a temporarily locked user', { ...user, lockedAt: new Date() }],
  ])(
    'rejects %s with the generic credentials response',
    async (_, foundUser) => {
      prisma.user.findUnique.mockResolvedValue(foundUser);

      await expect(
        service.login({ email: user.email, password: 'invalid-password' }),
      ).rejects.toEqual(new UnauthorizedException('Invalid credentials'));

      expect(bcrypt.compare).not.toHaveBeenCalled();
    },
  );

  it('rejects an incorrect password with the generic credentials response', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    prisma.user.update.mockResolvedValueOnce({ failedLoginAttempts: 1 });
    await expect(
      service.login({ email: user.email, password: 'invalid-password' }),
    ).rejects.toEqual(new UnauthorizedException('Invalid credentials'));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
  });

  it('locks the account when the atomic counter reaches the limit', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
    prisma.user.update.mockResolvedValueOnce({ failedLoginAttempts: 3 });

    await expect(
      service.login({ email: user.email, password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { lockedAt: expect.any(Date) },
    });
  });

  it('clears an expired lock before processing a normal attempt', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      failedLoginAttempts: 3,
      lockedAt: new Date(Date.now() - 16 * 60_000),
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await service.login({ email: user.email, password: 'valid-password' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { failedLoginAttempts: 0, lockedAt: null },
    });
  });

  it('does not update any counter for an unknown email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'missing@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects an active user without a password hash', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...user, passwordHash: null });

    await expect(
      service.login({ email: user.email, password: 'valid-password' }),
    ).rejects.toEqual(new UnauthorizedException('Invalid credentials'));

    expect(bcrypt.compare).not.toHaveBeenCalled();
  });
});
