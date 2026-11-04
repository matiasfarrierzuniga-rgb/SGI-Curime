import 'reflect-metadata';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { DockerInspection } from './docker-inspection.type';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { ActivationTokenService } from '../../src/user-requests/activation-token.service';
import { CommunityAccountsService } from '../../src/user-requests/community-accounts.service';
import { BcryptPasswordHasher } from '../../src/auth/infrastructure/security/bcrypt-password-hasher';
import { PrismaAuthRepository } from '../../src/auth/infrastructure/persistence/prisma-auth.repository';
import { ActivateAccountUseCase } from '../../src/auth/application/use-cases/activate-account.use-case';
import { ResetPasswordUseCase } from '../../src/auth/application/use-cases/reset-password.use-case';
import { PrismaUsersRepository } from '../../src/modules/users/infrastructure/prisma-users.repository';
import { DeactivateUserUseCase } from '../../src/modules/users/application/use-cases/deactivate-user.use-case';
import { ActivateUserUseCase } from '../../src/modules/users/application/use-cases/activate-user.use-case';
import { JwtStrategy } from '../../src/auth/presentation/strategies/jwt.strategy';
import {
  processEnvironmentForTest,
  validateDisposableEnvironment,
} from './disposable-postgres-guard.mjs';

const target = validateDisposableEnvironment(process.env);
if (
  process.env.DATABASE_URL !== target.value ||
  process.env.DIRECT_URL !== target.value
)
  throw new Error('test connection targets are not aligned');
const project = process.env.SGI_TEST_PROJECT ?? '';
const runToken = process.env.SGI_TEST_RUN_TOKEN ?? '';
const container = process.env.SGI_TEST_CONTAINER ?? '';
if (
  !/^sgi_curime_pg_[0-9a-f]{16}$/.test(project) ||
  !/^[0-9a-f]{36}$/.test(runToken) ||
  !/^[0-9a-f]{12,64}$/.test(container)
)
  throw new Error('unverified disposable test ownership');
const inspect = spawnSync('docker', ['inspect', container], {
  encoding: 'utf8',
  timeout: 15000,
});
if (inspect.status !== 0)
  throw new Error('unable to verify disposable test container');
const info = (JSON.parse(inspect.stdout) as DockerInspection[])[0];
const labels = info.Config?.Labels ?? {};
const bindings = info.NetworkSettings?.Ports?.['5432/tcp'];
if (
  labels['com.docker.compose.project'] !== project ||
  labels['com.sgi-curime.disposable'] !== 'true' ||
  labels['com.sgi-curime.run-token'] !== runToken ||
  !Array.isArray(info.Mounts) ||
  info.Mounts.length !== 0 ||
  !info.HostConfig?.Tmpfs?.['/var/lib/postgresql/data'] ||
  bindings?.length !== 1 ||
  bindings[0].HostIp !== '127.0.0.1' ||
  bindings[0].HostPort !== target.port
)
  throw new Error('disposable test container mismatch');
