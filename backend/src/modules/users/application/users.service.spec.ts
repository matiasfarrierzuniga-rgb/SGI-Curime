import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserStatus } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from './users.service';

process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

const safeUser = {
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
  const prisma = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    role: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as unknown as PrismaService);
    prisma.$transaction.mockImplementation((argument: unknown) => {
      if (Array.isArray(argument)) return Promise.all(argument);
      return (argument as (tx: typeof prisma) => unknown)(prisma);
    });
    prisma.user.findMany.mockResolvedValue([safeUser]);
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findUnique.mockResolvedValue(safeUser);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue(safeUser);
    prisma.role.findUnique.mockResolvedValue({
      id: 2,
      name: 'Tesorero',
      isActive: true,
    });
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

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
    const query = prisma.user.findMany.mock.calls[0][0];
    expect(query.where).toEqual(
      expect.objectContaining({ status: UserStatus.ACTIVE, roleId: 2 }),
    );
    expect(query.select.passwordHash).toBeUndefined();
    expect(result).toEqual(
      expect.objectContaining({ total: 1, page: 2, limit: 5 }),
    );
    expect(result.data[0]).not.toHaveProperty('passwordHash');
  });

  it('returns safe detail and reports an unknown user', async () => {
    const result = await service.findOne(2);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.role.name).toBe('Tesorero');

    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates allowed fields', async () => {
    await service.update(2, { fullName: 'Nombre Nuevo' });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { fullName: 'Nombre Nuevo' } }),
    );
  });

  it('rejects a duplicated email', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({ id: 3 });
    await expect(
      service.update(2, { email: 'duplicate@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('changes to an existing active role only', async () => {
    await service.changeRole(2, 2);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { roleId: 2 } }),
    );

    prisma.role.findUnique.mockResolvedValueOnce(null);
    await expect(service.changeRole(2, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.role.findUnique.mockResolvedValueOnce({
      id: 3,
      name: 'Otro',
      isActive: false,
    });
    await expect(service.changeRole(2, 3)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('activates only an existing account with a password', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 2,
      passwordHash: 'hash',
      status: UserStatus.INACTIVE,
    });
    await service.activate(2);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: UserStatus.ACTIVE } }),
    );

    prisma.user.findUnique.mockResolvedValueOnce({
      id: 2,
      passwordHash: null,
      status: UserStatus.INACTIVE,
    });
    await expect(service.activate(2)).rejects.toBeInstanceOf(ConflictException);

    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.activate(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.user.findUnique.mockResolvedValueOnce({
      id: 2,
      passwordHash: 'hash',
      status: UserStatus.BLOCKED,
    });
    await expect(service.activate(2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('manually unlocks only a current temporary lock', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 2,
      status: UserStatus.ACTIVE,
      lockedAt: new Date(),
    });
    await service.unlock(2);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: { failedLoginAttempts: 0, lockedAt: null },
      }),
    );
  });

  it('rejects unlock for a user without a current temporary lock', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 2,
      status: UserStatus.ACTIVE,
      lockedAt: null,
    });
    await expect(service.unlock(2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects unlock for an unknown or administratively blocked user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.unlock(99)).rejects.toBeInstanceOf(NotFoundException);

    prisma.user.findUnique.mockResolvedValueOnce({
      id: 2,
      status: UserStatus.BLOCKED,
      lockedAt: new Date(),
    });
    await expect(service.unlock(2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates a regular user', async () => {
    await service.deactivate(2);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: UserStatus.INACTIVE } }),
    );
  });

  it('does not deactivate the last active administrator', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 1,
      status: UserStatus.ACTIVE,
      role: { name: 'Administrador' },
    });
    prisma.user.count.mockResolvedValueOnce(0);
    await expect(service.deactivate(1)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
