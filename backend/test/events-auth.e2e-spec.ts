import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuditService } from '../src/audit/audit.service';
import { EventsModule } from '../src/events/events.module';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.JWT_SECRET = 'events-auth-test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '5';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

describe('Events authorization (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let currentRole = 'Administrador';

  const publishedEvent = {
    id: 1,
    publicId: '8c78b8f1-8c26-4612-a687-61a79a6b130c',
    title: 'Asamblea ordinaria',
    summary: 'Resumen público.',
    description: null,
    startAt: new Date('2030-01-02T10:00:00.000Z'),
    endAt: null,
    location: 'Salón comunal',
    status: 'SCHEDULED',
    publicationStatus: 'PUBLISHED',
    createdAt: new Date('2030-01-01T10:00:00.000Z'),
    updatedAt: new Date('2030-01-01T10:00:00.000Z'),
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  function tokenFor(role: string) {
    return jwtService.sign({
      sub: 1,
      email: 'user@curime.test',
      role,
    });
  }

  beforeEach(async () => {
    currentRole = 'Administrador';
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockImplementation(() =>
      Promise.resolve({
        id: 1,
        fullName: 'Usuario de prueba',
        email: 'user@curime.test',
        passwordHash: 'unused',
        status: 'ACTIVE',
        lockedAt: null,
        failedLoginAttempts: 0,
        role: { name: currentRole },
      }),
    );
    prismaMock.event.findMany.mockResolvedValue([publishedEvent]);
    prismaMock.event.findFirst.mockResolvedValue(publishedEvent);
    prismaMock.event.findUnique.mockResolvedValue(publishedEvent);
    prismaMock.event.update.mockResolvedValue(publishedEvent);
    prismaMock.$transaction.mockImplementation(
      (operation: (client: typeof prismaMock) => unknown) =>
        operation(prismaMock),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(AuditService)
      .useValue({ log: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows anonymous public listing and published detail', async () => {
    await request(app.getHttpServer()).get('/public/events').expect(200);
    await request(app.getHttpServer())
      .get(`/public/events/${publishedEvent.publicId}`)
      .expect(200);
  });

  it('hides unpublished public detail', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get(`/public/events/${publishedEvent.publicId}`)
      .expect(404);
  });

  it('requires authentication for event management', async () => {
    await request(app.getHttpServer()).get('/events').expect(401);
  });

  it('denies event management without pub.events.manage', async () => {
    currentRole = 'Tesorero';

    await request(app.getHttpServer())
      .get('/events')
      .set('Authorization', `Bearer ${tokenFor(currentRole)}`)
      .expect(403);
  });

  it('allows event management with pub.events.manage', async () => {
    await request(app.getHttpServer())
      .get('/events')
      .set('Authorization', `Bearer ${tokenFor(currentRole)}`)
      .expect(200);
  });

  it('allows publication with pub.events.publish', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      ...publishedEvent,
      publicationStatus: 'REVIEW',
    });

    await request(app.getHttpServer())
      .patch('/events/1/publish')
      .set('Authorization', `Bearer ${tokenFor(currentRole)}`)
      .expect(200);
  });
});
