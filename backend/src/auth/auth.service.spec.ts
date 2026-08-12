import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
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
    lockedAt: null,
    role: { name: 'Administrador' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.update.mockResolvedValue(user);
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
      data: { lastLoginAt: expect.any(Date) },
    });
  });

  it.each([
    ['an unknown email', null],
    ['an inactive user', { ...user, status: 'INACTIVE' }],
    ['a locked user', { ...user, lockedAt: new Date() }],
  ])('rejects %s with the generic credentials response', async (_, foundUser) => {
    prisma.user.findUnique.mockResolvedValue(foundUser);

    await expect(
      service.login({ email: user.email, password: 'invalid-password' }),
    ).rejects.toEqual(new UnauthorizedException('Invalid credentials'));

    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('rejects an incorrect password with the generic credentials response', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.login({ email: user.email, password: 'invalid-password' }),
    ).rejects.toEqual(new UnauthorizedException('Invalid credentials'));
  });
});
