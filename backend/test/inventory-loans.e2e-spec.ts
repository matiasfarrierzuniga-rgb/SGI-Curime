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
import { InventoryLoansModule } from '../src/inventory-loans/inventory-loans.module';
import { InventoryLoansService } from '../src/inventory-loans/inventory-loans.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

const loan = {
  id: 5,
  quantity: 2,
  borrowerName: 'Juana Pérez',
  borrowerAffiliateId: null,
  loanDate: new Date(),
  expectedReturnDate: new Date(Date.now() + 86400000),
  returnedAt: null,
  status: 'ACTIVE',
  notes: null,
  itemId: 1,
  item: { id: 1, code: 'HER-001', name: 'Martillo' },
  borrowerAffiliate: null,
  isOverdue: false,
};

describe('InventoryLoansController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    return: jest.fn(),
    cancel: jest.fn(),
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
    service.create.mockResolvedValue(loan);
    service.findAll.mockResolvedValue({
      data: [loan],
      total: 1,
      page: 1,
      limit: 20,
    });
    service.findOne.mockResolvedValue(loan);
    service.return.mockResolvedValue({
      ...loan,
      status: 'RETURNED',
      returnedAt: new Date(),
    });
    service.cancel.mockResolvedValue({
      ...loan,
      status: 'CANCELLED',
    });

    const module = await Test.createTestingModule({
      imports: [InventoryLoansModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn(() => Promise.resolve()) })
      .overrideProvider(InventoryLoansService)
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
    request(app.getHttpServer()).get('/inventory/loans').expect(401));

  it('forbids a role without inventory access', async () => {
    role = 'Vecino/Afiliado';
    await request(app.getHttpServer())
      .post('/inventory/loans')
      .set('Authorization', await authorization())
      .send({
        itemId: 1,
        quantity: 2,
        borrowerName: 'Juana Pérez',
        expectedReturnDate: '2026-09-01',
      })
      .expect(403);
  });

  it('allows the inventory manager role to create a loan', async () => {
    role = 'Gestor de Inventario';
    await request(app.getHttpServer())
      .post('/inventory/loans')
      .set('Authorization', await authorization())
      .send({
        itemId: 1,
        quantity: 2,
        borrowerName: 'Juana Pérez',
        expectedReturnDate: '2026-09-01',
      })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 1,
        quantity: 2,
        borrowerName: 'Juana Pérez',
      }),
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('rejects a loan without a borrower or with invalid quantities', async () => {
    await request(app.getHttpServer())
      .post('/inventory/loans')
      .set('Authorization', await authorization())
      .send({ itemId: 1, quantity: 2, expectedReturnDate: '2026-09-01' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/inventory/loans')
      .set('Authorization', await authorization())
      .send({
        itemId: 1,
        quantity: 0,
        borrowerName: 'X',
        expectedReturnDate: '2026-09-01',
      })
      .expect(400);
  });

  it('returns 409 when the stock is insufficient to loan', async () => {
    service.create.mockRejectedValueOnce(
      new ConflictException('Insufficient stock'),
    );
    await request(app.getHttpServer())
      .post('/inventory/loans')
      .set('Authorization', await authorization())
      .send({
        itemId: 1,
        quantity: 99,
        borrowerName: 'Juana Pérez',
        expectedReturnDate: '2026-09-01',
      })
      .expect(409);
  });

  it('lists loans with filters and pagination', async () => {
    await request(app.getHttpServer())
      .get('/inventory/loans?status=ACTIVE&overdue=true&page=1&limit=10')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ACTIVE',
        overdue: true,
        page: 1,
        limit: 10,
      }),
    );
  });

  it('routes a return and rejects a double return at the service layer', async () => {
    service.return.mockRejectedValueOnce(
      new ConflictException('Loan is already returned'),
    );
    await request(app.getHttpServer())
      .patch('/inventory/loans/5/return')
      .set('Authorization', await authorization())
      .send({})
      .expect(409);

    await request(app.getHttpServer())
      .patch('/inventory/loans/5/return')
      .set('Authorization', await authorization())
      .send({})
      .expect(200);
    expect(service.return).toHaveBeenCalledWith(
      5,
      {},
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('rejects a return for an invalid id', async () => {
    await request(app.getHttpServer())
      .patch('/inventory/loans/abc/return')
      .set('Authorization', await authorization())
      .expect(400);
  });

  it('routes a cancellation for the inventory manager role', async () => {
    role = 'Gestor de Inventario';
    await request(app.getHttpServer())
      .patch('/inventory/loans/5/cancel')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.cancel).toHaveBeenCalledWith(
      5,
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('rejects a cancellation of an already returned or cancelled loan at the service layer', async () => {
    service.cancel.mockRejectedValue(
      new ConflictException('Loan is not active; it cannot be cancelled'),
    );
    await request(app.getHttpServer())
      .patch('/inventory/loans/5/cancel')
      .set('Authorization', await authorization())
      .expect(409);
  });

  it('rejects a cancellation for an invalid id', async () => {
    await request(app.getHttpServer())
      .patch('/inventory/loans/abc/cancel')
      .set('Authorization', await authorization())
      .expect(400);
  });
});
