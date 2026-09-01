import { AuditAction } from '../../../audit/audit-actions';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  const repository = {
    findCredentialsById: jest.fn(),
    withTransaction: jest.fn(),
  };
  const hasher = { hash: jest.fn(), compare: jest.fn() };
  const audit = { record: jest.fn() };
  const tx = {
    setUserPassword: jest.fn(),
    revokeUserSessions: jest.fn(),
  };
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
    repository.withTransaction.mockImplementation(
      (work: (transaction: typeof tx) => Promise<unknown>) => work(tx),
    );
    tx.revokeUserSessions.mockResolvedValue(1);
  });

  it('throws an application error when new passwords do not match', async () => {
    await expect(
      useCase.execute(1, 'current', 'NewPassword1!', 'Other1!'),
    ).rejects.toMatchObject({ code: 'PASSWORDS_DO_NOT_MATCH' });
    expect(repository.findCredentialsById).not.toHaveBeenCalled();
  });

  it('throws an application error for an unknown account', async () => {
    repository.findCredentialsById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute(1, 'current', 'NewPassword1!', 'NewPassword1!'),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('throws an application error when there is no password hash', async () => {
    repository.findCredentialsById.mockResolvedValueOnce({
      id: 1,
      passwordHash: null,
    });

    await expect(
      useCase.execute(1, 'current', 'NewPassword1!', 'NewPassword1!'),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('throws an application error when the current password is wrong', async () => {
    hasher.compare.mockResolvedValueOnce(false);

    await expect(
      useCase.execute(1, 'wrong', 'NewPassword1!', 'NewPassword1!'),
    ).rejects.toMatchObject({ code: 'CURRENT_PASSWORD_INCORRECT' });
    expect(repository.withTransaction).not.toHaveBeenCalled();
  });

  it('throws an application error when the new password is the same', async () => {
    hasher.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await expect(
      useCase.execute(1, 'current', 'current', 'current'),
    ).rejects.toMatchObject({ code: 'NEW_PASSWORD_MUST_DIFFER' });
    expect(repository.withTransaction).not.toHaveBeenCalled();
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
    expect(tx.setUserPassword).toHaveBeenCalledWith(1, 'new-hash');
    expect(tx.revokeUserSessions).toHaveBeenCalledWith(1, 'password-change');
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

  it('fails the transaction when session revocation fails', async () => {
    tx.revokeUserSessions.mockRejectedValueOnce(new Error('db failure'));

    await expect(
      useCase.execute(1, 'current', 'NewPassword1!', 'NewPassword1!'),
    ).rejects.toThrow('db failure');
    expect(tx.setUserPassword).toHaveBeenCalledWith(1, 'new-hash');
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('does not attempt session revocation when password persistence fails', async () => {
    tx.setUserPassword.mockRejectedValueOnce(new Error('password failure'));

    await expect(
      useCase.execute(1, 'current', 'NewPassword1!', 'NewPassword1!'),
    ).rejects.toThrow('password failure');
    expect(tx.revokeUserSessions).not.toHaveBeenCalled();
  });
});
