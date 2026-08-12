import { BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AccountActivationService } from './account-activation.service';

describe('AccountActivationService', () => {
  const token = 'secure-token';
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const stored = {
    id: 3,
    tokenHash,
    userId: 8,
    usedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: 8, status: 'INACTIVE' },
  };
  const tx = {
    accountActivationToken: { updateMany: jest.fn() },
    user: { updateMany: jest.fn() },
  };
  const prisma = {
    accountActivationToken: { findUnique: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const service = new AccountActivationService(prisma as never);
  const dto = {
    token,
    password: 'SecurePass1',
    passwordConfirmation: 'SecurePass1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.accountActivationToken.findUnique.mockResolvedValue(stored);
    tx.accountActivationToken.updateMany.mockResolvedValue({ count: 1 });
    tx.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it('activates the user and consumes the token atomically', async () => {
    await expect(service.activate(dto)).resolves.toEqual({
      message: 'Account activated successfully',
    });
    expect(prisma.accountActivationToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash },
      include: { user: true },
    });
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 8, status: 'INACTIVE' },
      data: { passwordHash: expect.any(String), status: 'ACTIVE' },
    });
    const update = tx.user.updateMany.mock.calls[0][0] as {
      data: { passwordHash: string };
    };
    await expect(
      bcrypt.compare(dto.password, update.data.passwordHash),
    ).resolves.toBe(true);
    expect(tx.accountActivationToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { usedAt: expect.any(Date) } }),
    );
  });

  it('rejects different passwords', async () => {
    await expect(
      service.activate({ ...dto, passwordConfirmation: 'DifferentPass1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unknown token', async () => {
    prisma.accountActivationToken.findUnique.mockResolvedValue(null);
    await expect(service.activate(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an expired token', async () => {
    prisma.accountActivationToken.findUnique.mockResolvedValue({
      ...stored,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.activate(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a used token, including a second attempt', async () => {
    prisma.accountActivationToken.findUnique.mockResolvedValue({
      ...stored,
      usedAt: new Date(),
    });
    await expect(service.activate(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
