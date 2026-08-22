import {
  ConflictException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRequestsModule } from '../src/user-requests/user-requests.module';
import { UserRequestsService } from '../src/user-requests/user-requests.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';
process.env.PUBLIC_REQUEST_RATE_LIMIT_TTL_SECONDS = '60';
process.env.PUBLIC_REQUEST_RATE_LIMIT_MAX = '3';

describe('UserRequestsController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    reject: jest.fn(),
    approve: jest.fn(),
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
    service.create.mockResolvedValue({ id: 10, status: 'PENDING' });
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    service.findOne.mockResolvedValue({ id: 10, status: 'PENDING' });
    service.reject.mockResolvedValue({ id: 10, status: 'REJECTED' });

    const module = await Test.createTestingModule({
      imports: [UserRequestsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(UserRequestsService)
      .useValue(service)
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

  const authorization = async () => {
    const token = await jwt.signAsync({
      sub: 1,
      email: 'admin@example.com',
      role,
    });
    return `Bearer ${token}`;
  };

  it('creates a valid public request and normalizes its values', async () => {
    await request(app.getHttpServer())
      .post('/user-requests')
      .send({
        fullName: '  Persona Solicitante  ',
        identificationType: 'NATIONAL',
        identification: '123456789',
        email: ' PERSONA@EXAMPLE.COM ',
        reason: '  Necesito acceso  ',
      })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Persona Solicitante',
        email: 'persona@example.com',
      }),
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('accepts a valid DIMEX request', async () => {
    await request(app.getHttpServer()).post('/user-requests').send({
      fullName: 'Persona DIMEX', identificationType: 'DIMEX',
      identification: '123456789012', email: 'dimex@example.com', reason: 'Necesito acceso',
    }).expect(201);
  });

  it.each([
    { identificationType: 'NATIONAL', identification: '12345678', email: 'ok@example.com' },
    { identificationType: 'NATIONAL', identification: '123456789', email: 'invalid' },
    { identificationType: 'NATIONAL', identification: '123456789', email: 'ok@example.com', phoneCountryCode: '+506', phoneNationalNumber: '123' },
  ])('rejects invalid critical fields', async (fields) => {
    await request(app.getHttpServer()).post('/user-requests').send({ fullName: 'Persona Válida', reason: 'Necesito acceso', ...fields }).expect(400);
  });

  it('returns 409 for a duplicate', async () => {
    service.create.mockRejectedValueOnce(new ConflictException('No se puede procesar la solicitud'));
    await request(app.getHttpServer()).post('/user-requests').send({ fullName: 'Persona Válida', identificationType: 'NATIONAL', identification: '123456789', email: 'duplicate@example.com', reason: 'Necesito acceso' }).expect(409);
  });

  it('returns 429 after the configured public request limit', async () => {
    const body = { fullName: 'Persona Válida', identificationType: 'NATIONAL', identification: '123456789', email: 'rate@example.com', reason: 'Necesito acceso' };
    await request(app.getHttpServer()).post('/user-requests').send(body).expect(201);
    await request(app.getHttpServer()).post('/user-requests').send(body).expect(201);
    await request(app.getHttpServer()).post('/user-requests').send(body).expect(201);
    await request(app.getHttpServer()).post('/user-requests').send(body).expect(429);
  });

  it('does not throttle authenticated listing with the public policy', async () => {
    const token = await authorization();
    await request(app.getHttpServer()).get('/user-requests').set('Authorization', token).expect(200);
    await request(app.getHttpServer()).get('/user-requests').set('Authorization', token).expect(200);
    await request(app.getHttpServer()).get('/user-requests').set('Authorization', token).expect(200);
  });

  it.each([
    [
      {
        fullName: 'Persona',
        identificationType: 'NATIONAL',
        identification: '1',
        email: 'invalid',
        reason: 'Razón',
      },
    ],
    [
      {
        fullName: ' ',
        identificationType: 'NATIONAL',
        identification: '1',
        email: 'a@b.com',
        reason: 'Razón',
      },
    ],
    [
      {
        fullName: 'Persona',
        identificationType: 'NATIONAL',
        identification: '1',
        email: 'a@b.com',
        reason: ' ',
      },
    ],
  ])('rejects invalid public request data', async (body) => {
    await request(app.getHttpServer())
      .post('/user-requests')
      .send(body)
      .expect(400);
  });

  it('requires JWT to list requests', async () => {
    await request(app.getHttpServer()).get('/user-requests').expect(401);
  });

  it('rejects a non-administrator role', async () => {
    role = 'Tesorero';
    await request(app.getHttpServer())
      .get('/user-requests')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('allows an administrator to list requests', async () => {
    await request(app.getHttpServer())
      .get('/user-requests?status=PENDING&page=1&limit=10')
      .set('Authorization', await authorization())
      .expect(200);
  });

  it('returns 404 for an unknown request', async () => {
    service.findOne.mockRejectedValue(
      new NotFoundException('User request not found'),
    );
    await request(app.getHttpServer())
      .get('/user-requests/999')
      .set('Authorization', await authorization())
      .expect(404);
  });

  it('rejects an empty rejection reason', async () => {
    await request(app.getHttpServer())
      .patch('/user-requests/10/reject')
      .set('Authorization', await authorization())
      .send({ rejectionReason: ' ' })
      .expect(400);
  });

  it('passes the authenticated administrator id when rejecting', async () => {
    await request(app.getHttpServer())
      .patch('/user-requests/10/reject')
      .set('Authorization', await authorization())
      .send({ rejectionReason: 'No cumple requisitos' })
      .expect(200);
    expect(service.reject).toHaveBeenCalledWith(
      10,
      'No cumple requisitos',
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });
});
