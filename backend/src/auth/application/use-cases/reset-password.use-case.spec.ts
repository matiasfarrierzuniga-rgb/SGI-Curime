import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuditAction } from '../../../audit/audit-actions';
import { ResetPasswordUseCase } from './reset-password.use-case';

const resetToken = {
  id: 20,
  userId: 5,
  usedAt: null,
  expiresAt: new Date(Date.now() + 60 * 60_000),
};

describe('ResetPasswordUseCase', () => {
  const repository = {
    findResetToken: jest.fn(),
    withTransaction: jest.fn(),
  };
  const hasher = { hash: jest.fn(), compare: jest.fn() };
  const audit = { record: jest.fn() };
  const tx = {
    claimResetToken: jest.fn(),
    setUserPassword: jest.fn(),
  };
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ResetPasswordUseCase(repository as never, hasher, audit);
    repository.findResetToken.mockResolvedValue(resetToken);
    repository.withTransaction.mockImplementation(
      (work: (t: typeof tx) => Promise<unknown>) => work(tx),
    );
    tx.claimResetToken.mockResolvedValue(true);
    hasher.hash.mockResolvedValue('hashed-password');
  });

  it('throws BadRequestException when passwords do not match', async () => {
    await expect(
      useCase.execute('token', 'Password1!', 'Other1!'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findResetToken).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for an invalid token', async () => {
    repository.findResetToken.mockResolvedValueOnce(null);

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toThrow('Invalid reset token');
  });

  it('throws ConflictException when the token was already used', async () => {
    repository.findResetToken.mockResolvedValueOnce({
      ...resetToken,
      usedAt: new Date(),
    });

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws BadRequestException when the token has expired', async () => {
    repository.findResetToken.mockResolvedValueOnce({
      ...resetToken,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toThrow('Reset token has expired');
  });

  it('throws ConflictException when the claim fails in the transaction', async () => {
    tx.claimResetToken.mockResolvedValueOnce(false);

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toThrow('Reset token is no longer valid');
    expect(tx.setUserPassword).not.toHaveBeenCalled();
  });

  it('sets the password, clears the lockout and audits', async () => {
    const result = await useCase.execute('token', 'Password1!', 'Password1!', {
      ipAddress: '127.0.0.1',
    });

    expect(hasher.hash).toHaveBeenCalledWith('Password1!');
    expect(tx.claimResetToken).toHaveBeenCalledWith(20, expect.any(Date));
    expect(tx.setUserPassword).toHaveBeenCalledWith(5, 'hashed-password');
    expect(audit.record).toHaveBeenCalledWith({
      userId: 5,
      action: AuditAction.PASSWORD_RESET,
      module: 'AUTH',
      entityType: 'User',
      entityId: 5,
      ipAddress: '127.0.0.1',
    });
    expect(result).toEqual({ message: 'Password reset successfully' });
  });
});
