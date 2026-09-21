import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  FinancialMovementSource,
  FinancialMovementType,
  Prisma,
} from '../generated/prisma/client';
import { AUTH_REPOSITORY } from '../src/auth/application/ports/auth-repository.port';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import type { AuthAccount } from '../src/auth/domain/entities/auth-account';
import { FinancialModule } from '../src/financial/financial.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('DINADECO annual report (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let account: AuthAccount;

  const authRepository = {
    findCredentialsById: jest.fn(() => Promise.resolve(account)),
    clearLockout: jest.fn(),
  };
  const prisma = {
    financialMovement: { groupBy: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    account = authAccount('Administrador');
    prisma.financialMovement.groupBy
      .mockResolvedValueOnce([
        {
          type: FinancialMovementType.INCOME,
          _sum: { amount: new Prisma.Decimal('1000.00') },
        },
      ])
      .mockResolvedValueOnce([
        {
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.DONATION,
          _sum: { amount: new Prisma.Decimal('250.00') },
          _count: { _all: 1 },
        },
        {
          type: FinancialMovementType.EXPENSE,
          source: FinancialMovementSource.MANUAL,
          _sum: { amount: new Prisma.Decimal('50.00') },
          _count: { _all: 1 },
        },
      ]);
    prisma.financialMovement.findMany.mockResolvedValue([
      {
        id: 101,
        type: FinancialMovementType.INCOME,
        description: 'Ingreso ficticio para prueba E2E',
        amount: new Prisma.Decimal('250.00'),
        occurredAt: new Date('2026-03-15T14:30:00.000Z'),
        source: FinancialMovementSource.DONATION,
      },
      {
        id: 102,
        type: FinancialMovementType.EXPENSE,
        description: 'Egreso ficticio para prueba E2E',
        amount: new Prisma.Decimal('50.00'),
        occurredAt: new Date('2026-04-20T16:45:00.000Z'),
        source: FinancialMovementSource.MANUAL,
      },
    ]);

    const module = await Test.createTestingModule({ imports: [FinancialModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUTH_REPOSITORY)
      .useValue(authRepository)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn() })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    jwt = module.get(JwtService);
    await app.init();
  });

  afterEach(() => app?.close());

  it('returns 401 without authentication', () =>
    request(app.getHttpServer())
      .get('/financial/reports/dinadeco/annual?year=2026')
      .expect(401));

  it.each([
    ['Gestor de Inventario', true],
    ['Vecino/Afiliado', true],
    ['Subscription_L1', false],
  ] as const)('returns 403 for authenticated role %s without capability', async (role, hasAffiliate) => {
    account = authAccount(role, hasAffiliate);

    await request(app.getHttpServer())
      .get('/financial/reports/dinadeco/annual?year=2026')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it.each([
    ['Administrador', false],
    ['Tesorero', true],
  ] as const)('returns the annual report for %s', async (role, hasAffiliate) => {
    account = authAccount(role, hasAffiliate);

    const response = await request(app.getHttpServer())
      .get('/financial/reports/dinadeco/annual?year=2026')
      .set('Authorization', await authorization())
      .expect(200);

    expect(response.body).toEqual({
      metadata: expect.objectContaining({
        generatedAt: expect.any(String),
        generatedBy: { id: 1, fullName: `Usuario ${role}` },
        period: {
          from: '2026-01-01T00:00:00.000Z',
          to: '2027-01-01T00:00:00.000Z',
        },
        appliedFilters: { year: 2026 },
        dataSource: 'FINANCIAL_MOVEMENT',
        reportVersion: '1.0',
      }),
      data: {
        year: 2026,
        currency: 'CRC',
        openingBalance: '1000.00',
        income: {
          total: '250.00',
          count: 1,
          bySource: { DONATION: { total: '250.00', count: 1 } },
        },
        expenses: {
          total: '50.00',
          count: 1,
          bySource: { MANUAL: { total: '50.00', count: 1 } },
        },
        netMovement: '200.00',
        closingBalance: '1200.00',
        movementCount: 2,
        fie: {
          entries: [
            {
              id: 101,
              description: 'Ingreso ficticio para prueba E2E',
              amount: '250.00',
              occurredAt: '2026-03-15T14:30:00.000Z',
              source: 'DONATION',
            },
          ],
          exits: [
            {
              id: 102,
              description: 'Egreso ficticio para prueba E2E',
              amount: '50.00',
              occurredAt: '2026-04-20T16:45:00.000Z',
              source: 'MANUAL',
            },
          ],
          capacity: {
            entryCount: 1,
            exitCount: 1,
            entryCapacity: 15,
            exitCapacity: 15,
            entryOverflow: false,
            exitOverflow: false,
          },
          totalIncomePlusOpeningBalance: '1250.00',
          totalExpensesPlusClosingBalance: '1250.00',
        },
      },
    });
  });

  it.each(['abc', '26', '2026.5'])('returns 400 for invalid year %s', async (year) => {
    await request(app.getHttpServer())
      .get(`/financial/reports/dinadeco/annual?year=${year}`)
      .set('Authorization', await authorization())
      .expect(400);
  });

  function authorization() {
    return jwt.signAsync({ sub: account.id, email: account.email, role: account.roleName })
      .then((token) => `Bearer ${token}`);
  }
});

function authAccount(roleName: string, hasAffiliate = false): AuthAccount {
  const roleId = roleName === 'Administrador' ? 1 : roleName === 'Tesorero' ? 2 : roleName === 'Gestor de Inventario' ? 3 : 4;
  return {
    id: 1,
    email: 'user@curime.test',
    fullName: `Usuario ${roleName}`,
    status: 'ACTIVE',
    passwordHash: null,
    lockedAt: null,
    failedLoginAttempts: 0,
    lastLoginAt: null,
    roleName,
    roleId,
    roleIsActive: true,
    hasPerson: hasAffiliate,
    affiliateStatus: hasAffiliate ? 'ACTIVE' : null,
    affiliateRoleId: hasAffiliate ? roleId : null,
    subscriptionExpirationDate: null,
  };
}
