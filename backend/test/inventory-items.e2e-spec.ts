import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { InventoryItemsModule } from '../src/inventory-items/inventory-items.module';
import { InventoryItemsService } from '../src/inventory-items/inventory-items.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

describe('InventoryItemsController (e2e)', () => {
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
      code: 'HER-001',
      name: 'Martillo',
    });
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    service.findOne.mockResolvedValue({ id: 1, code: 'HER-001' });
    service.update.mockResolvedValue({ id: 1, name: 'Martillo grande' });
    service.setActive.mockResolvedValue({ id: 1, status: 'ACTIVE' });

    const module = await Test.createTestingModule({
      imports: [InventoryItemsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(InventoryItemsService)
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
    request(app.getHttpServer()).get('/inventory/items').expect(401));

  it('forbids a role without inventory access', async () => {
    role = 'Vecino/Afiliado';
    await request(app.getHttpServer())
      .get('/inventory/items')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('allows an administrator to create an item', async () => {
    await request(app.getHttpServer())
      .post('/inventory/items')
      .set('Authorization', await authorization())
      .send({
        code: 'HER-001',
        name: 'Martillo',
        categoryId: 1,
        minimumQuantity: 2,
      })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'HER-001', categoryId: 1 }),
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('allows the inventory manager role to list items', async () => {
    role = 'Gestor de Inventario';
    await request(app.getHttpServer())
      .get('/inventory/items?lowStock=true&page=2&limit=5')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ lowStock: true, page: 2, limit: 5 }),
    );
  });

  it('rejects invalid item data', async () => {
    await request(app.getHttpServer())
      .post('/inventory/items')
      .set('Authorization', await authorization())
      .send({ code: '', name: 'X', categoryId: 1, minimumQuantity: -1 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/inventory/items')
      .set('Authorization', await authorization())
      .send({ code: 'C', name: 'X', categoryId: 1, status: 'ACTIVE' })
      .expect(400);
  });

  it('gets an item detail and validates the id', async () => {
    await request(app.getHttpServer())
      .get('/inventory/items/1')
      .set('Authorization', await authorization())
      .expect(200);
    await request(app.getHttpServer())
      .get('/inventory/items/not-a-number')
      .set('Authorization', await authorization())
      .expect(400);
  });

  it('routes item update and activate/deactivate', async () => {
    await request(app.getHttpServer())
      .patch('/inventory/items/1')
      .set('Authorization', await authorization())
      .send({ name: 'Martillo grande' })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(
      1,
      { name: 'Martillo grande' },
      1,
      expect.anything(),
    );

    await request(app.getHttpServer())
      .patch('/inventory/items/1/deactivate')
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
