import {
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
        identification: ' 1-2345 ',
        email: ' PERSONA@EXAMPLE.COM ',
        reason: '  Necesito acceso  ',
      })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Persona Solicitante',
        email: 'persona@example.com',
      }),
    );
  });

  it.each([
    [
      {
        fullName: 'Persona',
        identification: '1',
        email: 'invalid',
        reason: 'Razón',
      },
    ],
    [{ fullName: ' ', identification: '1', email: 'a@b.com', reason: 'Razón' }],
    [
      {
        fullName: 'Persona',
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
    expect(service.reject).toHaveBeenCalledWith(10, 'No cumple requisitos', 1);
  });
});
