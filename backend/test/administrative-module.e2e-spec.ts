import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AffiliateRequestsModule } from '../src/affiliate-requests/affiliate-requests.module';
import { AffiliateRequestsService } from '../src/affiliate-requests/affiliate-requests.service';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

describe('Administrative affiliate requests (e2e)', () => {
  let app: INestApplication<App>;
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
    service.approve.mockResolvedValue({
      affiliate: { id: 20 },
      affiliateRequest: { id: 10, status: 'APPROVED' },
    });
    const module = await Test.createTestingModule({
      imports: [AffiliateRequestsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
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

  it('accepts a valid public affiliate request', async () => {
    await request(app.getHttpServer())
      .post('/affiliate-requests')
      .send({
        fullName: '  Persona Afiliada  ',
        identification: ' 1-2345-6789 ',
        birthDate: '1990-01-01',
        email: ' PERSONA@EXAMPLE.COM ',
        address: ' Curime ',
        affiliationReason: ' Participar en la comunidad ',
      })
      .expect(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Persona Afiliada',
        email: 'persona@example.com',
      }),
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('requires JWT for administrative review', async () => {
    await request(app.getHttpServer()).get('/affiliate-requests').expect(401);
  });

  it('forbids a non-administrator', async () => {
    role = 'Tesorero';
    await request(app.getHttpServer())
      .get('/affiliate-requests')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('passes the administrator id when approving', async () => {
    await request(app.getHttpServer())
      .patch('/affiliate-requests/10/approve')
      .set('Authorization', await authorization())
      .expect(200);
    expect(service.approve).toHaveBeenCalledWith(
      10,
      1,
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });
});
