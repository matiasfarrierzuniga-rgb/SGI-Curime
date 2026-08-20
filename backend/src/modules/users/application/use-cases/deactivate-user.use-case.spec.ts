import { AuditAction } from '../../../../audit/audit-actions';
import { UserStatus } from '../../domain/entities/user';
import { AccountAlreadyInactiveError } from '../../domain/errors/account-already-inactive.error';
import { LastAdministratorError } from '../../domain/errors/last-administrator.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { DeactivateUserUseCase } from './deactivate-user.use-case';

const adminUser = {
  id: 1,
  fullName: 'Admin',
  identification: '1-1111',
  email: 'admin@example.com',
  phone: null,
  address: null,
  status: UserStatus.ACTIVE,
  lockedAt: null,
  roleId: 1,
  role: { id: 1, name: 'Administrador', description: null, isActive: true },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DeactivateUserUseCase', () => {
  const repository = {
    withTransaction: jest.fn(),
    findById: jest.fn(),
    countActiveAdministrators: jest.fn(),
    updateStatus: jest.fn(),
  };
  const audit = { record: jest.fn() };
  let useCase: DeactivateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new DeactivateUserUseCase(
      repository as unknown as UsersRepository,
      audit,
    );
    repository.withTransaction.mockImplementation(
      (work: (tx: unknown) => Promise<unknown>) => work(repository),
    );
    repository.findById.mockResolvedValue(adminUser);
    repository.countActiveAdministrators.mockResolvedValue(1);
    repository.updateStatus.mockResolvedValue(adminUser);
  });

  it('throws UserNotFoundError for an unknown user', async () => {
    repository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(99)).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('throws AccountAlreadyInactiveError for an inactive user', async () => {
    repository.findById.mockResolvedValueOnce({
      ...adminUser,
      status: UserStatus.INACTIVE,
    });

    await expect(useCase.execute(1)).rejects.toBeInstanceOf(
      AccountAlreadyInactiveError,
    );
  });

  it('does not deactivate the last active administrator', async () => {
    repository.countActiveAdministrators.mockResolvedValueOnce(0);

    await expect(useCase.execute(1)).rejects.toBeInstanceOf(
      LastAdministratorError,
    );
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it('deactivates the user and records an audit event', async () => {
    const result = await useCase.execute(1, 7, { ipAddress: '127.0.0.1' });

    expect(repository.updateStatus).toHaveBeenCalledWith(
      1,
      UserStatus.INACTIVE,
    );
    expect(result).toEqual(adminUser);
    expect(audit.record).toHaveBeenCalledWith({
      userId: 7,
      action: AuditAction.USER_DEACTIVATED,
      module: 'USERS',
      entityType: 'User',
      entityId: 1,
      ipAddress: '127.0.0.1',
    });
  });
});
