process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

import { Prisma, PrismaClient } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegistrationConflictError } from '../domain/errors/registration-conflict.error';
import { PrismaUsersRepository } from './prisma-users.repository';

describe('PrismaUsersRepository registration methods', () => {
  const db = {
    role: { findUnique: jest.fn() },
    user: { create: jest.fn() },
  };
  const repository = new PrismaUsersRepository(
    {} as PrismaService,
    db as unknown as PrismaClient,
  );

  beforeEach(() => jest.clearAllMocks());

  it('resolves the registration role by semantic name', async () => {
    db.role.findUnique.mockResolvedValue({
      id: 5,
      name: 'Subscription_L1',
      description: null,
      isActive: true,
    });

    await repository.findRoleByName('Subscription_L1');

    expect(db.role.findUnique).toHaveBeenCalledWith({
      where: { name: 'Subscription_L1' },
      select: { id: true, name: true, description: true, isActive: true },
    });
  });

  it('maps a Prisma uniqueness race without leaking P2002', async () => {
    db.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      repository.create({
        fullName: 'Persona Usuaria',
        identificationType: 'NATIONAL',
        identification: '123456789',
        email: 'persona@example.com',
        passwordHash: 'secure-hash',
        status: 'ACTIVE',
        roleId: 5,
      }),
    ).rejects.toBeInstanceOf(RegistrationConflictError);
  });
});
