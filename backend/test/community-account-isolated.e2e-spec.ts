import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { DockerInspection } from './helpers/docker-inspection.type';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthModule } from '../src/auth';
import { AuditModule } from '../src/audit/audit.module';
import { AuditService } from '../src/audit/audit.service';
import { CommunityAccountsController } from '../src/user-requests/community-accounts.controller';
import { CommunityAccountsService } from '../src/user-requests/community-accounts.service';
import { ActivationTokenService } from '../src/user-requests/activation-token.service';
import { BcryptPasswordHasher } from '../src/auth/infrastructure/security/bcrypt-password-hasher';
import { PublicRequestRateLimitModule } from '../src/common/rate-limit/public-request-rate-limit.module';

// Refuse all direct invocations: lifecycle verifies the project and container first.
const url = process.env.TEST_DATABASE_URL ?? '';
const project = process.env.SGI_TEST_PROJECT ?? '';
const token = process.env.SGI_TEST_RUN_TOKEN ?? '';
const container = process.env.SGI_TEST_CONTAINER ?? '';
const parsed = new URL(url);
if (
  process.env.NODE_ENV !== 'test' ||
  process.env.ALLOW_TEST_DATABASE_RESET !== 'true' ||
  process.env.DATABASE_URL !== url ||
  process.env.DIRECT_URL !== url ||
  parsed.hostname !== '127.0.0.1' ||
  ['5432', '5433', ''].includes(parsed.port) ||
  parsed.pathname !== '/sgi_curime_integration_test' ||
  parsed.username !== 'sgi_curime_test' ||
  parsed.password !== 'sgi_curime_test_password' ||
  parsed.search ||
  !/^sgi_curime_pg_[0-9a-f]{16}$/.test(project) ||
  !/^[0-9a-f]{36}$/.test(token) ||
  !/^[0-9a-f]{12,64}$/.test(container)
)
  throw new Error('unsafe integration destination');
const inspected = spawnSync('docker', ['inspect', container], {
  encoding: 'utf8',
  timeout: 15000,
});
if (inspected.status !== 0)
  throw new Error('disposable container inspection failed');
const info = (JSON.parse(inspected.stdout) as DockerInspection[])[0];
const labels = info.Config?.Labels ?? {};
const binding = info.NetworkSettings?.Ports?.['5432/tcp'];
if (
  labels['com.docker.compose.project'] !== project ||
  labels['com.sgi-curime.disposable'] !== 'true' ||
  labels['com.sgi-curime.run-token'] !== token ||
  !Array.isArray(info.Mounts) ||
  info.Mounts.length !== 0 ||
  !info.HostConfig?.Tmpfs?.['/var/lib/postgresql/data'] ||
  binding?.length !== 1 ||
  binding[0].HostIp !== '127.0.0.1' ||
  binding[0].HostPort !== parsed.port
)
  throw new Error('disposable container mismatch');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
const suffix = randomBytes(4).toString('hex');

