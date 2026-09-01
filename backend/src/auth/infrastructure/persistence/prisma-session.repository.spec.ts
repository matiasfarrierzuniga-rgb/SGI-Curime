import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaSessionRepository } from './prisma-session.repository';

const sessionRow = {
  id: 1,
  userId: 7,
  refreshTokenHash: 'hash-one',
  createdAt: new Date('2026-09-01T10:00:00.000Z'),
  expiresAt: new Date('2026-09-02T10:00:00.000Z'),
  revokedAt: null,
  revocationReason: null,
};

function createDb() {
  return {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

describe('PrismaSessionRepository', () => {
  let db: ReturnType<typeof createDb>;
  let repository: PrismaSessionRepository;

  beforeEach(() => {
    db = createDb();
    repository = new PrismaSessionRepository(db as unknown as PrismaService);
  });

  it('creates sessions for a user without imposing a one-session limit', async () => {
    db.session.create.mockResolvedValueOnce(sessionRow);
    db.session.create.mockResolvedValueOnce({
      ...sessionRow,
      id: 2,
      refreshTokenHash: 'hash-two',
    });

    await repository.create({
      userId: 7,
      refreshTokenHash: 'hash-one',
      expiresAt: sessionRow.expiresAt,
    });
    await repository.create({
      userId: 7,
      refreshTokenHash: 'hash-two',
      expiresAt: sessionRow.expiresAt,
    });

    expect(db.session.create).toHaveBeenNthCalledWith(1, {
      data: {
        userId: 7,
        refreshTokenHash: 'hash-one',
        expiresAt: sessionRow.expiresAt,
      },
    });
    expect(db.session.create).toHaveBeenCalledTimes(2);
  });

  it('reads a persisted session by id', async () => {
    db.session.findUnique.mockResolvedValueOnce(sessionRow);

    await expect(repository.findById(1)).resolves.toEqual(sessionRow);
    expect(db.session.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('finds only unrevoked and unexpired sessions as active', async () => {
    const now = new Date('2026-09-01T12:00:00.000Z');
    db.session.findFirst.mockResolvedValueOnce(sessionRow);

    await expect(repository.findActiveById(1, now)).resolves.toEqual(
      sessionRow,
    );
    expect(db.session.findFirst).toHaveBeenCalledWith({
      where: { id: 1, revokedAt: null, expiresAt: { gt: now } },
    });
  });

  it('returns null when a session is expired or revoked', async () => {
    db.session.findFirst.mockResolvedValueOnce(null);
    db.session.findFirst.mockResolvedValueOnce(null);
    const now = new Date('2026-09-01T12:00:00.000Z');

    await expect(repository.findActiveById(1, now)).resolves.toBeNull();
    await expect(repository.findActiveById(2, now)).resolves.toBeNull();
  });

  it('persists revocation reason once and makes repeat revocation a no-op', async () => {
    const revokedAt = new Date('2026-09-01T12:00:00.000Z');
    db.session.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(repository.revoke(1, revokedAt, 'logout')).resolves.toBe(true);
    await expect(repository.revoke(1, revokedAt, 'logout')).resolves.toBe(
      false,
    );
    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { id: 1, revokedAt: null },
      data: { revokedAt, revocationReason: 'logout' },
    });
  });

  it('revokes every active session for a user', async () => {
    const revokedAt = new Date('2026-09-01T12:00:00.000Z');
    db.session.updateMany.mockResolvedValueOnce({ count: 2 });

    await expect(
      repository.revokeAllForUser(7, revokedAt, 'password-change'),
    ).resolves.toBe(2);
    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, revokedAt: null },
      data: { revokedAt, revocationReason: 'password-change' },
    });
  });
});
