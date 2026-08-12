import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';

type TestUser = {
  id: number;
  fullName: string;
  identification: string;
  email: string;
  passwordHash: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  lockedAt: Date | null;
  role: { name: string };
};

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let currentUser: TestUser | undefined;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  function login(email = 'admin@curime.test', password = 'valid-password') {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
  }

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('valid-password', 4);
    currentUser = {
      id: 1,
      fullName: 'Administrador de Prueba',
      identification: '100000001',
      email: 'admin@curime.test',
      passwordHash,
      status: 'ACTIVE',
      lockedAt: null,
      role: { name: 'Administrador' },
    };

    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { email?: string; id?: number } }) => {
        if (where.email) {
          return Promise.resolve(
            where.email === currentUser?.email ? currentUser : null,
          );
        }

        return Promise.resolve(where.id === currentUser?.id ? currentUser : null);
      },
    );
    prismaMock.user.update.mockResolvedValue(currentUser);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    jwtService = moduleFixture.get(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('allows login with valid credentials', async () => {
    const response = await login().expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toEqual({
      id: 1,
      fullName: 'Administrador de Prueba',
      email: 'admin@curime.test',
      status: 'ACTIVE',
      role: 'Administrador',
    });
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('rejects an incorrect password', async () => {
    await login('admin@curime.test', 'incorrect-password').expect(401);
  });

  it('rejects an unknown email with the same generic response', async () => {
    const response = await login('unknown@curime.test').expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });

  it('rejects an inactive account', async () => {
    currentUser = { ...currentUser!, status: 'INACTIVE' };

    await login().expect(401);
  });

  it('returns the authenticated user for a valid JWT', async () => {
    const { body } = await login().expect(200);

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      id: 1,
      fullName: 'Administrador de Prueba',
      email: 'admin@curime.test',
      status: 'ACTIVE',
      role: 'Administrador',
    });
  });

  it('rejects access without a JWT', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('rejects an invalid JWT', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('rejects an expired JWT', async () => {
    const expiredToken = await jwtService.signAsync(
      { sub: 1, email: 'admin@curime.test', role: 'Administrador' },
      { expiresIn: '-1s' as never },
    );

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('rejects a JWT when its user becomes inactive', async () => {
    const { body } = await login().expect(200);
    currentUser = { ...currentUser!, status: 'INACTIVE' };

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(401);
  });

  it('allows the administrator endpoint for the Administrador role', async () => {
    const { body } = await login().expect(200);

    await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200)
      .expect({ message: 'Administrator access granted.' });
  });

  it('denies the administrator endpoint to another role', async () => {
    currentUser = { ...currentUser!, role: { name: 'Tesorero' } };
    const { body } = await login().expect(200);

    await request(app.getHttpServer())
      .get('/auth/admin-test')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(403);
  });
});
