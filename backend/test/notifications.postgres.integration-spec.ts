import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth';
import { AuditModule } from '../src/audit/audit.module';
import { InboxNotificationsModule } from '../src/modules/notifications/inbox-notifications.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationResourceType,
  NotificationType,
} from '../generated/prisma/client';

process.env.JWT_SECRET ??= 'test-jwt-secret';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.MAX_LOGIN_ATTEMPTS ??= '3';
process.env.ACCOUNT_LOCKOUT_MINUTES ??= '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ??= '30';
process.env.REFRESH_TOKEN_TTL ??= '3600';

describe('Notifications HTTP PostgreSQL integration', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;
  let marker: string;
  let firstUserId: number;
  let secondUserId: number;

  beforeAll(async () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.ALLOW_TEST_DATABASE_RESET).toBe('true');
    expect(process.env.DATABASE_URL).toBe(process.env.TEST_DATABASE_URL);
    const module = await Test.createTestingModule({
      imports: [
        PrismaModule,
        AuthModule,
        AuditModule,
        InboxNotificationsModule,
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
  });

  beforeEach(async () => {
    marker = `notifications-http-${process.pid}-${Date.now()}`;
    const role = await prisma.role.create({
      data: { name: `${marker}-role`, isActive: true },
    });
    const users = await Promise.all(
      ['first', 'second'].map((suffix) =>
        prisma.user.create({
          data: {
            roleId: role.id,
            fullName: `Synthetic ${suffix}`,
            identification: `${marker}-${suffix}`,
            email: `${marker}-${suffix}@example.test`,
            status: 'ACTIVE',
          },
        }),
      ),
    );
    [firstUserId, secondUserId] = users.map((user) => user.id);
  });

  afterEach(async () => {
    if (!prisma) return;
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [firstUserId, secondUserId].filter(Boolean) } },
    });
    await prisma.notification.deleteMany({
      where: {
        recipientUserId: { in: [firstUserId, secondUserId].filter(Boolean) },
      },
    });
    await prisma.user.deleteMany({ where: { email: { startsWith: marker } } });
    await prisma.role.deleteMany({ where: { name: `${marker}-role` } });
  });

  afterAll(async () => {
    await app?.close();
  });

  const authorization = async (id: number) =>
    `Bearer ${await jwt.signAsync({ sub: id, email: `${marker}-first@example.test`, role: `${marker}-role` })}`;
  const createNotification = (
    recipientUserId: number,
    suffix: string,
    overrides: Partial<{ readAt: Date | null; expiresAt: Date }> = {},
  ) =>
    prisma.notification.create({
      data: {
        recipientUserId,
        type: NotificationType.RESERVATION_SUBMITTED,
        category: NotificationCategory.OPERATIONAL,
        priority: NotificationPriority.NORMAL,
        title: 'Synthetic notification',
        body: 'Synthetic body',
        resourceType: NotificationResourceType.RESERVATION,
        resourceId: suffix,
        deduplicationKey: `v1:${recipientUserId}:test:${suffix}`,
        expiresAt: overrides.expiresAt ?? new Date(Date.now() + 86_400_000),
        readAt: overrides.readAt,
      },
    });

  it('requires JWT and scopes list/count/read operations to session recipient', async () => {
    const own = await createNotification(firstUserId, 'own');
    const other = await createNotification(secondUserId, 'other');
    await createNotification(firstUserId, 'expired', {
      expiresAt: new Date(Date.now() - 1_000),
    });
    const firstAuth = await authorization(firstUserId);
    await request(app.getHttpServer()).get('/notifications').expect(401);
    await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', firstAuth)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({
          total: 1,
          data: [expect.objectContaining({ id: own.id })],
        }),
      );
    await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Authorization', firstAuth)
      .expect(200)
      .expect(({ body }) => expect(body).toEqual({ unread: 1 }));
    await request(app.getHttpServer())
      .patch(`/notifications/${other.id}/read`)
      .set('Authorization', firstAuth)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/notifications/${own.id}/read`)
      .set('Authorization', firstAuth)
      .expect(200);
    expect(
      (await prisma.notification.findUniqueOrThrow({ where: { id: own.id } }))
        .readAt,
    ).toBeTruthy();
    await request(app.getHttpServer())
      .patch(`/notifications/${own.id}/read`)
      .set('Authorization', firstAuth)
      .expect(200);
  });

  it('marks only own active unread notifications in bulk', async () => {
    await createNotification(firstUserId, 'bulk-a');
    await createNotification(firstUserId, 'bulk-b');
    const other = await createNotification(secondUserId, 'bulk-other');
    await request(app.getHttpServer())
      .patch('/notifications/read-all')
      .set('Authorization', await authorization(firstUserId))
      .expect(200)
      .expect(({ body }) => expect(body).toEqual({ updated: 2 }));
    expect(
      (await prisma.notification.findUniqueOrThrow({ where: { id: other.id } }))
        .readAt,
    ).toBeNull();
  });
});
