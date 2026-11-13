import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Server } from 'node:http';
import request from 'supertest';
import { FinancialController } from '../../../financial/financial.controller';
import { FinancialService } from '../../../financial/financial.service';
import {
  ReservationsController,
  ReservableResourcesController,
} from '../../../reservations/reservations.controller';
import { ReservationsService } from '../../../reservations/reservations.service';
import { AUTH_REPOSITORY } from '../../application/ports/auth-repository.port';
import { SessionService } from '../../application/services/session.service';
import type { AuthAccount } from '../../domain/entities/auth-account';
import { CANONICAL_ROLE_GRANTS } from '../../domain/policies/canonical-role-grants';
import { CapabilityGuard } from './capability.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';

process.env.JWT_SECRET = 'reservations-http-certification-secret';
process.env.ACCOUNT_LOCKOUT_MINUTES = '30';
process.env.MAX_LOGIN_ATTEMPTS = '5';

type CanonicalRoleCode = keyof typeof CANONICAL_ROLE_GRANTS;

const ROLES = [
  'ROLE_INSTITUTIONAL_PRESIDENT',
  'ROLE_INSTITUTIONAL_SECRETARY',
  'ROLE_INSTITUTIONAL_TREASURER',
  'ROLE_INSTITUTIONAL_OPERATOR',
  'ROLE_SYSTEM_ADMIN',
  'ROLE_COMMUNITY_USER',
] as const satisfies readonly CanonicalRoleCode[];

const RESERVATION_CAPABILITIES = [
  'res.reservations.read',
  'res.reservations.approve',
  'res.reservations.reject',
  'res.reservations.cancel',
] as const;

const USER_ID = 7;
const SESSION_ID = 11;

function accountFor(role: CanonicalRoleCode): AuthAccount {
  return {
    id: USER_ID,
    email: `${role.toLowerCase()}@example.test`,
    fullName: 'Reservation Certification User',
    status: 'ACTIVE',
    passwordHash: 'hash',
    lockedAt: null,
    failedLoginAttempts: 0,
    lastLoginAt: null,
    sessionsInvalidBefore: null,
    sessionGeneration: 2,
    roleName: role,
    roleId: 1,
    roleIsActive: true,
    permissionCodes: CANONICAL_ROLE_GRANTS[role],
    hasPerson: false,
    affiliateStatus: null,
    affiliateRoleId: null,
    subscriptionExpirationDate: null,
  };
}

