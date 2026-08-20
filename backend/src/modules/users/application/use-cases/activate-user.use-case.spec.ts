import { AuditAction } from '../../../../audit/audit-actions';
import { UserStatus } from '../../domain/entities/user';
import { AccountAlreadyActiveError } from '../../domain/errors/account-already-active.error';
import { AccountBlockedError } from '../../domain/errors/account-blocked.error';
import { ActivationNotCompletedError } from '../../domain/errors/activation-not-completed.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { ActivateUserUseCase } from './activate-user.use-case';

const domainUser = {
  id: 2,
  fullName: 'Persona Usuaria',
  identification: '2-2222',
  email: 'persona@example.com',
  phone: null,
  address: null,
  status: UserStatus.INACTIVE,
  lockedAt: null,
  roleId: 2,
  role: { id: 2, name: 'Tesorero', description: null, isActive: true },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ActivateUserUseCase', () => {
  const repository = {
    findById: jest.fn(),
    getPasswordHash: jest.fn(),
    updateStatus: jest.fn(),
  };
  const audit = { record: jest.fn() };
  let useCase: ActivateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ActivateUserUseCase(
      repository as unknown as UsersRepository,
      audit,
    );
    repository.findById.mockResolvedValue(domainUser);
    repository.getPasswordHash.mockResolvedValue('hash');
    repository.updateStatus.mockResolvedValue(domainUser);
  });

  it('throws UserNotFoundError for an unknown user', async () => {
    repository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(99)).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('throws ActivationNotCompletedError when no password is set', async () => {
    repository.getPasswordHash.mockResolvedValueOnce(null);

    await expect(useCase.execute(2)).rejects.toBeInstanceOf(
      ActivationNotCompletedError,
    );
  });

  it('throws AccountBlockedError for a blocked user', async () => {
    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      status: UserStatus.BLOCKED,
    });

    await expect(useCase.execute(2)).rejects.toBeInstanceOf(
      AccountBlockedError,
    );
  });

  it('throws AccountAlreadyActiveError for an active user', async () => {
    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      status: UserStatus.ACTIVE,
    });

    await expect(useCase.execute(2)).rejects.toBeInstanceOf(
      AccountAlreadyActiveError,
    );
  });

  it('activates the user and records an audit event', async () => {
    const result = await useCase.execute(2, 5, { ipAddress: '127.0.0.1' });

    expect(repository.updateStatus).toHaveBeenCalledWith(2, UserStatus.ACTIVE);
    expect(result).toEqual(domainUser);
    expect(audit.record).toHaveBeenCalledWith({
      userId: 5,
      action: AuditAction.USER_ACTIVATED,
      module: 'USERS',
      entityType: 'User',
      entityId: 2,
      ipAddress: '127.0.0.1',
    });
  });
});
