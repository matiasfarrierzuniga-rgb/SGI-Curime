import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { PrismaService } from '../src/prisma/prisma.service';
import { InventoryCategoriesModule } from '../src/inventory-categories/inventory-categories.module';
import { InventoryCategoriesService } from '../src/inventory-categories/inventory-categories.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

describe('InventoryCategoriesController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
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
    service.create.mockResolvedValue({
      id: 1,
      name: 'Herramientas',
      isActive: true,
    });
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    service.findOne.mockResolvedValue({ id: 1, name: 'Herramientas' });
    service.update.mockResolvedValue({ id: 1, name: 'Ferretería' });
    service.setActive.mockResolvedValue({
      id: 1,
      name: 'Herramientas',
      isActive: true,
    });

    const module = await Test.createTestingModule({
      imports: [InventoryCategoriesModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn(() => Promise.resolve()) })
      .overrideProvider(InventoryCategoriesService)
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

  it('requires a JWT', () =>
    request(app.getHttpServer()).get('/inventory/categories').expect(401));

  it('forbids a role without inventory access', async () => {
    role = 'Tesorero';
    await request(app.getHttpServer())
      .get('/inventory/categories')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('allows an administrator to create a category using the authenticated actor', async () => {
    await request(app.getHttpServer())
      .post('/inventory/categories')
      .set('Authorization', await authorization())
      .send({ name: '  Herramientas  ' })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Herramientas' }),
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('allows the inventory manager role', async () => {
    role = 'Gestor de Inventario';
    await request(app.getHttpServer())
      .get('/inventory/categories')
      .set('Authorization', await authorization())
      .expect(200);
  });

  it('rejects invalid create data', async () => {
    await request(app.getHttpServer())
      .post('/inventory/categories')
      .set('Authorization', await authorization())
      .send({ name: ' ' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/inventory/categories')
      .set('Authorization', await authorization())
      .send({ name: 'Herramientas', description: 42 })
      .expect(400);
  });

  it('routes update and activate/deactivate', async () => {
    await request(app.getHttpServer())
      .patch('/inventory/categories/1')
      .set('Authorization', await authorization())
      .send({ name: 'Ferretería' })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(
      1,
      { name: 'Ferretería' },
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );

    await request(app.getHttpServer())
      .patch('/inventory/categories/1/activate')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.setActive).toHaveBeenCalledWith(
      1,
      true,
      1,
      expect.anything(),
    );

    await request(app.getHttpServer())
      .patch('/inventory/categories/1/deactivate')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.setActive).toHaveBeenCalledWith(
      1,
      false,
      1,
      expect.anything(),
    );
  });
});