Object.assign(process.env, processEnvironmentForTest(process.env));
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: target.value }),
});
const prismaService = prisma as unknown as PrismaService;
const deliveries: Array<{ userId: number; token: string; email: string }> = [];
let deliveryAvailable = true;
const delivery = {
  deliver: (value: { userId: number; token: string; email: string }) => {
    deliveries.push(value);
    return Promise.resolve(deliveryAvailable);
  },
};
const service = new CommunityAccountsService(
  prismaService,
  new ActivationTokenService(),
  delivery as never,
  new BcryptPasswordHasher(),
  new AuditService(prismaService),
);
const suffix = randomBytes(5).toString('hex');
let sequence = 0;
const identificationBase = randomInt(100000000, 899999900);
function payload() {
  sequence += 1;
  return {
    firstName: 'Prueba',
    firstSurname: 'Sintetica',
    email: `test-${suffix}-${sequence}@example.test`,
    identificationType: 'NATIONAL' as const,
    identification: String(identificationBase + sequence),
    privacyAcknowledgement: true,
  };
}
async function main() {
  try {
    const [identity] = await prisma.$queryRaw<
      Array<{ db: string; usr: string }>
    >`SELECT current_database() AS db, current_user AS usr`;
    assert.equal(identity.db, 'sgi_curime_integration_test');
    assert.equal(identity.usr, 'sgi_curime_test');
    const indexSql = await readFile(
      'prisma/migrations/20261103130000_unique_normalized_user_email/migration.sql',
      'utf8',
    );
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'CREATE TEMP TABLE "User" ("email" TEXT NOT NULL) ON COMMIT DROP',
      );
      await tx.$executeRawUnsafe(
        "INSERT INTO pg_temp.\"User\" VALUES (' synthetic@example.test '), ('SYNTHETIC@example.test')",
      );
      await tx.$executeRawUnsafe('SAVEPOINT duplicate_check');
      await assert.rejects(tx.$executeRawUnsafe(indexSql));
      await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT duplicate_check');
      await tx.$executeRawUnsafe('DELETE FROM pg_temp."User"');
      await tx.$executeRawUnsafe(
        "INSERT INTO pg_temp.\"User\" VALUES ('one@example.test'), ('two@example.test')",
      );
      await tx.$executeRawUnsafe(indexSql);
    });
    const role = await prisma.role.upsert({
      where: { name: 'ROLE_COMMUNITY_USER' },
      create: { name: 'ROLE_COMMUNITY_USER' },
      update: {},
    });
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrador' },
      create: { name: 'Administrador' },
      update: {},
    });
    const admin = await prisma.user.create({
      data: {
        fullName: 'Admin sintetico',
        email: `admin-${suffix}@example.test`,
        roleId: adminRole.id,
        status: 'ACTIVE',
      },
    });
    const first = payload();
    await service.register(first);
    const account = await prisma.user.findUniqueOrThrow({
      where: { email: first.email },
      include: { activationTokens: true },
    });
    const firstToken = deliveries.at(-1)!.token;
    assert.equal(account.status, 'PENDING_EMAIL_VERIFICATION');
    assert.equal(account.passwordHash, null);
    assert.equal(account.personId, null);
    assert.equal(account.roleId, role.id);
    assert.notEqual(account.activationTokens[0].tokenHash, firstToken);
    await service.validateToken(firstToken);
    await service.register(first);
    assert.equal(await prisma.user.count({ where: { email: first.email } }), 1);
    await assert.rejects(service.validateToken('invalid'));
    await service.verify(firstToken, {}, 'Password123!', 'Password123!');
    const active = await prisma.user.findUniqueOrThrow({
      where: { id: account.id },
    });
    assert.equal(active.status, 'ACTIVE');
    assert.notEqual(active.passwordHash, 'Password123!');
    await assert.rejects(
      service.verify(firstToken, {}, 'Password123!', 'Password123!'),
    );
    await assert.rejects(
      service.correctEmail(
        account.id,
        {
          email: `active-${suffix}@example.test`,
          identityVerified: true,
          verificationMethod: 'IN_PERSON',
        },
        admin.id,
      ),
    );
    await prisma.user.update({
      where: { id: account.id },
      data: { status: 'INACTIVE' },
    });
    await assert.rejects(
      service.correctEmail(
        account.id,
        {
          email: `inactive-${suffix}@example.test`,
          identityVerified: true,
          verificationMethod: 'IN_PERSON',
        },
        admin.id,
      ),
    );

    const second = payload();
    await service.register(second);
    const pending = await prisma.user.findUniqueOrThrow({
      where: { email: second.email },
    });
    const oldToken = deliveries.at(-1)!.token;
    const staleReset = randomBytes(32).toString('base64url');
    const staleResetHash = createHash('sha256')
      .update(staleReset)
      .digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: pending.id,
        tokenHash: staleResetHash,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    await assert.rejects(
      service.correctEmail(
        pending.id,
        {
          email: first.email.toUpperCase(),
          identityVerified: true,
          verificationMethod: 'IN_PERSON',
        },
        admin.id,
      ),
    );
    const corrected = `corrected-${suffix}@example.test`;
    const correctionRace = await Promise.allSettled([
      service.correctEmail(
        pending.id,
        {
          email: corrected,
          identityVerified: true,
          verificationMethod: 'IN_PERSON',
        },
        admin.id,
      ),
      new ResetPasswordUseCase(
        new PrismaAuthRepository(prismaService),
        new BcryptPasswordHasher(),
      ).execute(staleReset, 'Different123!', 'Different123!'),
    ]);
    assert.equal(correctionRace[0].status, 'fulfilled');
    assert.equal(correctionRace[1].status, 'rejected');
    const replacement = deliveries.at(-1)!.token;
    assert.equal(
      (await prisma.user.findUniqueOrThrow({ where: { id: pending.id } }))
        .status,
      'PENDING_EMAIL_VERIFICATION',
    );
    await assert.rejects(service.validateToken(oldToken));
    await service.validateToken(replacement);
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: 'COMMUNITY_EMAIL_CORRECTED',
        entityId: String(pending.id),
      },
    });
    assert.equal(audit.userId, admin.id);
    assert(!JSON.stringify(audit.details).includes(corrected));
    await service.verify(replacement, {}, 'Password123!', 'Password123!');
    assert.notEqual(
      (
        await prisma.passwordResetToken.findUniqueOrThrow({
          where: { tokenHash: staleResetHash },
        })
      ).usedAt,
      null,
    );
    await assert.rejects(
      new ResetPasswordUseCase(
        new PrismaAuthRepository(prismaService),
        new BcryptPasswordHasher(),
      ).execute(staleReset, 'Different123!', 'Different123!'),
    );
    const session = await prisma.session.create({
      data: {
        userId: pending.id,
        refreshTokenHash: `synthetic-${suffix}`,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const oldResetOnDeactivate = await prisma.passwordResetToken.create({
      data: {
        userId: pending.id,
        tokenHash: `synthetic-reset-${suffix}`,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const users = new PrismaUsersRepository(prismaService, {} as never);
    const authRepository = new PrismaAuthRepository(prismaService);
    const jwt = new JwtStrategy(authRepository);
    const oldClaims = {
      sub: pending.id,
      email: corrected,
      role: 'ROLE_COMMUNITY_USER',
      iat: Math.floor(Date.now() / 1000),
      sessionGeneration: pending.sessionGeneration,
    };
    await new DeactivateUserUseCase(users).execute(pending.id, admin.id);
    assert.notEqual(
      (await prisma.session.findUniqueOrThrow({ where: { id: session.id } }))
        .revokedAt,
      null,
    );
    assert.notEqual(
      (
        await prisma.passwordResetToken.findUniqueOrThrow({
          where: { id: oldResetOnDeactivate.id },
        })
      ).usedAt,
      null,
    );
    await assert.rejects(jwt.validate(oldClaims));
    await new ActivateUserUseCase(users).execute(pending.id, admin.id);
    await assert.rejects(jwt.validate(oldClaims));
    const reactivated = await prisma.user.findUniqueOrThrow({
      where: { id: pending.id },
    });
    assert.equal(reactivated.sessionGeneration, 1);
    await assert.doesNotReject(
      jwt.validate({
        ...oldClaims,
        sessionGeneration: reactivated.sessionGeneration,
      }),
    );

    const third = payload();
    await service.register(third);
    const thirdUser = await prisma.user.findUniqueOrThrow({
      where: { email: third.email },
    });
    const racingToken = deliveries.at(-1)!.token;
    const outcomes = await Promise.allSettled([
      service.verify(racingToken, {}, 'Password123!', 'Password123!'),
      service.correctEmail(
        thirdUser.id,
        {
          email: `race-${suffix}@example.test`,
          identityVerified: true,
          verificationMethod: 'IN_PERSON',
        },
        admin.id,
      ),
    ]);
    assert.equal(outcomes.filter((x) => x.status === 'fulfilled').length, 1);
    const raceUser = await prisma.user.findUniqueOrThrow({
      where: { id: thirdUser.id },
    });
    if (raceUser.status === 'ACTIVE') assert.equal(raceUser.email, third.email);
    else {
      assert.equal(raceUser.status, 'PENDING_EMAIL_VERIFICATION');
      await assert.rejects(service.validateToken(racingToken));
    }

    const fourth = payload();
    deliveryAvailable = false;
    await service.register(fourth);
    const deliveryUser = await prisma.user.findUniqueOrThrow({
      where: { email: fourth.email },
    });
    assert.equal(deliveryUser.status, 'PENDING_EMAIL_VERIFICATION');
    deliveryAvailable = true;
    await service.resend(fourth.email);
    await service.validateToken(deliveries.at(-1)!.token);
    const deliveredToken = deliveries.at(-1)!.token;
    await prisma.accountActivationToken.updateMany({
      where: { userId: deliveryUser.id, usedAt: null },
      data: { expiresAt: new Date(0) },
    });
    await assert.rejects(service.validateToken(deliveredToken));

    const old = new ActivationTokenService().generate();
    await prisma.accountActivationToken.create({
      data: {
        userId: deliveryUser.id,
        tokenHash: old.tokenHash,
        expiresAt: old.expiresAt,
        purpose: 'LEGACY_ACCOUNT_ACTIVATION',
      },
    });
    await assert.rejects(service.validateToken(old.token));
    assert.equal(
      (
        await prisma.accountActivationToken.findUniqueOrThrow({
          where: { tokenHash: old.tokenHash },
        })
      ).usedAt,
      null,
    );
    const historical = await prisma.user.create({
      data: {
        fullName: 'Historico sintetico',
        email: `legacy-${suffix}@example.test`,
        status: 'INACTIVE',
        roleId: adminRole.id,
      },
    });
    const historicalToken = new ActivationTokenService().generate();
    await prisma.accountActivationToken.create({
      data: {
        userId: historical.id,
        tokenHash: historicalToken.tokenHash,
        expiresAt: historicalToken.expiresAt,
        purpose: 'LEGACY_ACCOUNT_ACTIVATION',
      },
    });
    const legacyActivation = new ActivateAccountUseCase(
      new PrismaAuthRepository(prismaService),
      new BcryptPasswordHasher(),
    );
    await legacyActivation.execute(
      historicalToken.token,
      'Password123!',
      'Password123!',
    );
    assert.equal(
      (await prisma.user.findUniqueOrThrow({ where: { id: historical.id } }))
        .status,
      'ACTIVE',
    );
    const oldCommunity = await prisma.user.create({
      data: {
        fullName: 'Comunidad historica',
        email: `old-community-${suffix}@example.test`,
        status: 'INACTIVE',
        roleId: role.id,
        passwordHash: 'legacy-hash',
      },
    });
    await assert.rejects(
      new ActivateUserUseCase(users).execute(oldCommunity.id, admin.id),
    );
    await service.reverifyHistorical(oldCommunity.id, admin.id);
    const historicalCommunityToken = deliveries.at(-1)!.token;
    await service.verify(
      historicalCommunityToken,
      {},
      'Password123!',
      'Password123!',
    );
    const reverified = await prisma.user.findUniqueOrThrow({
      where: { id: oldCommunity.id },
    });
    assert.equal(reverified.status, 'ACTIVE');
    assert(reverified.communityEmailVerifiedAt);

    const fifth = payload();
    await service.register(fifth);
    const fifthUser = await prisma.user.findUniqueOrThrow({
      where: { email: fifth.email },
    });
    const prior = deliveries.at(-1)!.token;
    await Promise.allSettled([
      service.resend(fifth.email),
      service.correctEmail(
        fifthUser.id,
        {
          email: `resend-race-${suffix}@example.test`,
          identityVerified: true,
          verificationMethod: 'IN_PERSON',
        },
        admin.id,
      ),
    ]);
    const outstanding = await prisma.accountActivationToken.findMany({
      where: {
        userId: fifthUser.id,
        purpose: 'COMMUNITY_EMAIL_VERIFICATION',
        usedAt: null,
      },
    });
    assert.equal(outstanding.length, 1);
    await assert.rejects(service.validateToken(prior));
    console.log(
      'community PostgreSQL integration: registration, activation, expiry, duplicates, correction, audit, delivery retry, legacy tokens and concurrency passed',
    );
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => {
  const name = error instanceof Error ? error.name : 'UnknownError';
  const location =
    error instanceof Error
      ? error.stack
          ?.split('\n')
          .find((line) => line.includes('community-account-integration.ts:'))
      : undefined;
  console.error(
    `community PostgreSQL integration failed: ${name} ${location ?? ''}`,
  );
  process.exitCode = 1;
});
