import {
  ConflictException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { PrismaService } from '../src/prisma/prisma.service';
import { InventoryMovementsModule } from '../src/inventory-movements/inventory-movements.module';
import { InventoryMovementsService } from '../src/inventory-movements/inventory-movements.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

const movement = {
  id: 10,
  type: 'ENTRY',
  quantity: 3,
  reason: 'Compra',
  reference: null,
  notes: null,
  itemId: 1,
  createdAt: new Date(),
  item: { id: 1, code: 'HER-001', name: 'Martillo', unit: 'unidad' },
  createdBy: { id: 2, fullName: 'Operador', email: 'op@example.com' },
};

describe('InventoryMovementsController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  const service = {
    recordEntry: jest.fn(),
    recordExit: jest.fn(),
    recordAdjustment: jest.fn(),
    findAll: jest.fn(),
    findItemMovements: jest.fn(),
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
    service.recordEntry.mockResolvedValue(movement);
    service.recordExit.mockResolvedValue({ ...movement, type: 'EXIT' });
    service.recordAdjustment.mockResolvedValue({
      ...movement,
      type: 'ADJUSTMENT',
      quantity: -2,
    });
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    service.findItemMovements.mockResolvedValue({
      data: [movement],
      total: 1,
      page: 1,
      limit: 20,
    });

    const module = await Test.createTestingModule({
      imports: [InventoryMovementsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn(() => Promise.resolve()) })
      .overrideProvider(InventoryMovementsService)
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

  it('requires a JWT to record movements', async () => {
    await request(app.getHttpServer())
      .post('/inventory/items/1/entries')
      .send({ quantity: 3, reason: 'Compra' })
      .expect(401);
  });

  it('forbids a role without inventory access', async () => {
    role = 'Tesorero';
    await request(app.getHttpServer())
      .post('/inventory/items/1/entries')
      .set('Authorization', await authorization())
      .send({ quantity: 3, reason: 'Compra' })
      .expect(403);
  });

  it('records an entry for the inventory manager role', async () => {
    role = 'Gestor de Inventario';
    await request(app.getHttpServer())
      .post('/inventory/items/1/entries')
      .set('Authorization', await authorization())
      .send({ quantity: 3, reason: 'Compra', reference: 'FAC-1' })
      .expect(201);
    expect(service.recordEntry).toHaveBeenCalledWith(
      1,
      { quantity: 3, reason: 'Compra', reference: 'FAC-1' },
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('rejects an entry with a non-positive quantity or missing reason', async () => {
    await request(app.getHttpServer())
      .post('/inventory/items/1/entries')
      .set('Authorization', await authorization())
      .send({ quantity: 0, reason: 'Compra' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/inventory/items/1/entries')
      .set('Authorization', await authorization())
      .send({ quantity: 3 })
      .expect(400);
  });

  it('routes an exit and prevents negative stock at the service layer', async () => {
    service.recordExit.mockRejectedValueOnce(
      new ConflictException('Insufficient stock'),
    );
    await request(app.getHttpServer())
      .post('/inventory/items/1/exits')
      .set('Authorization', await authorization())
      .send({ quantity: 99, reason: 'Uso interno' })
      .expect(409);
    expect(service.recordExit).toHaveBeenCalledWith(
      1,
      { quantity: 99, reason: 'Uso interno' },
      1,
      expect.anything(),
    );

    await request(app.getHttpServer())
      .post('/inventory/items/1/exits')
      .set('Authorization', await authorization())
      .send({ quantity: 2, reason: 'Uso interno' })
      .expect(201);
  });

  it('requires a reason for adjustments', async () => {
    await request(app.getHttpServer())
      .post('/inventory/items/1/adjustments')
      .set('Authorization', await authorization())
      .send({ newQuantity: 8 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/inventory/items/1/adjustments')
      .set('Authorization', await authorization())
      .send({ newQuantity: -1, reason: 'Conteo' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/inventory/items/1/adjustments')
      .set('Authorization', await authorization())
      .send({ newQuantity: 8, reason: 'Conteo físico' })
      .expect(201);
  });

  it('lists movements with filters and pagination', async () => {
    await request(app.getHttpServer())
      .get('/inventory/movements?itemId=1&type=ENTRY&page=2&limit=5')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: 1, type: 'ENTRY', page: 2, limit: 5 }),
    );
  });

  it('lists movements of a specific item', async () => {
    await request(app.getHttpServer())
      .get('/inventory/items/1/movements')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.findItemMovements).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });
});
