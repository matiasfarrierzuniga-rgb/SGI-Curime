import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaAuthRepository } from '../src/auth/infrastructure/persistence/prisma-auth.repository';
import { PrismaSessionRepository } from '../src/auth/infrastructure/persistence/prisma-session.repository';
import { SessionService } from '../src/auth/application/services/session.service';
import { ChangePasswordUseCase } from '../src/auth/application/use-cases/change-password.use-case';
import { LogoutAllUseCase } from '../src/auth/application/use-cases/logout-all.use-case';
import { ResetPasswordUseCase } from '../src/auth/application/use-cases/reset-password.use-case';
import { JwtStrategy } from '../src/auth/presentation/strategies/jwt.strategy';
import { BcryptPasswordHasher } from '../src/auth/infrastructure/security/bcrypt-password-hasher';

process.env.JWT_SECRET ??= 'postgres-certification-secret';
process.env.MAX_LOGIN_ATTEMPTS ??= '3';
process.env.ACCOUNT_LOCKOUT_MINUTES ??= '15';

let db!: PrismaService;
let authRepository!: PrismaAuthRepository;
let sessions!: SessionService;
let hasher!: BcryptPasswordHasher;
let changePassword!: ChangePasswordUseCase;
let logoutAll!: LogoutAllUseCase;
let resetPassword!: ResetPasswordUseCase;
let jwtStrategy!: JwtStrategy;
const createdUserIds: number[] = [];
let roleId: number | undefined;

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

