import { AuditAction } from '../../../../audit/audit-actions';
import { UserStatus } from '../../domain/entities/user';
import { AccountBlockedError } from '../../domain/errors/account-blocked.error';
import { AccountNotLockedError } from '../../domain/errors/account-not-locked.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { UnlockUserUseCase } from './unlock-user.use-case';

process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

const domainUser = {
  id: 2,
  fullName: 'Persona Usuaria',
  identification: '2-2222',
  email: 'persona@example.com',
  phone: null,
  address: null,
  status: UserStatus.ACTIVE,
  lockedAt: new Date(),
  roleId: 2,
  role: { id: 2, name: 'Tesorero', description: null, isActive: true },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UnlockUserUseCase', () => {
  const repository = {
    findById: jest.fn(),
    resetTemporaryLock: jest.fn(),
  };
  const audit = { record: jest.fn() };
  let useCase: UnlockUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UnlockUserUseCase(
      repository as unknown as UsersRepository,
      audit,
    );
    repository.findById.mockResolvedValue(domainUser);
    repository.resetTemporaryLock.mockResolvedValue(domainUser);
  });

  it('throws UserNotFoundError for an unknown user', async () => {
    repository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(99)).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('throws AccountBlockedError for an administratively blocked user', async () => {
    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      status: UserStatus.BLOCKED,
    });

    await expect(useCase.execute(2)).rejects.toBeInstanceOf(
      AccountBlockedError,
    );
  });

  it('throws AccountNotLockedError when there is no temporary lock', async () => {
    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      lockedAt: null,
    });

    await expect(useCase.execute(2)).rejects.toBeInstanceOf(
      AccountNotLockedError,
    );
  });

  it('unlocks the user and records an audit event', async () => {
    const result = await useCase.execute(2, 5, { ipAddress: '127.0.0.1' });

    expect(repository.resetTemporaryLock).toHaveBeenCalledWith(2);
    expect(result).toEqual(domainUser);
    expect(audit.record).toHaveBeenCalledWith({
      userId: 5,
      action: AuditAction.ACCOUNT_UNLOCKED,
      module: 'USERS',
      entityType: 'User',
      entityId: 2,
      ipAddress: '127.0.0.1',
    });
  });
});