describe('Reservations RBAC V2 HTTP certification', () => {
  let app: INestApplication;
  let currentAccount: AuthAccount;
  const authRepository = {
    findCredentialsById: jest.fn(),
    clearLockout: jest.fn(),
  };
  const sessions = {
    findActiveById: jest.fn(),
  };
  const reservations = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    cancel: jest.fn(),
    findActiveResources: jest.fn(),
  };
  const financial = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    recordPayment: jest.fn(),
  };
  const tokens = new JwtService({ secret: process.env.JWT_SECRET });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      // Mirrors the production wiring: the throttler module is registered
      // globally by the public request rate limit module.
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }])],
      controllers: [
        ReservationsController,
        ReservableResourcesController,
        FinancialController,
      ],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        CapabilityGuard,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
        { provide: SessionService, useValue: sessions },
        { provide: ReservationsService, useValue: reservations },
        { provide: FinancialService, useValue: financial },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentAccount = accountFor('ROLE_INSTITUTIONAL_OPERATOR');
    authRepository.findCredentialsById.mockImplementation(() => currentAccount);
    sessions.findActiveById.mockResolvedValue({
      id: SESSION_ID,
      userId: USER_ID,
      refreshTokenHash: 'hash',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      revocationReason: null,
    });
    reservations.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    reservations.findOne.mockResolvedValue({ id: 1 });
    reservations.create.mockResolvedValue({ id: 42 });
    reservations.approve.mockResolvedValue({ id: 1, status: 'APPROVED' });
    reservations.reject.mockResolvedValue({ id: 1, status: 'REJECTED' });
    reservations.cancel.mockResolvedValue({ id: 1, status: 'CANCELLED' });
    reservations.findActiveResources.mockResolvedValue([]);
    financial.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    financial.findOne.mockResolvedValue({ id: 5, status: 'PENDING' });
    financial.recordPayment.mockResolvedValue({ charge: { id: 5 } });
  });

  async function bearer(
    claims: Partial<{
      sub: number;
      role: string;
      sessionGeneration: number;
      sid: number;
    }> = {},
    options: Parameters<JwtService['signAsync']>[1] = {},
  ): Promise<string> {
    return tokens.signAsync(
      {
        sub: USER_ID,
        email: 'jwt-claim@example.test',
        role: currentAccount.roleName,
        sessionGeneration: 2,
        sid: SESSION_ID,
        ...claims,
      },
      options,
    );
  }

  function server() {
    // Nest exposes the Express server through an untyped generic boundary.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer() as Server);
  }

  function reservationRequest(method: 'get' | 'patch', path: string) {
    const agent = server();
    return method === 'get' ? agent.get(path) : agent.patch(path);
  }

  function authorized(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  describe('canonical contract binding', () => {
    it('derives every fixture from the canonical grant contract', () => {
      for (const role of ROLES) {
        expect(accountFor(role).permissionCodes).toEqual(
          CANONICAL_ROLE_GRANTS[role],
        );
      }
    });

    it('assigns reservation capabilities only to the operator and the administrator read grant', () => {
      const holders = ROLES.filter((role) =>
        CANONICAL_ROLE_GRANTS[role].some((capability) =>
          RESERVATION_CAPABILITIES.includes(
            capability as (typeof RESERVATION_CAPABILITIES)[number],
          ),
        ),
      );
      expect(holders).toEqual([
        'ROLE_INSTITUTIONAL_OPERATOR',
        'ROLE_SYSTEM_ADMIN',
      ]);
      expect(
        CANONICAL_ROLE_GRANTS.ROLE_SYSTEM_ADMIN.filter((capability) =>
          RESERVATION_CAPABILITIES.includes(
            capability as (typeof RESERVATION_CAPABILITIES)[number],
          ),
        ),
      ).toEqual(['res.reservations.read']);
      expect(CANONICAL_ROLE_GRANTS.ROLE_COMMUNITY_USER).toEqual([]);
    });
  });

  describe('capability-protected reservation endpoints', () => {
    const capabilityCases = [
      { name: 'list', method: 'get' as const, path: '/reservations', capability: 'res.reservations.read', service: 'findAll' },
      { name: 'detail', method: 'get' as const, path: '/reservations/1', capability: 'res.reservations.read', service: 'findOne' },
      { name: 'approve', method: 'patch' as const, path: '/reservations/1/approve', capability: 'res.reservations.approve', service: 'approve' },
      { name: 'reject', method: 'patch' as const, path: '/reservations/1/reject', capability: 'res.reservations.reject', service: 'reject' },
      { name: 'cancel', method: 'patch' as const, path: '/reservations/1/cancel', capability: 'res.reservations.cancel', service: 'cancel' },
    ];

    it.each(ROLES)(
      'authorizes %s strictly from its persisted capabilities',
      async (role) => {
        currentAccount = accountFor(role);
        const token = await bearer();

        for (const testCase of capabilityCases) {
          const allowed = CANONICAL_ROLE_GRANTS[role].includes(
            testCase.capability as never,
          );
          const operation = reservationRequest(testCase.method, testCase.path);
          if (testCase.name === 'reject') {
            operation.send({ rejectionReason: 'Motivo de certificacion' });
          }
          await operation
            .set(authorized(token))
            .expect(allowed ? 200 : 403);
          const service = reservations[testCase.service as keyof typeof reservations] as jest.Mock;
          expect(service).toHaveBeenCalledTimes(allowed ? 1 : 0);
        }
      },
    );

    it.each(capabilityCases)(
      'returns 401 for an unauthenticated reservation request',
      async (testCase) => {
        await reservationRequest(testCase.method, testCase.path).expect(401);
        for (const service of Object.values(reservations)) {
          expect(service as jest.Mock).not.toHaveBeenCalled();
        }
      },
    );
  });

  describe('authenticated-only reservation endpoints', () => {
    it.each(ROLES)(
      'allows %s to create its own reservation request',
      async (role) => {
        currentAccount = accountFor(role);
        const token = await bearer();

        await server()
          .post('/reservations')
          .set(authorized(token))
          .send({
            resourceId: 1,
            startAt: '2031-01-10T10:00:00.000Z',
            endAt: '2031-01-10T12:00:00.000Z',
            purpose: 'Certificacion de autorizacion',
            activity: 'DANCES',
            applicantCategory: 'MEMBERS',
          })
          .expect(201);
        expect(reservations.create).toHaveBeenCalledTimes(1);
        expect(reservations.create.mock.calls[0][1]).toBe(USER_ID);
      },
    );

    it.each(ROLES)('allows %s to list reservable resources', async (role) => {
      currentAccount = accountFor(role);
      const token = await bearer();

      await server()
        .get('/reservable-resources')
        .set(authorized(token))
        .expect(200);
      expect(reservations.findActiveResources).toHaveBeenCalledTimes(1);
    });

    it('returns 401 for an unauthenticated reservation creation', async () => {
      await server().post('/reservations').send({}).expect(401);
      expect(reservations.create).not.toHaveBeenCalled();
    });

    it('returns 401 for an unauthenticated reservable resource request', async () => {
      await server().get('/reservable-resources').expect(401);
      expect(reservations.findActiveResources).not.toHaveBeenCalled();
    });
  });

  describe('token and session negative cases', () => {
    it.each([
      [
        'invalid signature',
        () =>
          new JwtService({ secret: 'other-secret' }).signAsync({
            sub: USER_ID,
            role: 'ROLE_INSTITUTIONAL_OPERATOR',
            sessionGeneration: 2,
            sid: SESSION_ID,
          }),
      ],
      ['expired JWT', () => bearer({}, { expiresIn: -1 })],
      ['HS384 JWT', () => bearer({}, { algorithm: 'HS384' })],
      ['invalid subject', () => bearer({ sub: 0 })],
      ['stale session generation', () => bearer({ sessionGeneration: 1 })],
    ])('returns 401 for %s on reservation decisions', async (_label, createToken) => {
      currentAccount = accountFor('ROLE_INSTITUTIONAL_OPERATOR');

      await server()
        .patch('/reservations/1/approve')
        .set(authorized(await createToken()))
        .expect(401);
      expect(reservations.approve).not.toHaveBeenCalled();
    });

    it('returns 401 when the persisted account is inactive', async () => {
      currentAccount = {
        ...accountFor('ROLE_INSTITUTIONAL_OPERATOR'),
        status: 'INACTIVE',
      };

      await server()
        .patch('/reservations/1/approve')
        .set(authorized(await bearer()))
        .expect(401);
      expect(reservations.approve).not.toHaveBeenCalled();
    });

    it('does not elevate a community account through a forged role claim', async () => {
      currentAccount = accountFor('ROLE_COMMUNITY_USER');

      await server()
        .get('/reservations')
        .set(authorized(await bearer({ role: 'ROLE_SYSTEM_ADMIN' })))
        .expect(403);
      expect(reservations.findAll).not.toHaveBeenCalled();
    });

    it('does not elevate a community account through a forged decision claim', async () => {
      currentAccount = accountFor('ROLE_COMMUNITY_USER');

      await server()
        .patch('/reservations/1/approve')
        .set(authorized(await bearer({ role: 'ROLE_INSTITUTIONAL_OPERATOR' })))
        .expect(403);
      expect(reservations.approve).not.toHaveBeenCalled();
    });
  });

  describe('financial charges remain under the treasury permissions', () => {
    it('denies financial charge management to the institutional operator', async () => {
      currentAccount = accountFor('ROLE_INSTITUTIONAL_OPERATOR');
      const token = await bearer();

      await server()
        .get('/financial/charges')
        .set(authorized(token))
        .expect(403);
      await server()
        .post('/financial/charges/5/payments')
        .set(authorized(token))
        .send({ amount: 100, method: 'CASH' })
        .expect(403);
      expect(financial.findAll).not.toHaveBeenCalled();
      expect(financial.recordPayment).not.toHaveBeenCalled();
    });

    it('keeps financial charge management available to the institutional treasurer', async () => {
      currentAccount = accountFor('ROLE_INSTITUTIONAL_TREASURER');
      const token = await bearer();

      await server()
        .get('/financial/charges')
        .set(authorized(token))
        .expect(200);
      await server()
        .post('/financial/charges/5/payments')
        .set(authorized(token))
        .send({ amount: 100, method: 'CASH' })
        .expect(201);
      expect(financial.findAll).toHaveBeenCalledTimes(1);
      expect(financial.recordPayment).toHaveBeenCalledTimes(1);
    });
  });
});