describe('community account HTTP authorization with isolated PostgreSQL', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let adminId: number;
  let communityId: number;
  let pendingId: number;
  beforeAll(async () => {
    process.env.JWT_SECRET = 'synthetic-isolated-test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.MAX_LOGIN_ATTEMPTS = '3';
    process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
    const [identity] = await prisma.$queryRaw<
      Array<{ db: string; usr: string }>
    >`SELECT current_database() AS db, current_user AS usr`;
    if (
      identity.db !== 'sgi_curime_integration_test' ||
      identity.usr !== 'sgi_curime_test'
    )
      throw new Error('database identity mismatch');
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: 'Cuenta comunitaria' },
    });
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'Administrador' },
    });
    const permission = await prisma.permission.upsert({
      where: { code: 'usr.users.update' },
      create: { code: 'usr.users.update', name: 'Synthetic update' },
      update: {},
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      create: { roleId: adminRole.id, permissionId: permission.id },
      update: {},
    });
    const admin = await prisma.user.create({
      data: {
        fullName: 'Admin test',
        email: `admin-http-${suffix}@example.test`,
        roleId: adminRole.id,
        status: 'ACTIVE',
      },
    });
    const community = await prisma.user.create({
      data: {
        fullName: 'Community test',
        email: `community-http-${suffix}@example.test`,
        roleId: role.id,
        status: 'ACTIVE',
      },
    });
    const pending = await prisma.user.create({
      data: {
        fullName: 'Pending test',
        email: `pending-http-${suffix}@example.test`,
        roleId: role.id,
        status: 'PENDING_EMAIL_VERIFICATION',
      },
    });
    adminId = admin.id;
    communityId = community.id;
    pendingId = pending.id;
    const service = new CommunityAccountsService(
      prisma as unknown as PrismaService,
      new ActivationTokenService(),
      { deliver: () => Promise.resolve(true) } as never,
      new BcryptPasswordHasher(),
      new AuditService(prisma as unknown as PrismaService),
    );
    const module = await Test.createTestingModule({
      imports: [AuditModule, AuthModule, PublicRequestRateLimitModule],
      controllers: [CommunityAccountsController],
      providers: [{ provide: CommunityAccountsService, useValue: service }],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.listen(0, '127.0.0.1');
    jwt = module.get(JwtService);
  });
  afterAll(async () => {
    if (app) await app.close();
    await prisma.$disconnect();
  });
  it('returns 401 without authentication', async () => {
    await request(app.getHttpServer() as App)
      .post(`/community-accounts/${pendingId}/correct-email`)
      .send({
        email: `new-${suffix}@example.test`,
        identityVerified: true,
        verificationMethod: 'IN_PERSON',
      })
      .expect(401);
  });
  it('rejects login for an account pending verification', async () => {
    const account = await prisma.user.findUniqueOrThrow({
      where: { id: pendingId },
    });
    await request(app.getHttpServer() as App)
      .post('/auth/login')
      .send({ email: account.email, password: 'Password123!' })
      .expect(401);
  });
  it('returns 403 to a community account', async () => {
    const auth = jwt.sign({ sub: communityId });
    await request(app.getHttpServer() as App)
      .post(`/community-accounts/${pendingId}/correct-email`)
      .set('Authorization', `Bearer ${auth}`)
      .send({
        email: `new-${suffix}@example.test`,
        identityVerified: true,
        verificationMethod: 'IN_PERSON',
      })
      .expect(403);
  });
  it('allows an administrator with persisted capability', async () => {
    const auth = jwt.sign({ sub: adminId });
    await request(app.getHttpServer() as App)
      .post(`/community-accounts/${pendingId}/correct-email`)
      .set('Authorization', `Bearer ${auth}`)
      .send({
        email: `new-${suffix}@example.test`,
        identityVerified: true,
        verificationMethod: 'IN_PERSON',
      })
      .expect(201);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: pendingId } }))
        .status,
    ).toBe('PENDING_EMAIL_VERIFICATION');
  });

  it('returns the same public result for new data and duplicates, then limits abuse', async () => {
    const body = {
      firstName: 'Prueba',
      firstSurname: 'Sintetica',
      identificationType: 'NATIONAL',
      identification: '223456789',
      email: `neutral-${suffix}@example.test`,
      privacyAcknowledgement: true,
    };
    const first = await request(app.getHttpServer() as App)
      .post('/community-accounts/register')
      .send(body)
      .expect(202);
    const emailDuplicate = await request(app.getHttpServer() as App)
      .post('/community-accounts/register')
      .send({ ...body, identification: '323456789' })
      .expect(202);
    const idDuplicate = await request(app.getHttpServer() as App)
      .post('/community-accounts/register')
      .send({ ...body, email: `other-${suffix}@example.test` })
      .expect(202);
    expect(emailDuplicate.body).toEqual(first.body);
    expect(idDuplicate.body).toEqual(first.body);
    await request(app.getHttpServer() as App)
      .post('/community-accounts/register')
      .send(body)
      .expect(429);
  });
});
