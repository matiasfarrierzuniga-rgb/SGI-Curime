import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  let status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changeRole: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    unlock: jest.fn(),
  };
  const prisma = {
    user: {
      findUnique: jest.fn(() =>
        Promise.resolve({
          id: 1,
          fullName: 'Admin',
          email: 'admin@example.com',
          status,
          lockedAt: null,
          role: { name: role },
        }),
      ),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    role = 'Administrador';
    status = 'ACTIVE';
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    service.findOne.mockResolvedValue({ id: 2, email: 'user@example.com' });
    service.update.mockResolvedValue({ id: 2, fullName: 'Nombre Nuevo' });
    service.changeRole.mockResolvedValue({ id: 2, roleId: 2 });
    service.activate.mockResolvedValue({ id: 2, status: 'ACTIVE' });
    service.deactivate.mockImplementation(() => {
      status = 'INACTIVE';
      return Promise.resolve({ id: 1, status });
    });
    service.unlock.mockResolvedValue({
      id: 2,
      lockedAt: null,
      isTemporarilyLocked: false,
    });

    const module = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(UsersService)
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

  const authorization = async () =>
    `Bearer ${await jwt.signAsync({ sub: 1, email: 'admin@example.com', role })}`;

  it('requires authentication and administrator role for listing', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
    role = 'Tesorero';
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('passes valid filters and pagination for an administrator', async () => {
    await request(app.getHttpServer())
      .get(
        '/users?name=Ana&email=ana&identification=123&status=ACTIVE&roleId=2&blocked=false&page=2&limit=5',
      )
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5, blocked: false, roleId: 2 }),
    );
  });

  it('gets detail and validates the id', async () => {
    await request(app.getHttpServer())
      .get('/users/2')
      .set('Authorization', await authorization())
      .expect(200);
    await request(app.getHttpServer())
      .get('/users/not-a-number')
      .set('Authorization', await authorization())
      .expect(400);
  });

  it('accepts an allowed update and rejects invalid or prohibited fields', async () => {
    await request(app.getHttpServer())
      .patch('/users/2')
      .set('Authorization', await authorization())
      .send({ fullName: ' Nombre Nuevo ', email: 'NEW@EXAMPLE.COM' })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(2, {
      fullName: 'Nombre Nuevo',
      email: 'new@example.com',
    });

    await request(app.getHttpServer())
      .patch('/users/2')
      .set('Authorization', await authorization())
      .send({ email: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/users/2')
      .set('Authorization', await authorization())
      .send({ passwordHash: 'forbidden', roleId: 1, status: 'ACTIVE' })
      .expect(400);
  });

  it('changes role and denies the action without permission', async () => {
    await request(app.getHttpServer())
      .patch('/users/2/role')
      .set('Authorization', await authorization())
      .send({ roleId: 2 })
      .expect(200);
    role = 'Tesorero';
    await request(app.getHttpServer())
      .patch('/users/2/role')
      .set('Authorization', await authorization())
      .send({ roleId: 2 })
      .expect(403);
  });

  it('routes account activation', async () => {
    await request(app.getHttpServer())
      .patch('/users/2/activate')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.activate).toHaveBeenCalledWith(2);
  });

  it('allows only an administrator to unlock an account', async () => {
    await request(app.getHttpServer())
      .patch('/users/2/unlock')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.unlock).toHaveBeenCalledWith(2);

    role = 'Tesorero';
    await request(app.getHttpServer())
      .patch('/users/2/unlock')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('invalidates a previously issued JWT after deactivation', async () => {
    const token = await authorization();
    await request(app.getHttpServer())
      .patch('/users/1/deactivate')
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', token)
      .expect(401);
  });
});
