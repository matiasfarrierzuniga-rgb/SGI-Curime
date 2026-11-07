import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AdminReportsController } from '../../../admin-reports/admin-reports.controller';
import { AdminReportsService } from '../../../admin-reports/admin-reports.service';
import { AffiliatesController } from '../../../affiliates/affiliates.controller';
import { AffiliatesService } from '../../../affiliates/affiliates.service';
import { AUTH_REPOSITORY } from '../../application/ports/auth-repository.port';
import type { AuthAccount } from '../../domain/entities/auth-account';
import { CapabilityGuard } from './capability.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UnsupportedOperationGuard } from './unsupported-operation.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';

process.env.JWT_SECRET = 'http-certification-secret';
process.env.ACCOUNT_LOCKOUT_MINUTES = '30';
process.env.MAX_LOGIN_ATTEMPTS = '5';

function account(overrides: Partial<AuthAccount> = {}): AuthAccount {
  return {
    id: 7,
    email: 'certification@example.test',
    fullName: 'Certification User',
    status: 'ACTIVE',
    passwordHash: 'hash',
    lockedAt: null,
    failedLoginAttempts: 0,
    lastLoginAt: null,
    sessionsInvalidBefore: null,
    sessionGeneration: 2,
    roleName: 'ROLE_INSTITUTIONAL_SECRETARY',
    roleId: 3,
    roleIsActive: true,
    permissionCodes: ['padron.affiliate.status'],
    hasPerson: false,
    affiliateStatus: null,
    affiliateRoleId: null,
    subscriptionExpirationDate: null,
    ...overrides,
  };
}

describe('RBAC V2 HTTP guard certification', () => {
  let app: INestApplication;
  let currentAccount: AuthAccount;
  const authRepository = {
    findCredentialsById: jest.fn(),
    clearLockout: jest.fn(),
  };
  const affiliates = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    setStatus: jest.fn(),
    deactivate: jest.fn(),
  };
  const reports = {
    dashboard: jest.fn(),
    affiliatesSummary: jest.fn(),
    attendanceSummary: jest.fn(),
    justificationsSummary: jest.fn(),
    sanctionsSummary: jest.fn(),
  };
  const tokens = new JwtService({ secret: process.env.JWT_SECRET });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AffiliatesController, AdminReportsController],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        CapabilityGuard,
        UnsupportedOperationGuard,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
        { provide: AffiliatesService, useValue: affiliates },
        { provide: AdminReportsService, useValue: reports },
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
    currentAccount = account();
    authRepository.findCredentialsById.mockImplementation(() => currentAccount);
    affiliates.setStatus.mockResolvedValue({ id: 12, status: 'ACTIVE' });
    reports.affiliatesSummary.mockResolvedValue({ total: 0 });
  });

  async function bearer(
    claims: Partial<{
      sub: number;
      role: string;
      sessionGeneration: number;
    }> = {},
    options: Parameters<JwtService['signAsync']>[1] = {},
  ): Promise<string> {
    return tokens.signAsync(
      {
        sub: 7,
        email: 'jwt-claim@example.test',
        role: 'ROLE_INSTITUTIONAL_SECRETARY',
        sessionGeneration: 2,
        ...claims,
      },
      options,
    );
  }

  function statusRequest(token?: string) {
    // Nest exposes the Express server through an untyped generic boundary.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const operation = request(app.getHttpServer<Server>()).patch(
      '/affiliates/12/activate',
    );
    return token
      ? operation.set('Authorization', `Bearer ${token}`)
      : operation;
  }

  it('returns 401 for unauthenticated affiliate status requests', async () => {
    await statusRequest().expect(401);
    expect(affiliates.setStatus).not.toHaveBeenCalled();
  });

  it.each([
    [
      'invalid signature',
      () =>
        new JwtService({ secret: 'other-secret' }).signAsync({
          sub: 7,
          role: 'ROLE_INSTITUTIONAL_SECRETARY',
          sessionGeneration: 2,
        }),
    ],
    ['expired JWT', () => bearer({}, { expiresIn: -1 })],
    ['HS384 JWT', () => bearer({}, { algorithm: 'HS384' })],
    ['invalid subject', () => bearer({ sub: 0 })],
    ['stale session generation', () => bearer({ sessionGeneration: 1 })],
  ])('returns 401 for %s', async (_label, createToken) => {
    await statusRequest(await createToken()).expect(401);
    expect(affiliates.setStatus).not.toHaveBeenCalled();
  });

  it('returns 401 for an inactive account', async () => {
    currentAccount = account({ status: 'INACTIVE' });

    await statusRequest(await bearer()).expect(401);
    expect(affiliates.setStatus).not.toHaveBeenCalled();
  });

  it('returns 403 for an authenticated user without persisted status capability', async () => {
    currentAccount = account({ permissionCodes: [] });

    await statusRequest(await bearer()).expect(403);
    expect(affiliates.setStatus).not.toHaveBeenCalled();
  });

  it('returns 403 for a community account attempting ERP affiliate status access', async () => {
    currentAccount = account({
      roleName: 'ROLE_COMMUNITY_USER',
      permissionCodes: ['padron.affiliate.status'],
    });

    await statusRequest(await bearer()).expect(403);
    expect(affiliates.setStatus).not.toHaveBeenCalled();
  });

  it('does not elevate access from a JWT role claim', async () => {
    currentAccount = account({
      roleName: 'ROLE_COMMUNITY_USER',
      permissionCodes: [],
    });

    await statusRequest(await bearer({ role: 'ROLE_SYSTEM_ADMIN' })).expect(
      403,
    );
    expect(affiliates.setStatus).not.toHaveBeenCalled();
  });

  it('allows only the persisted affiliate-status capability to reach the service', async () => {
    await statusRequest(await bearer()).expect(200);
    expect(affiliates.setStatus).toHaveBeenCalledWith(
      12,
      'ACTIVE',
      7,
      expect.any(Object),
    );
  });

  it('returns 403 for unsupported administrative reports without executing service', async () => {
    // Nest exposes the Express server through an untyped generic boundary.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer<Server>())
      .get('/admin-reports/affiliates-summary')
      .set('Authorization', `Bearer ${await bearer()}`)
      .expect(403);
    expect(reports.affiliatesSummary).not.toHaveBeenCalled();
  });
});
