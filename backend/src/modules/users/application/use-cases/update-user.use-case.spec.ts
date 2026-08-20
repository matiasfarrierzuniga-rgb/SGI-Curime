import { AuditAction } from '../../../../audit/audit-actions';
import { UserStatus } from '../../domain/entities/user';
import { EmailAlreadyRegisteredError } from '../../domain/errors/email-already-registered.error';
import { EmptyUpdateError } from '../../domain/errors/empty-update.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { UpdateUserUseCase } from './update-user.use-case';

const domainUser = {
  id: 2,
  fullName: 'Persona Usuaria',
  identification: '2-2222',
  email: 'persona@example.com',
  phone: null,
  address: null,
  status: UserStatus.ACTIVE,
  lockedAt: null,
  roleId: 2,
  role: { id: 2, name: 'Tesorero', description: null, isActive: true },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UpdateUserUseCase', () => {
  const repository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updateProfile: jest.fn(),
  };
  const audit = { record: jest.fn() };
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateUserUseCase(
      repository as unknown as UsersRepository,
      audit,
    );
    repository.findById.mockResolvedValue(domainUser);
    repository.findByEmail.mockResolvedValue(null);
    repository.updateProfile.mockResolvedValue(domainUser);
  });

  it('rejects an empty update', async () => {
    await expect(useCase.execute(2, {})).rejects.toBeInstanceOf(
      EmptyUpdateError,
    );
  });

  it('throws UserNotFoundError for an unknown user', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(99, { fullName: 'Nuevo' }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('throws EmailAlreadyRegisteredError for a duplicated email', async () => {
    repository.findByEmail.mockResolvedValue({ id: 3 });

    await expect(
      useCase.execute(2, { email: 'duplicate@example.com' }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });

  it('updates the profile and records an audit event', async () => {
    const result = await useCase.execute(2, { fullName: 'Nombre Nuevo' }, 1, {
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    });

    expect(repository.updateProfile).toHaveBeenCalledWith(2, {
      fullName: 'Nombre Nuevo',
    });
    expect(result).toEqual(domainUser);
    expect(audit.record).toHaveBeenCalledWith({
      userId: 1,
      action: AuditAction.USER_UPDATED,
      module: 'USERS',
      entityType: 'User',
      entityId: 2,
      details: { changedFields: ['fullName'] },
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    });
  });

  it('propagates an EmailAlreadyRegisteredError raised by the repository', async () => {
    repository.updateProfile.mockRejectedValue(
      new EmailAlreadyRegisteredError(),
    );

    await expect(
      useCase.execute(2, { email: 'taken@example.com' }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});
