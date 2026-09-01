import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaAuthRepository } from './prisma-auth.repository';

const userRow = {
  id: 1,
  email: 'admin@example.com',
  fullName: 'Admin',
  status: 'ACTIVE',
  passwordHash: 'hashed',
  lockedAt: null,
  failedLoginAttempts: 0,
  lastLoginAt: null,
  role: { name: 'Administrador' },
};

const activationTokenRow = {
  id: 10,
  userId: 5,
  usedAt: null,
  expiresAt: new Date(),
  user: { status: 'INACTIVE' },
};

const resetTokenRow = {
  id: 20,
  userId: 5,
  usedAt: null,
  expiresAt: new Date(),
};

function createDb() {
  const db = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    accountActivationToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation(
    async (fn: (tx: typeof db) => Promise<unknown>) => fn(db),
  );
  return db;
}

const anyDate = expect.any(Date) as unknown as Date;
describe('PrismaAuthRepository', () => {
  let db: ReturnType<typeof createDb>;
  let repository: PrismaAuthRepository;

  beforeEach(() => {
    db = createDb();
    repository = new PrismaAuthRepository(db as unknown as PrismaService);
  });

  it('maps a user found by email to the auth account model', async () => {
    db.user.findUnique.mockResolvedValueOnce(userRow);

    await expect(
      repository.findCredentialsByEmail('admin@example.com'),
    ).resolves.toEqual({
      id: 1,
      email: 'admin@example.com',
      fullName: 'Admin',
      status: 'ACTIVE',
      passwordHash: 'hashed',
      lockedAt: null,
      failedLoginAttempts: 0,
      lastLoginAt: null,
      roleName: 'Administrador',
    });
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
      include: { role: true },
    });
  });

  it('returns null when no user matches the email', async () => {
    db.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      repository.findCredentialsByEmail('ghost@example.com'),
    ).resolves.toBeNull();
  });

  it('maps a user found by id to the auth account model', async () => {
    db.user.findUnique.mockResolvedValueOnce(userRow);

    await expect(repository.findCredentialsById(1)).resolves.toMatchObject({
      id: 1,
      roleName: 'Administrador',
    });
  });

  it('maps an activation token with the user status', async () => {
    db.accountActivationToken.findUnique.mockResolvedValueOnce(
      activationTokenRow,
    );

    await expect(repository.findActivationToken('hash')).resolves.toEqual({
      id: 10,
      userId: 5,
      usedAt: null,
      expiresAt: anyDate,
      userStatus: 'INACTIVE',
    });
  });

  it('returns null when no activation token matches', async () => {
    db.accountActivationToken.findUnique.mockResolvedValueOnce(null);

    await expect(repository.findActivationToken('hash')).resolves.toBeNull();
  });

  it('maps a reset token', async () => {
    db.passwordResetToken.findUnique.mockResolvedValueOnce(resetTokenRow);

    await expect(repository.findResetToken('hash')).resolves.toEqual({
      id: 20,
      userId: 5,
      usedAt: null,
      expiresAt: anyDate,
    });
  });

  it('returns false and does not lock while attempts are below the threshold', async () => {
    db.user.update.mockResolvedValueOnce({ failedLoginAttempts: 2 });

    await expect(repository.recordFailedLogin(1, 5)).resolves.toBe(false);
    expect(db.user.update).toHaveBeenCalledTimes(1);
  });

  it('returns true and locks when attempts reach the threshold', async () => {
    db.user.update.mockResolvedValueOnce({ failedLoginAttempts: 5 });

    await expect(repository.recordFailedLogin(1, 5)).resolves.toBe(true);
    expect(db.user.update).toHaveBeenCalledTimes(2);
    expect(db.user.update).toHaveBeenLastCalledWith({
      where: { id: 1 },
      data: { lockedAt: anyDate },
    });
  });

  it('clears the lockout', async () => {
    await repository.clearLockout(1);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { failedLoginAttempts: 0, lockedAt: null },
    });
  });

  it('records a successful login with last login time', async () => {
    await repository.recordLoginSuccess(1);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        failedLoginAttempts: 0,
        lockedAt: null,
        lastLoginAt: anyDate,
      },
    });
  });

  it('creates a session and records login success atomically', async () => {
    await repository.recordLoginSuccessAndCreateSession(
      1,
      'refresh-hash',
      new Date('2026-09-02T00:00:00.000Z'),
    );

    expect(db.session.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        refreshTokenHash: 'refresh-hash',
        expiresAt: new Date('2026-09-02T00:00:00.000Z'),
      },
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        failedLoginAttempts: 0,
        lockedAt: null,
        lastLoginAt: anyDate,
      },
    });
  });

  it('invalidates previous reset tokens and creates a new one', async () => {
    db.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 1 });
    db.passwordResetToken.create.mockResolvedValueOnce({ id: 30 });

    await repository.invalidateAndCreateResetToken(
      1,
      'hash',
      new Date('2026-01-01'),
    );

    expect(db.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
        usedAt: null,
        expiresAt: { gt: anyDate },
      },
      data: { usedAt: anyDate },
    });
    expect(db.passwordResetToken.create).toHaveBeenCalledWith({
      data: { userId: 1, tokenHash: 'hash', expiresAt: new Date('2026-01-01') },
    });
  });

  it('updates the password and clears the lockout', async () => {
    await repository.updatePassword(1, 'new-hash');

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        passwordHash: 'new-hash',
        failedLoginAttempts: 0,
        lockedAt: null,
      },
    });
  });

  it('exposes transactional claim and activation operations', async () => {
    db.accountActivationToken.updateMany.mockResolvedValueOnce({ count: 1 });
    db.user.updateMany.mockResolvedValueOnce({ count: 1 });

    const result = await repository.withTransaction(async (tx) => {
      const claimed = await tx.claimActivationToken(10, new Date());
      const activated = await tx.activateUser(5, 'hashed');
      return { claimed, activated };
    });

    expect(result).toEqual({ claimed: true, activated: true });
    expect(db.accountActivationToken.updateMany).toHaveBeenCalledWith({
      where: { id: 10, usedAt: null, expiresAt: { gt: anyDate } },
      data: { usedAt: anyDate },
    });
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: { id: 5, status: 'INACTIVE' },
      data: { passwordHash: 'hashed', status: 'ACTIVE' },
    });
  });

  it('returns false when the activation claim affects no rows', async () => {
    db.accountActivationToken.updateMany.mockResolvedValueOnce({ count: 0 });

    const claimed = await repository.withTransaction(async (tx) =>
      tx.claimActivationToken(10, new Date()),
    );

    expect(claimed).toBe(false);
  });

  it('exposes transactional reset claim and password update', async () => {
    db.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 1 });
    db.user.update.mockResolvedValueOnce({ id: 5 });

    const result = await repository.withTransaction(async (tx) => {
      const claimed = await tx.claimResetToken(20, new Date());
      await tx.setUserPassword(5, 'hashed');
      return claimed;
    });

    expect(result).toBe(true);
    expect(db.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { id: 20, usedAt: null, expiresAt: { gt: anyDate } },
      data: { usedAt: anyDate },
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { passwordHash: 'hashed', failedLoginAttempts: 0, lockedAt: null },
    });
  });

  it('revokes user sessions inside the auth transaction', async () => {
    db.session.updateMany.mockResolvedValueOnce({ count: 2 });

    const revoked = await repository.withTransaction((tx) =>
      tx.revokeUserSessions(5, 'password-reset'),
    );

    expect(revoked).toBe(2);
    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 5, revokedAt: null },
      data: {
        revokedAt: anyDate,
        revocationReason: 'password-reset',
      },
    });
  });
});