async function createUser(password: string) {
  const suffix = randomUUID();
  const user = await db.user.create({
    data: {
      email: `sec01-${suffix}@example.test`,
      fullName: 'SEC-01 PostgreSQL Test User',
      passwordHash: await hasher.hash(password),
      roleId: roleId!,
      status: 'ACTIVE',
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createSession(userId: number, name: string, expiresAt = new Date(Date.now() + 3600_000)) {
  return sessions.create({
    userId,
    refreshTokenHash: digest(`${name}-${randomUUID()}`),
    expiresAt,
  });
}

async function main() {
  await db.$connect();
  const role = await db.role.create({
    data: { name: `SEC-01-DB-${randomUUID()}`, description: 'Disposable certification role' },
  });
  roleId = role.id;

  const persistenceUser = await createUser('PersistencePassword1');
  const created = await authRepository.recordLoginSuccessAndCreateSession(
    persistenceUser.id,
    digest('persistence-refresh'),
    new Date(Date.now() + 3600_000),
  );
  const persistedSession = await db.session.findUnique({ where: { id: created.sessionId } });
  assert.equal(created.sessionGeneration, 0);
  assert.equal(persistedSession?.userId, persistenceUser.id);
  assert.equal(persistedSession?.revokedAt, null);

  const individualUser = await createUser('IndividualPassword1');
  const individualA = await createSession(individualUser.id, 'individual-a');
  const individualB = await createSession(individualUser.id, 'individual-b');
  assert.equal(await sessions.revoke(individualA.id, 'logout'), true);
  const individualRows = await db.session.findMany({ where: { userId: individualUser.id } });
  assert.equal(individualRows.find((row) => row.id === individualA.id)?.revocationReason, 'logout');
  assert.equal(individualRows.find((row) => row.id === individualB.id)?.revokedAt, null);

  const globalUser = await createUser('GlobalPassword1');
  await createSession(globalUser.id, 'global-a');
  await createSession(globalUser.id, 'global-b');
  await logoutAll.execute(globalUser.id);
  const globalState = await db.user.findUnique({ where: { id: globalUser.id }, include: { sessions: true } });
  assert.equal(globalState?.sessionGeneration, 1);
  assert.equal(globalState?.sessions.length, 2);
  assert(globalState?.sessions.every((session) => session.revocationReason === 'logout-all'));

  const changeUser = await createUser('ChangePassword1');
  await createSession(changeUser.id, 'change-a');
  await createSession(changeUser.id, 'change-b');
  await changePassword.execute(changeUser.id, 'ChangePassword1', 'ChangedPassword2', 'ChangedPassword2');
  const changedState = await db.user.findUnique({ where: { id: changeUser.id }, include: { sessions: true } });
  assert.equal(changedState?.sessionGeneration, 1);
  assert(changedState?.passwordHash && await hasher.compare('ChangedPassword2', changedState.passwordHash));
  assert(changedState?.sessions.every((session) => session.revocationReason === 'password-change'));

  const resetUser = await createUser('ResetPassword1');
  await createSession(resetUser.id, 'reset-a');
  const rawResetToken = `reset-${randomUUID()}`;
  await db.passwordResetToken.create({
    data: {
      userId: resetUser.id,
      tokenHash: digest(rawResetToken),
      expiresAt: new Date(Date.now() + 3600_000),
    },
  });
  await resetPassword.execute(rawResetToken, 'ResetPassword2', 'ResetPassword2');
  const resetState = await db.user.findUnique({ where: { id: resetUser.id }, include: { sessions: true, passwordResetTokens: true } });
  assert.equal(resetState?.sessionGeneration, 1);
  assert(resetState?.passwordHash && await hasher.compare('ResetPassword2', resetState.passwordHash));
  assert.equal(resetState?.passwordResetTokens[0]?.usedAt === null, false);
  assert(resetState?.sessions.every((session) => session.revocationReason === 'password-reset'));

  const rollbackUser = await createUser('RollbackPassword1');
  const rollbackSession = await createSession(rollbackUser.id, 'rollback');
  const rollbackBefore = await db.user.findUnique({ where: { id: rollbackUser.id } });
  await assert.rejects(
    authRepository.withTransaction(async (tx) => {
      await tx.setUserPassword(rollbackUser.id, await hasher.hash('ShouldNotCommit1'));
      throw new Error('forced-certification-rollback');
    }),
    /forced-certification-rollback/,
  );
  const rollbackAfter = await db.user.findUnique({ where: { id: rollbackUser.id } });
  const rollbackSessionAfter = await db.session.findUnique({ where: { id: rollbackSession.id } });
  assert.equal(rollbackAfter?.passwordHash, rollbackBefore?.passwordHash);
  assert.equal(rollbackAfter?.sessionGeneration, rollbackBefore?.sessionGeneration);
  assert.equal(rollbackSessionAfter?.revokedAt, null);

  const raceUser = await createUser('RacePassword1');
  const raceSession = await createSession(raceUser.id, 'race');
  const raceCurrent = raceSession.refreshTokenHash;
  const raceNext = digest('race-next');
  await Promise.all([
    sessions.rotate(raceSession.id, raceCurrent, raceNext),
    sessions.revoke(raceSession.id, 'logout'),
  ]);
  const raceAfter = await db.session.findUnique({ where: { id: raceSession.id } });
  assert.notEqual(raceAfter?.revokedAt, null);
  assert([raceCurrent, raceNext].includes(raceAfter?.refreshTokenHash ?? ''));

  const jwtUser = await createUser('JwtPassword1');
  const jwtSession = await createSession(jwtUser.id, 'jwt');
  const jwtAccount = await db.user.findUnique({ where: { id: jwtUser.id } });
  const payload = { sub: jwtUser.id, sid: jwtSession.id, sessionGeneration: jwtAccount?.sessionGeneration ?? 0 };
  await jwtStrategy.validate(payload);
  await sessions.revoke(jwtSession.id, 'logout');
  await assert.rejects(() => jwtStrategy.validate(payload));

  const expiredSession = await createSession(jwtUser.id, 'expired', new Date(Date.now() - 1000));
  await assert.rejects(() => jwtStrategy.validate({ ...payload, sid: expiredSession.id }));

  console.log('auth-postgres-certification: real Prisma persistence, revocation, password transactions, rollback, race and JWT sid checks passed');
}

async function runCertification() {
  const { processEnvironmentForTest } = await import(
    './helpers/disposable-postgres-guard.mjs'
  );
  const safeEnvironment = processEnvironmentForTest(process.env);
  process.env.DATABASE_URL = safeEnvironment.DATABASE_URL;
  process.env.DIRECT_URL = safeEnvironment.DIRECT_URL;

  db = new PrismaService();
  authRepository = new PrismaAuthRepository(db);
  sessions = new SessionService(new PrismaSessionRepository(db));
  hasher = new BcryptPasswordHasher();
  changePassword = new ChangePasswordUseCase(authRepository, hasher);
  logoutAll = new LogoutAllUseCase(authRepository);
  resetPassword = new ResetPasswordUseCase(authRepository, hasher);
  jwtStrategy = new JwtStrategy(authRepository, sessions);

  try {
    await main();
  } finally {
    if (createdUserIds.length > 0) {
      await db.passwordResetToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await db.session.deleteMany({ where: { userId: { in: createdUserIds } } });
      await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    if (roleId !== undefined) await db.role.delete({ where: { id: roleId } });
    await db.$disconnect();
  }
}

runCertification().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
