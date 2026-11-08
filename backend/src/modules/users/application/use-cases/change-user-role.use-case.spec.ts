import { AuditAction } from '../../../../audit/audit-actions';
import { UserStatus } from '../../domain/entities/user';
import { InactiveRoleError } from '../../domain/errors/inactive-role.error';
import { ActivationNotCompletedError } from '../../domain/errors/activation-not-completed.error';
import { LastAdministratorError } from '../../domain/errors/last-administrator.error';
import { RoleNotFoundError } from '../../domain/errors/role-not-found.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { NonAssignableRoleError } from '../../domain/errors/non-assignable-role.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { ChangeUserRoleUseCase } from './change-user-role.use-case';

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
  role: { id: 1, name: 'ROLE_SYSTEM_ADMIN', description: null, isActive: true },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const treasurer = {
  id: 2,
  name: 'ROLE_INSTITUTIONAL_TREASURER',
  description: null,
  isActive: true,
};

describe('ChangeUserRoleUseCase', () => {
  const repository = {
    withTransaction: jest.fn(),
    findById: jest.fn(),
    findRoleById: jest.fn(),
    countActiveAdministrators: jest.fn(),
    updateRole: jest.fn(),
    communityVerificationEvidence: jest.fn(),
  };
  const audit = { record: jest.fn() };
  let useCase: ChangeUserRoleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ChangeUserRoleUseCase(
      repository as unknown as UsersRepository,
      audit,
    );
    repository.withTransaction.mockImplementation(
      (work: (tx: unknown) => Promise<unknown>) => work(repository),
    );
    repository.findById.mockResolvedValue(adminUser);
    repository.findRoleById.mockResolvedValue(treasurer);
    repository.countActiveAdministrators.mockResolvedValue(1);
    repository.updateRole.mockResolvedValue(adminUser);
  });

  it('throws UserNotFoundError for an unknown user', async () => {
    repository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(99, 2)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it('rejects role changes while email verification is pending', async () => {
    repository.findById.mockResolvedValueOnce({
      ...adminUser,
      status: UserStatus.PENDING_EMAIL_VERIFICATION,
    });
    await expect(useCase.execute(1, 2)).rejects.toThrow();
    expect(repository.updateRole).not.toHaveBeenCalled();
  });

  it.each(['Cuenta comunitaria', 'ROLE_COMMUNITY_USER'])(
    'rejects role changes without verification for %s',
    async (role) => {
      repository.findById.mockResolvedValueOnce({
        ...adminUser,
        status: UserStatus.INACTIVE,
        role: { ...adminUser.role, name: role },
      });
      repository.communityVerificationEvidence.mockResolvedValueOnce(null);
      await expect(useCase.execute(1, 2)).rejects.toBeInstanceOf(
        ActivationNotCompletedError,
      );
      expect(repository.updateRole).not.toHaveBeenCalled();
    },
  );

  it('throws RoleNotFoundError for an unknown role', async () => {
    repository.findRoleById.mockResolvedValueOnce(null);

    await expect(useCase.execute(1, 999)).rejects.toBeInstanceOf(
      RoleNotFoundError,
    );
  });

  it('throws InactiveRoleError for an inactive role', async () => {
    repository.findRoleById.mockResolvedValueOnce({
      ...treasurer,
      isActive: false,
    });

    await expect(useCase.execute(1, 3)).rejects.toBeInstanceOf(
      InactiveRoleError,
    );
  });

  it('rejects an active legacy role', async () => {
    repository.findRoleById.mockResolvedValueOnce({
      ...treasurer,
      name: 'Tesorero',
    });

    await expect(useCase.execute(1, 3)).rejects.toBeInstanceOf(
      NonAssignableRoleError,
    );
    expect(repository.updateRole).not.toHaveBeenCalled();
  });

  it('does not demote the last active administrator', async () => {
    repository.countActiveAdministrators.mockResolvedValueOnce(0);

    await expect(useCase.execute(1, 2)).rejects.toBeInstanceOf(
      LastAdministratorError,
    );
    expect(repository.updateRole).not.toHaveBeenCalled();
  });

  it('changes the role and records an audit event', async () => {
    const result = await useCase.execute(1, 2, 7, {
      ipAddress: '127.0.0.1',
    });

    expect(repository.updateRole).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual(adminUser);
    expect(audit.record).toHaveBeenCalledWith({
      userId: 7,
      action: AuditAction.USER_ROLE_CHANGED,
      module: 'USERS',
      entityType: 'User',
      entityId: 1,
      details: { previousRoleId: 1, newRoleId: 2 },
      ipAddress: '127.0.0.1',
    });
    expect(repository.withTransaction.mock.invocationCallOrder[0]).toBeLessThan(
      audit.record.mock.invocationCallOrder[0],
    );
  });

  it('delegates session invalidation to the atomic role update', async () => {
    await useCase.execute(1, 2);
    expect(repository.updateRole).toHaveBeenCalledWith(1, 2);
  });
});
