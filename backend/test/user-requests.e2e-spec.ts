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
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRequestsModule } from '../src/user-requests/user-requests.module';
import { UserRequestsService } from '../src/user-requests/user-requests.service';
import { buildPrismaAuthUser } from './helpers/auth-fixtures';

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
  let permissionCodes: readonly string[] = [];
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    reject: jest.fn(),
    approve: jest.fn(),
  };
  const prisma = {
    user: {
      findUnique: jest.fn(() => {
        const user = buildPrismaAuthUser({ roleName: role });
        return Promise.resolve({
          ...user,
          role: {
            ...user.role,
            permissions: permissionCodes.map((code) => ({
              permission: { code },
            })),
          },
        });
      }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    role = 'Administrador';
    permissionCodes = [
      'usr.user-requests.read',
      'usr.user-requests.review',
    ];
    service.create.mockResolvedValue({ id: 10, status: 'PENDING' });
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    service.findOne.mockResolvedValue({ id: 10, status: 'PENDING' });
    service.reject.mockResolvedValue({ id: 10, status: 'REJECTED' });
    service.approve.mockResolvedValue({ id: 10, status: 'APPROVED' });

    const module = await Test.createTestingModule({
      imports: [UserRequestsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn(() => Promise.resolve()) })
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
    await request(app.getHttpServer())
      .post('/user-requests')
      .send({
        fullName: 'Persona DIMEX',
        identificationType: 'DIMEX',
        identification: '123456789012',
        email: 'dimex@example.com',
        reason: 'Necesito acceso',
      })
      .expect(201);
  });

  it.each([
    {
      identificationType: 'NATIONAL',
      identification: '12345678',
      email: 'ok@example.com',
    },
    {
      identificationType: 'NATIONAL',
      identification: '123456789',
      email: 'invalid',
    },
    {
      identificationType: 'NATIONAL',
      identification: '123456789',
      email: 'ok@example.com',
      phoneCountryCode: '+506',
      phoneNationalNumber: '123',
    },
  ])('rejects invalid critical fields', async (fields) => {
    await request(app.getHttpServer())
      .post('/user-requests')
      .send({
        fullName: 'Persona Válida',
        reason: 'Necesito acceso',
        ...fields,
      })
      .expect(400);
  });

  it('returns 409 for a duplicate', async () => {
    service.create.mockRejectedValueOnce(
      new ConflictException('No se puede procesar la solicitud'),
    );
    await request(app.getHttpServer())
      .post('/user-requests')
      .send({
        fullName: 'Persona Válida',
        identificationType: 'NATIONAL',
        identification: '123456789',
        email: 'duplicate@example.com',
        reason: 'Necesito acceso',
      })
      .expect(409);
  });

  it('returns 429 after the configured public request limit', async () => {
    const body = {
      fullName: 'Persona Válida',
      identificationType: 'NATIONAL',
      identification: '123456789',
      email: 'rate@example.com',
      reason: 'Necesito acceso',
    };
    await request(app.getHttpServer())
      .post('/user-requests')
      .send(body)
      .expect(201);
    await request(app.getHttpServer())
      .post('/user-requests')
      .send(body)
      .expect(201);
    await request(app.getHttpServer())
      .post('/user-requests')
      .send(body)
      .expect(201);
    await request(app.getHttpServer())
      .post('/user-requests')
      .send(body)
      .expect(429);
  });

  it('does not throttle authenticated listing with the public policy', async () => {
    const token = await authorization();
    await request(app.getHttpServer())
      .get('/user-requests')
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .get('/user-requests')
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .get('/user-requests')
      .set('Authorization', token)
      .expect(200);
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

  it.each(['/user-requests', '/user-requests/10'])(
    'requires JWT to read requests at %s',
    async (path) => {
      await request(app.getHttpServer()).get(path).expect(401);
      expect(service.findAll).not.toHaveBeenCalled();
      expect(service.findOne).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['/user-requests', 'findAll'],
    ['/user-requests/10', 'findOne'],
  ] as const)(
    'rejects a role without read capability at %s',
    async (path, serviceMethod) => {
      role = 'Tesorero';
      permissionCodes = [];
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', await authorization())
        .expect(403);
      expect(service[serviceMethod]).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['get', '/user-requests', undefined, 'findAll'],
    ['get', '/user-requests/10', undefined, 'findOne'],
    ['patch', '/user-requests/10/approve', { roleId: 3 }, 'approve'],
    [
      'patch',
      '/user-requests/10/reject',
      { rejectionReason: 'No cumple requisitos' },
      'reject',
    ],
  ] as const)(
    'does not treat adm.requests.read as UserRequest access for %s %s',
    async (method, path, body, serviceMethod) => {
      permissionCodes = ['adm.requests.read'];
      const operation =
        method === 'get'
          ? request(app.getHttpServer()).get(path)
          : request(app.getHttpServer()).patch(path).send(body);
      await operation
        .set('Authorization', await authorization())
        .expect(403);
      expect(service[serviceMethod]).not.toHaveBeenCalled();
    },
  );

  it('allows a non-administrator with read capability and ERP access', async () => {
    role = 'Tesorero';
    permissionCodes = ['usr.user-requests.read'];
    await request(app.getHttpServer())
      .get('/user-requests')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('allows an administrator to list requests', async () => {
    await request(app.getHttpServer())
      .get('/user-requests?status=PENDING&page=1&limit=10')
      .set('Authorization', await authorization())
      .expect(200);
  });

  it('allows a non-administrator with read capability and ERP access to get request detail', async () => {
    role = 'Tesorero';
    permissionCodes = ['usr.user-requests.read'];
    await request(app.getHttpServer())
      .get('/user-requests/10')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.findOne).toHaveBeenCalledWith(10);
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

  it.each([
    ['/user-requests/10/approve', { roleId: 3 }, 'approve'],
    [
      '/user-requests/10/reject',
      { rejectionReason: 'No cumple requisitos' },
      'reject',
    ],
  ] as const)(
    'requires JWT to review requests at %s',
    async (path, body, serviceMethod) => {
      await request(app.getHttpServer()).patch(path).send(body).expect(401);
      expect(service[serviceMethod]).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['/user-requests/10/approve', { roleId: 3 }, 'approve'],
    [
      '/user-requests/10/reject',
      { rejectionReason: 'No cumple requisitos' },
      'reject',
    ],
  ] as const)(
    'rejects review without review capability at %s',
    async (path, body, serviceMethod) => {
      permissionCodes = ['usr.user-requests.read'];
      await request(app.getHttpServer())
        .patch(path)
        .set('Authorization', await authorization())
        .send(body)
        .expect(403);
      expect(service[serviceMethod]).not.toHaveBeenCalled();
    },
  );

  it('allows a non-administrator with review capability and ERP access to approve', async () => {
    role = 'Tesorero';
    permissionCodes = ['usr.user-requests.review'];
    await request(app.getHttpServer())
      .patch('/user-requests/10/approve')
      .set('Authorization', await authorization())
      .send({ roleId: 3 })
      .expect(200);
    expect(service.approve).toHaveBeenCalledWith(
      10,
      { roleId: 3 },
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('allows a non-administrator with review capability and ERP access to reject', async () => {
    role = 'Tesorero';
    permissionCodes = ['usr.user-requests.review'];
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
