import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AffiliateRequestsModule } from '../src/affiliate-requests/affiliate-requests.module';
import { AffiliateRequestsService } from '../src/affiliate-requests/affiliate-requests.service';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { PrismaService } from '../src/prisma/prisma.service';
import { buildPrismaAuthUser } from './helpers/auth-fixtures';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';
process.env.PUBLIC_REQUEST_RATE_LIMIT_TTL_SECONDS = '60';
process.env.PUBLIC_REQUEST_RATE_LIMIT_MAX = '20';

describe('Administrative affiliate requests (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let role = 'Administrador';
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };
  const prisma = {
    user: {
      findUnique: jest.fn(() =>
        Promise.resolve(buildPrismaAuthUser({ roleName: role })),
      ),
    },
  };
  const body = {
    birthDate: '1990-01-01',
    address: 'Curime',
    affiliationReason: 'Participar',
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
    service.approve.mockResolvedValue({
      affiliate: { id: 20, roleId: 4 },
      affiliateRequest: { id: 10, status: 'APPROVED' },
    });
    service.reject.mockResolvedValue({ id: 10, status: 'REJECTED' });
    const module = await Test.createTestingModule({
      imports: [AffiliateRequestsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn() })
      .overrideProvider(AffiliateRequestsService)
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

  it('rejects an anonymous affiliation request', () =>
    request(app.getHttpServer())
      .post('/affiliate-requests')
      .send(body)
      .expect(401));

  it('passes the authenticated user id and safe payload when creating', async () => {
    await request(app.getHttpServer())
      .post('/affiliate-requests')
      .set('Authorization', await authorization())
      .send(body)
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ address: 'Curime' }),
      1,
      expect.any(Object),
    );
  });

  it.each(['personId', 'userId', 'identification', 'email'] as const)(
    'rejects client identity field %s',
    async (field) => {
      await request(app.getHttpServer())
        .post('/affiliate-requests')
        .set('Authorization', await authorization())
        .send({ ...body, [field]: 'spoofed' })
        .expect(400);
      expect(service.create).not.toHaveBeenCalled();
    },
  );

  it('requires roleId and passes it to approval', async () => {
    await request(app.getHttpServer())
      .patch('/affiliate-requests/10/approve')
      .set('Authorization', await authorization())
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .patch('/affiliate-requests/10/approve')
      .set('Authorization', await authorization())
      .send({ roleId: 4 })
      .expect(200);
    expect(service.approve).toHaveBeenCalledWith(10, 4, 1, expect.any(Object));
  });

  it('keeps administrative review protected', async () => {
    await request(app.getHttpServer()).get('/affiliate-requests').expect(401);
    role = 'Tesorero';
    await request(app.getHttpServer())
      .get('/affiliate-requests')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('passes rejection data without a role mutation contract', async () => {
    await request(app.getHttpServer())
      .patch('/affiliate-requests/10/reject')
      .set('Authorization', await authorization())
      .send({ rejectionReason: 'Documentación incompleta' })
      .expect(200);
    expect(service.reject).toHaveBeenCalledWith(
      10,
      'Documentación incompleta',
      1,
      expect.any(Object),
    );
  });
});
