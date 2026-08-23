import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuditModule } from '../src/audit/audit.module';
import { AuditService } from '../src/audit/audit.service';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

describe('AuditController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  const audit = { findAll: jest.fn(), findOne: jest.fn() };
  const prisma = {
    user: {
      findUnique: jest.fn(() =>
        Promise.resolve({
          id: 1,
          fullName: 'Admin',
          email: 'admin@example.com',
          status: 'ACTIVE',
          role: { name: role },
        }),
      ),
    },
  };
  beforeEach(async () => {
    role = 'Administrador';
    jest.clearAllMocks();
    audit.findAll.mockResolvedValue({
      data: [
        { id: 1, action: 'LOGIN_SUCCESS', details: { method: 'password' } },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    audit.findOne.mockResolvedValue({
      id: 1,
      action: 'LOGIN_SUCCESS',
      user: { id: 1, fullName: 'Admin', email: 'admin@example.com' },
    });
    const module = await Test.createTestingModule({ imports: [AuditModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AuditService)
      .useValue(audit)
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
  const auth = async () =>
    `Bearer ${await jwt.signAsync({ sub: 1, email: 'admin@example.com', role })}`;
  it('requires JWT', () =>
    request(app.getHttpServer()).get('/audit-logs').expect(401));
  it('forbids non-administrators', async () => {
    role = 'Tesorero';
    await request(app.getHttpServer())
      .get('/audit-logs')
      .set('Authorization', await auth())
      .expect(403);
  });
  it('passes filters and pagination for administrators', async () => {
    await request(app.getHttpServer())
      .get(
        '/audit-logs?page=2&limit=5&userId=1&action=LOGIN_SUCCESS&module=AUTH&dateFrom=2026-01-01T00:00:00Z',
      )
      .set('Authorization', await auth())
      .expect(200);
    expect(audit.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 5,
        userId: 1,
        action: 'LOGIN_SUCCESS',
        module: 'AUTH',
      }),
    );
  });
  it('returns safe detail', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit-logs/1')
      .set('Authorization', await auth())
      .expect(200);
    expect(JSON.stringify(response.body)).not.toMatch(
      /passwordHash|tokenHash|accessToken/,
    );
  });
  it('returns 404 for missing detail', async () => {
    audit.findOne.mockRejectedValueOnce(
      new NotFoundException('Audit log not found'),
    );
    await request(app.getHttpServer())
      .get('/audit-logs/999')
      .set('Authorization', await auth())
      .expect(404);
  });
});
