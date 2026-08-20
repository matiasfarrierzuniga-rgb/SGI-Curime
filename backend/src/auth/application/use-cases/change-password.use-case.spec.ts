import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuditAction } from '../../../audit/audit-actions';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  const repository = {
    findCredentialsById: jest.fn(),
    updatePassword: jest.fn(),
  };
  const hasher = { hash: jest.fn(), compare: jest.fn() };
  const audit = { record: jest.fn() };
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ChangePasswordUseCase(repository as never, hasher, audit);
    repository.findCredentialsById.mockResolvedValue({
      id: 1,
      passwordHash: 'current-hash',
    });
    hasher.compare.mockImplementation((plain: string) =>
      Promise.resolve(plain === 'current'),
    );
    hasher.hash.mockResolvedValue('new-hash');
    repository.updatePassword.mockResolvedValue(undefined);
  });

  it('throws BadRequestException when new passwords do not match', async () => {
    await expect(
      useCase.execute(1, 'current', 'NewPassword1!', 'Other1!'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findCredentialsById).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException for an unknown account', async () => {
    repository.findCredentialsById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute(1, 'current', 'NewPassword1!', 'NewPassword1!'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws UnauthorizedException when there is no password hash', async () => {
    repository.findCredentialsById.mockResolvedValueOnce({
      id: 1,
      passwordHash: null,
    });

    await expect(
      useCase.execute(1, 'current', 'NewPassword1!', 'NewPassword1!'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws UnauthorizedException when the current password is wrong', async () => {
    hasher.compare.mockResolvedValueOnce(false);

    await expect(
      useCase.execute(1, 'wrong', 'NewPassword1!', 'NewPassword1!'),
    ).rejects.toThrow('Current password is incorrect');
  });

  it('throws ConflictException when the new password is the same', async () => {
    hasher.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await expect(
      useCase.execute(1, 'current', 'current', 'current'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.updatePassword).not.toHaveBeenCalled();
  });

  it('updates the password and audits the change', async () => {
    const result = await useCase.execute(
      1,
      'current',
      'NewPassword1!',
      'NewPassword1!',
      { ipAddress: '127.0.0.1' },
    );

    expect(hasher.compare).toHaveBeenCalledTimes(2);
    expect(repository.updatePassword).toHaveBeenCalledWith(1, 'new-hash');
    expect(audit.record).toHaveBeenCalledWith({
      userId: 1,
      action: AuditAction.PASSWORD_CHANGED,
      module: 'AUTH',
      entityType: 'User',
      entityId: 1,
      ipAddress: '127.0.0.1',
    });
    expect(result).toEqual({ message: 'Password changed successfully' });
  });
});
