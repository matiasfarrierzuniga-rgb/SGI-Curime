import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { PrismaService } from '../src/prisma/prisma.service';
import { InventoryAlertsModule } from '../src/inventory-alerts/inventory-alerts.module';
import { InventoryAlertsService } from '../src/inventory-alerts/inventory-alerts.service';
import { InventoryReportsModule } from '../src/inventory-reports/inventory-reports.module';
import { InventoryReportsService } from '../src/inventory-reports/inventory-reports.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

describe('InventoryAlerts and InventoryReports (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  const alertsService = { findAll: jest.fn() };
  const reportsService = {
    summary: jest.fn(),
    stock: jest.fn(),
    movements: jest.fn(),
    loans: jest.fn(),
  };
  const prisma = {
    user: {
      findUnique: jest.fn(() =>
        Promise.resolve({
          id: 1,
          fullName: 'Admin',
          email: 'admin@example.com',
          status: 'ACTIVE',
          lockedAt: null,
          role: { name: role },
        }),
      ),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    role = 'Administrador';
    alertsService.findAll.mockResolvedValue({
      summary: {
        lowStock: 0,
        outOfStock: 0,
        overdueLoans: 0,
        inactiveItems: 0,
        damagedItems: 0,
      },
      lowStock: [],
      outOfStock: [],
      overdueLoans: [],
      inactiveItems: [],
      damagedItems: [],
    });
    reportsService.summary.mockResolvedValue({});
    reportsService.stock.mockResolvedValue([]);
    reportsService.movements.mockResolvedValue({});
    reportsService.loans.mockResolvedValue({});

    const module = await Test.createTestingModule({
      imports: [InventoryAlertsModule, InventoryReportsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn(() => Promise.resolve()) })
      .overrideProvider(InventoryAlertsService)
      .useValue(alertsService)
      .overrideProvider(InventoryReportsService)
      .useValue(reportsService)
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

  afterEach(() => app.close());

  const authorization = async () =>
    `Bearer ${await jwt.signAsync({ sub: 1, email: 'admin@example.com', role })}`;

  it('requires a JWT', async () => {
    await request(app.getHttpServer()).get('/inventory/alerts').expect(401);
    await request(app.getHttpServer())
      .get('/inventory/reports/summary')
      .expect(401);
  });

  it('forbids a role without inventory access', async () => {
    role = 'Tesorero';
    await request(app.getHttpServer())
      .get('/inventory/alerts')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('returns the alert dashboard for the inventory manager role', async () => {
    role = 'Gestor de Inventario';
    await request(app.getHttpServer())
      .get('/inventory/alerts')
      .set('Authorization', await authorization())
      .expect(200);
    expect(alertsService.findAll).toHaveBeenCalled();
  });

  it('exposes report endpoints with query handling', async () => {
    await request(app.getHttpServer())
      .get('/inventory/reports/summary')
      .set('Authorization', await authorization())
      .expect(200);
    await request(app.getHttpServer())
      .get('/inventory/reports/stock')
      .set('Authorization', await authorization())
      .expect(200);

    await request(app.getHttpServer())
      .get(
        '/inventory/reports/movements?dateFrom=2026-01-01&dateTo=2026-12-31&page=1&limit=20',
      )
      .set('Authorization', await authorization())
      .expect(200);
    expect(reportsService.movements).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: '2026-01-01', dateTo: '2026-12-31' }),
    );

    await request(app.getHttpServer())
      .get('/inventory/reports/loans')
      .set('Authorization', await authorization())
      .expect(200);
    expect(reportsService.loans).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });
});
