import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PasswordRecoveryService } from './password-recovery.service';

process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

describe('PasswordRecoveryService', () => {
  const user = {
    id: 7,
    email: 'user@example.com',
    fullName: 'Persona Usuaria',
    passwordHash: 'current-hash',
  };
  const token = 'secure-reset-token';
  const storedToken = {
    id: 4,
    userId: user.id,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    user,
  };
  const tx = {
    passwordResetToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    user: { update: jest.fn() },
  };
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    passwordResetToken: { findUnique: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const delivery = { deliver: jest.fn() };
  const service = new PasswordRecoveryService(
    prisma as never,
    delivery as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.passwordResetToken.findUnique.mockResolvedValue(storedToken);
    tx.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    delivery.deliver.mockResolvedValue(undefined);
  });

  it('creates a hashed token, invalidates active predecessors, and delivers only the raw token', async () => {
    await expect(
      service.forgotPassword({ email: user.email }),
    ).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: user.id, usedAt: null }),
      }),
    );
    const created = tx.passwordResetToken.create.mock.calls[0][0].data;
    const delivered = delivery.deliver.mock.calls[0][0];
    expect(created.tokenHash).toBe(
      createHash('sha256').update(delivered.token).digest('hex'),
    );
    expect(created.tokenHash).not.toBe(delivered.token);
  });

  it('returns the same generic response without creating a token for an unknown email', async () => {
    const existing = await service.forgotPassword({ email: user.email });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const missing = await service.forgotPassword({ email: 'none@example.com' });
    expect(missing).toEqual(existing);
    expect(tx.passwordResetToken.create).toHaveBeenCalledTimes(1);
  });

  it('resets the password and atomically consumes the token', async () => {
    await service.resetPassword({
      token,
      password: 'NewSecurePass1',
      passwordConfirmation: 'NewSecurePass1',
    });
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { usedAt: expect.any(Date) } }),
    );
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        passwordHash: expect.any(String),
        failedLoginAttempts: 0,
        lockedAt: null,
      },
    });
    const hash = tx.user.update.mock.calls[0][0].data.passwordHash;
    await expect(bcrypt.compare('NewSecurePass1', hash)).resolves.toBe(true);
  });

  it('rejects an unknown, expired, used, or concurrently claimed token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.resetPassword({
        token,
        password: 'NewSecurePass1',
        passwordConfirmation: 'NewSecurePass1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      ...storedToken,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      service.resetPassword({
        token,
        password: 'NewSecurePass1',
        passwordConfirmation: 'NewSecurePass1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      ...storedToken,
      usedAt: new Date(),
    });
    await expect(
      service.resetPassword({
        token,
        password: 'NewSecurePass1',
        passwordConfirmation: 'NewSecurePass1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    tx.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.resetPassword({
        token,
        password: 'NewSecurePass1',
        passwordConfirmation: 'NewSecurePass1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects mismatched reset confirmation', async () => {
    await expect(
      service.resetPassword({
        token,
        password: 'NewSecurePass1',
        passwordConfirmation: 'DifferentPass1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('changes an authenticated user password and clears lockout state', async () => {
    const currentHash = await bcrypt.hash('CurrentPass1', 4);
    prisma.user.findUnique.mockResolvedValueOnce({
      ...user,
      passwordHash: currentHash,
    });
    await service.changePassword(user.id, {
      currentPassword: 'CurrentPass1',
      newPassword: 'NewSecurePass1',
      newPasswordConfirmation: 'NewSecurePass1',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        passwordHash: expect.any(String),
        failedLoginAttempts: 0,
        lockedAt: null,
      },
    });
  });

  it('rejects an incorrect current password, mismatch, and password reuse', async () => {
    const currentHash = await bcrypt.hash('CurrentPass1', 4);
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash: currentHash,
    });
    await expect(
      service.changePassword(user.id, {
        currentPassword: 'WrongPass1',
        newPassword: 'NewSecurePass1',
        newPasswordConfirmation: 'NewSecurePass1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.changePassword(user.id, {
        currentPassword: 'CurrentPass1',
        newPassword: 'NewSecurePass1',
        newPasswordConfirmation: 'DifferentPass1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.changePassword(user.id, {
        currentPassword: 'CurrentPass1',
        newPassword: 'CurrentPass1',
        newPasswordConfirmation: 'CurrentPass1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
