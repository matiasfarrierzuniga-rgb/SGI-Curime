import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { PASSWORD_RESET_DELIVERY_PORT } from '../src/auth/application/ports/password-reset-delivery.port';
import { PrismaService } from '../src/prisma/prisma.service';
import { createHash } from 'crypto';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

type TestUser = {
  id: number;
  fullName: string;
  identification: string;
  email: string;
  passwordHash: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  lockedAt: Date | null;
  failedLoginAttempts: number;
  role: { name: string };
};

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let currentUser: TestUser | undefined;
  let resetTokenRecord:
    | {
        id: number;
        userId: number;
        tokenHash: string;
        expiresAt: Date;
        usedAt: Date | null;
        user: TestUser;
      }
    | undefined;
  let deliveredToken: string | undefined;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
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
      failedLoginAttempts: 0,
      role: { name: 'Administrador' },
    };
    resetTokenRecord = undefined;
    deliveredToken = undefined;

    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { email?: string; id?: number } }) => {
        if (where.email) {
          return Promise.resolve(
            where.email === currentUser?.email ? currentUser : null,
          );
        }

        return Promise.resolve(
          where.id === currentUser?.id ? currentUser : null,
        );
      },
    );
    prismaMock.user.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        if (!currentUser) return Promise.resolve(null);
        if (typeof data.failedLoginAttempts === 'object') {
          currentUser.failedLoginAttempts += 1;
          return Promise.resolve({
            failedLoginAttempts: currentUser.failedLoginAttempts,
          });
        }
        currentUser = { ...currentUser, ...data } as TestUser;
        return Promise.resolve(currentUser);
      },
    );
    prismaMock.passwordResetToken.findUnique.mockImplementation(
      ({ where }: { where: { tokenHash: string } }) =>
        Promise.resolve(
          where.tokenHash === resetTokenRecord?.tokenHash
            ? resetTokenRecord
            : null,
        ),
    );
    prismaMock.passwordResetToken.updateMany.mockImplementation(
      ({ where, data }: { where: { id?: number }; data: { usedAt: Date } }) => {
        if (
          where.id &&
          resetTokenRecord?.id === where.id &&
          !resetTokenRecord.usedAt
        ) {
          resetTokenRecord.usedAt = data.usedAt;
          return Promise.resolve({ count: 1 });
        }
        if (!where.id && resetTokenRecord)
          resetTokenRecord.usedAt = data.usedAt;
        return Promise.resolve({ count: where.id ? 0 : 1 });
      },
    );
    prismaMock.passwordResetToken.create.mockImplementation(
      ({
        data,
      }: {
        data: { userId: number; tokenHash: string; expiresAt: Date };
      }) => {
        resetTokenRecord = {
          id: 1,
          ...data,
          usedAt: null,
          user: currentUser!,
        };
        return Promise.resolve(resetTokenRecord);
      },
    );
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn(() => Promise.resolve()) })
      .overrideProvider(PASSWORD_RESET_DELIVERY_PORT)
      .useValue({
        deliver: ({ token }: { token: string }) => {
          deliveredToken = token;
          return Promise.resolve();
        },
      })
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
    expect(currentUser?.failedLoginAttempts).toBe(1);
  });

  it('locks after repeated failures, rejects the correct password, and resets after expiry', async () => {
    await login('admin@curime.test', 'wrong-1').expect(401);
    await login('admin@curime.test', 'wrong-2').expect(401);
    await login('admin@curime.test', 'wrong-3').expect(401);
    expect(currentUser?.lockedAt).toBeInstanceOf(Date);

    await login().expect(401);
    currentUser!.lockedAt = new Date(Date.now() - 16 * 60_000);
    await login().expect(200);
    expect(currentUser?.failedLoginAttempts).toBe(0);
    expect(currentUser?.lockedAt).toBeNull();
  });

  it('rejects an unknown email with the same generic response', async () => {
    const response = await login('unknown@curime.test').expect(401);

    expect(response.body.message).toBe('Invalid credentials');
  });

  it('rejects an inactive account', async () => {
    currentUser = { ...currentUser!, status: 'INACTIVE' };

    await login().expect(401);
  });

  it('returns indistinguishable forgot-password responses and stores only a token hash', async () => {
    const existing = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: ' ADMIN@CURIME.TEST ' })
      .expect(200);
    expect(resetTokenRecord?.tokenHash).toBe(
      createHash('sha256').update(deliveredToken!).digest('hex'),
    );
    expect(resetTokenRecord?.tokenHash).not.toBe(deliveredToken);

    const missing = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'missing@curime.test' })
      .expect(200);
    expect(missing.body).toEqual(existing.body);

    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('validates password policy and confirmation for reset and change', async () => {
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: 'some-token',
        password: 'weak',
        passwordConfirmation: 'different',
      })
      .expect(400);

    const { body } = await login().expect(200);
    await request(app.getHttpServer())
      .patch('/auth/change-password')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .send({
        currentPassword: 'valid-password',
        newPassword: 'weak',
        newPasswordConfirmation: 'weak',
      })
      .expect(400);
  });

  it('rejects invalid and reused reset tokens, then logs in only with the reset password', async () => {
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: 'invalid-token',
        password: 'NewSecurePass1',
        passwordConfirmation: 'NewSecurePass1',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: currentUser!.email })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: deliveredToken,
        password: 'NewSecurePass1',
        passwordConfirmation: 'NewSecurePass1',
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: deliveredToken,
        password: 'AnotherPass1',
        passwordConfirmation: 'AnotherPass1',
      })
      .expect(409);
    await login(currentUser!.email, 'valid-password').expect(401);
    await login(currentUser!.email, 'NewSecurePass1').expect(200);
  });

  it('requires JWT to change password and accepts the authenticated user only', async () => {
    await request(app.getHttpServer())
      .patch('/auth/change-password')
      .send({
        currentPassword: 'valid-password',
        newPassword: 'NewSecurePass1',
        newPasswordConfirmation: 'NewSecurePass1',
      })
      .expect(401);

    const { body } = await login().expect(200);
    await request(app.getHttpServer())
      .patch('/auth/change-password')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .send({
        currentPassword: 'valid-password',
        newPassword: 'NewSecurePass1',
        newPasswordConfirmation: 'NewSecurePass1',
      })
      .expect(200);
    await login(currentUser!.email, 'valid-password').expect(401);
    await login(currentUser!.email, 'NewSecurePass1').expect(200);
  });

  it('rejects an invalid activation password before accessing a token', async () => {
    await request(app.getHttpServer())
      .post('/auth/activate-account')
      .send({
        token: 'some-token',
        password: 'weak',
        passwordConfirmation: 'weak',
      })
      .expect(400);
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
