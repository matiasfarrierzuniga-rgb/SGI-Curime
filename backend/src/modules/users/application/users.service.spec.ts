import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserStatus } from '../domain/entities/user';
import type { UsersRepository } from '../domain/repositories/users-repository';
import { UsersService } from './users.service';

process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

const domainUser = {
  id: 2,
  fullName: 'Persona Usuaria',
  identification: '2-2222',
  email: 'user@example.com',
  phone: null,
  address: null,
  status: UserStatus.ACTIVE,
  lockedAt: null,
  roleId: 2,
  role: { id: 2, name: 'Tesorero', description: null, isActive: true },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('UsersService', () => {
  const repository = {
    withTransaction: jest.fn(),
    findPage: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findRoleById: jest.fn(),
    getPasswordHash: jest.fn(),
    updateProfile: jest.fn(),
    updateStatus: jest.fn(),
    updateRole: jest.fn(),
    resetTemporaryLock: jest.fn(),
    countActiveAdministrators: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(repository);
    repository.withTransaction.mockImplementation(
      (work: (tx: UsersRepository) => Promise<unknown>) => work(repository),
    );
    repository.findPage.mockResolvedValue({
      data: [domainUser],
      total: 1,
      page: 1,
      limit: 20,
    });
    repository.findById.mockResolvedValue(domainUser);
    repository.findByEmail.mockResolvedValue(null);
    repository.findRoleById.mockResolvedValue({
      id: 2,
      name: 'Tesorero',
      description: null,
      isActive: true,
    });
    repository.getPasswordHash.mockResolvedValue('hash');
    repository.updateProfile.mockResolvedValue(domainUser);
    repository.updateStatus.mockResolvedValue(domainUser);
    repository.updateRole.mockResolvedValue(domainUser);
    repository.resetTemporaryLock.mockResolvedValue(domainUser);
    repository.countActiveAdministrators.mockResolvedValue(1);
  });

  it('lists with filters, pagination, and a safe select', async () => {
    const result = await service.findAll({
      name: 'Persona',
      email: 'user',
      identification: '222',
      status: UserStatus.ACTIVE,
      roleId: 2,
      blocked: false,
      page: 2,
      limit: 5,
    });

    expect(repository.findPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
    );
    expect(result).toEqual(
      expect.objectContaining({ total: 1, page: 1, limit: 20 }),
    );
    expect(result.data[0]).not.toHaveProperty('passwordHash');
  });

  it('returns safe detail and reports an unknown user', async () => {
    const result = await service.findOne(2);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.role.name).toBe('Tesorero');

    repository.findById.mockResolvedValueOnce(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates allowed fields', async () => {
    await service.update(2, { fullName: 'Nombre Nuevo' });
    expect(repository.updateProfile).toHaveBeenCalledWith(2, {
      fullName: 'Nombre Nuevo',
    });
  });

  it('rejects a duplicated email', async () => {
    repository.findByEmail.mockResolvedValueOnce({ id: 3 });
    await expect(
      service.update(2, { email: 'duplicate@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('changes to an existing active role only', async () => {
    await service.changeRole(2, 2);
    expect(repository.updateRole).toHaveBeenCalledWith(2, 2);

    repository.findRoleById.mockResolvedValueOnce(null);
    await expect(service.changeRole(2, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    repository.findRoleById.mockResolvedValueOnce({
      id: 3,
      name: 'Otro',
      description: null,
      isActive: false,
    });
    await expect(service.changeRole(2, 3)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('activates only an existing account with a password', async () => {
    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      status: UserStatus.INACTIVE,
    });
    repository.getPasswordHash.mockResolvedValueOnce('hash');
    await service.activate(2);
    expect(repository.updateStatus).toHaveBeenCalledWith(2, UserStatus.ACTIVE);

    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      status: UserStatus.INACTIVE,
    });
    repository.getPasswordHash.mockResolvedValueOnce(null);
    await expect(service.activate(2)).rejects.toBeInstanceOf(ConflictException);

    repository.findById.mockResolvedValueOnce(null);
    await expect(service.activate(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      status: UserStatus.BLOCKED,
    });
    await expect(service.activate(2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('manually unlocks only a current temporary lock', async () => {
    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      lockedAt: new Date(),
    });
    await service.unlock(2);
    expect(repository.resetTemporaryLock).toHaveBeenCalledWith(2);
  });

  it('rejects unlock for a user without a current temporary lock', async () => {
    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      lockedAt: null,
    });
    await expect(service.unlock(2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects unlock for an unknown or administratively blocked user', async () => {
    repository.findById.mockResolvedValueOnce(null);
    await expect(service.unlock(99)).rejects.toBeInstanceOf(NotFoundException);

    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      status: UserStatus.BLOCKED,
      lockedAt: new Date(),
    });
    await expect(service.unlock(2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates a regular user', async () => {
    await service.deactivate(2);
    expect(repository.updateStatus).toHaveBeenCalledWith(
      2,
      UserStatus.INACTIVE,
    );
  });

  it('does not deactivate the last active administrator', async () => {
    repository.findById.mockResolvedValueOnce({
      ...domainUser,
      id: 1,
      status: UserStatus.ACTIVE,
      role: { id: 1, name: 'Administrador', description: null, isActive: true },
    });
    repository.countActiveAdministrators.mockResolvedValueOnce(0);
    await expect(service.deactivate(1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });
});
