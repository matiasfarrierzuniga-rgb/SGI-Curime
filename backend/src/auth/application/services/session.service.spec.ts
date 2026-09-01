import type { SessionRepository } from '../ports/session-repository.port';
import { SessionService } from './session.service';

const now = new Date('2026-09-01T12:00:00.000Z');
const session = {
  id: 1,
  userId: 7,
  refreshTokenHash: 'hash',
  createdAt: new Date('2026-09-01T11:00:00.000Z'),
  expiresAt: new Date('2026-09-01T13:00:00.000Z'),
  revokedAt: null,
  revocationReason: null,
};

function createRepository(): jest.Mocked<SessionRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findActiveById: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
}

describe('SessionService', () => {
  let repository: jest.Mocked<SessionRepository>;
  let service: SessionService;

  beforeEach(() => {
    repository = createRepository();
    service = new SessionService(repository);
  });

  it('persists a session using externally calculated expiration and token hash', async () => {
    repository.create.mockResolvedValueOnce(session);
    const input = {
      userId: 7,
      refreshTokenHash: 'hash',
      expiresAt: session.expiresAt,
    };

    await expect(service.create(input)).resolves.toEqual(session);
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it('reads a session by id', async () => {
    repository.findById.mockResolvedValueOnce(session);

    await expect(service.findById(1)).resolves.toEqual(session);
  });

  it('delegates active session lookup with a reference time', async () => {
    repository.findActiveById.mockResolvedValueOnce(session);

    await expect(service.findActiveById(1, now)).resolves.toEqual(session);
    expect(repository.findActiveById).toHaveBeenCalledWith(1, now);
  });

  it('recognizes an active, unexpired and unrevoked session', () => {
    expect(service.isExpired(session, now)).toBe(false);
    expect(service.isRevoked(session)).toBe(false);
    expect(service.isActive(session, now)).toBe(true);
  });

  it('recognizes an expired session', () => {
    const expired = {
      ...session,
      expiresAt: new Date('2026-09-01T11:00:00.000Z'),
    };

    expect(service.isExpired(expired, now)).toBe(true);
    expect(service.isActive(expired, now)).toBe(false);
  });

  it('recognizes a revoked session', () => {
    const revoked = {
      ...session,
      revokedAt: new Date('2026-09-01T11:30:00.000Z'),
      revocationReason: 'logout',
    };

    expect(service.isRevoked(revoked)).toBe(true);
    expect(service.isActive(revoked, now)).toBe(false);
  });

  it('delegates idempotent revocation', async () => {
    repository.revoke.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(service.revoke(1, 'logout', now)).resolves.toBe(true);
    await expect(service.revoke(1, 'logout', now)).resolves.toBe(false);
    expect(repository.revoke).toHaveBeenCalledWith(1, now, 'logout');
  });

  it('prepares user-wide revocation without attaching it to an auth flow', async () => {
    repository.revokeAllForUser.mockResolvedValueOnce(2);

    await expect(
      service.revokeAllForUser(7, 'password-change', now),
    ).resolves.toBe(2);
    expect(repository.revokeAllForUser).toHaveBeenCalledWith(
      7,
      now,
      'password-change',
    );
  });
});
