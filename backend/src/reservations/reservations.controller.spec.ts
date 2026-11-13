import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Server } from 'node:http';
import request from 'supertest';
import { AUTH_REPOSITORY } from '../auth/application/ports/auth-repository.port';
import { SessionService } from '../auth/application/services/session.service';
import type { AuthAccount } from '../auth/domain/entities/auth-account';
import { CapabilityGuard } from '../auth/presentation/guards/capability.guard';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { JwtStrategy } from '../auth/presentation/strategies/jwt.strategy';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

process.env.JWT_SECRET = 'reservations-request-security-secret';
process.env.ACCOUNT_LOCKOUT_MINUTES = '30';
process.env.MAX_LOGIN_ATTEMPTS = '5';

const USER_ID = 21;
const SESSION_ID = 31;

const validRequest = {
  resourceId: 1,
  startAt: '2031-02-10T10:00:00.000Z',
  endAt: '2031-02-10T12:00:00.000Z',
  purpose: 'Actividad comunitaria',
  activity: 'DANCES',
  applicantCategory: 'PRIVATE',
};

function communityAccount(): AuthAccount {
  return {
    id: USER_ID,
    email: 'solicitante@example.test',
    fullName: 'Solicitante Comunitario',
    status: 'ACTIVE',
    passwordHash: 'hash',
    lockedAt: null,
    failedLoginAttempts: 0,
    lastLoginAt: null,
    sessionsInvalidBefore: null,
    sessionGeneration: 1,
    roleName: 'ROLE_COMMUNITY_USER',
    roleId: 2,
    roleIsActive: true,
    permissionCodes: [],
    hasPerson: false,
    affiliateStatus: null,
    affiliateRoleId: null,
    subscriptionExpirationDate: null,
  };
}

describe('Reservations request security (HTTP)', () => {
  const tokens = new JwtService({ secret: process.env.JWT_SECRET });

  async function createApp(limit: number) {
    const account = communityAccount();
    const authRepository = {
      findCredentialsById: jest.fn().mockImplementation(() => account),
      clearLockout: jest.fn(),
    };
    const sessions = {
      findActiveById: jest.fn().mockResolvedValue({
        id: SESSION_ID,
        userId: USER_ID,
        refreshTokenHash: 'hash',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        revocationReason: null,
      }),
    };
    const reservations = {
      create: jest.fn().mockResolvedValue({ id: 99 }),
      findAll: jest.fn(),
      findOne: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      cancel: jest.fn(),
      findActiveResources: jest.fn(),
    };

    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit }])],
      controllers: [ReservationsController],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        CapabilityGuard,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
        { provide: SessionService, useValue: sessions },
        { provide: ReservationsService, useValue: reservations },
      ],
    }).compile();

    const app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    return { app, reservations };
  }

  async function token(): Promise<string> {
    return tokens.signAsync({
      sub: USER_ID,
      email: 'solicitante@example.test',
      role: 'ROLE_COMMUNITY_USER',
      sessionGeneration: 1,
      sid: SESSION_ID,
    });
  }

  function post(app: INestApplication, bearer: string, body: object) {
    // Nest exposes the Express server through an untyped generic boundary.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer() as Server)
      .post('/reservations')
      .set('Authorization', `Bearer ${bearer}`)
      .send(body);
  }

  it('creates a request for the authenticated requester and ignores client ownership fields', async () => {
    const { app, reservations } = await createApp(100);
    const bearer = await token();

    await post(app, bearer, validRequest).expect(201);

    expect(reservations.create).toHaveBeenCalledTimes(1);
    expect(reservations.create).toHaveBeenCalledWith(
      expect.objectContaining({ applicantCategory: 'PRIVATE' }),
      USER_ID,
    );
    await app.close();
  });

  it.each<[string, Record<string, unknown>]>([
    ['requesterUserId', { ...validRequest, requesterUserId: 999 }],
    ['tariffAmount', { ...validRequest, tariffAmount: 1 }],
    ['price', { ...validRequest, price: 1 }],
    ['status', { ...validRequest, status: 'APPROVED' }],
    ['approvedById', { ...validRequest, approvedById: 999 }],
  ])('rejects the client supplied %s field', async (_field, body) => {
    const { app, reservations } = await createApp(100);
    const bearer = await token();

    await post(app, bearer, body).expect(400);

    expect(reservations.create).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns 401 for an unauthenticated request', async () => {
    const { app, reservations } = await createApp(100);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer() as Server)
      .post('/reservations')
      .send(validRequest)
      .expect(401);

    expect(reservations.create).not.toHaveBeenCalled();
    await app.close();
  });

  it('rate limits repeated reservation requests', async () => {
    const { app, reservations } = await createApp(2);
    const bearer = await token();

    await post(app, bearer, validRequest).expect(201);
    await post(app, bearer, validRequest).expect(201);
    await post(app, bearer, validRequest).expect(429);

    expect(reservations.create).toHaveBeenCalledTimes(2);
    await app.close();
  });
});
