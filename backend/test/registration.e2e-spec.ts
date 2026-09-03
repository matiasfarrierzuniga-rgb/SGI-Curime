import './helpers/configure-auth-env';
process.env.REFRESH_TOKEN_TTL = '3600';
process.env.PUBLIC_REQUEST_RATE_LIMIT_MAX = '1000';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { AUDIT_PORT as USERS_AUDIT_PORT } from '../src/modules/users/application/ports/audit.port';
import { UsersModule } from '../src/modules/users/users.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('RegistrationController Person-first (e2e)', () => {
  let app: INestApplication<App>;
  let createdUserData: Record<string, unknown> | undefined;
  let createdPersonData: Record<string, unknown> | undefined;
  let jwt: JwtService;
  let administratorCount = 0;
  let authenticatedUser: Record<string, unknown> | undefined;
  const role = {
    id: 5,
    name: 'Subscription_L1',
    description: null,
    isActive: true,
  };
  const administratorRole = {
    id: 1,
    name: 'Administrador',
    description: null,
    isActive: true,
  };
  const prisma = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    person: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    role: { findUnique: jest.fn() },
    userRequest: { create: jest.fn() },
    session: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const validBody = {
    firstName: '  Persona  ',
    firstSurname: '  Usuaria  ',
    secondSurname: ' Prueba ',
    identificationType: 'NATIONAL',
    identification: '123456789',
    email: ' PERSONA@EXAMPLE.COM ',
    phoneCountryCode: '+506',
    phoneNationalNumber: '88888888',
    address: ' Curime ',
    password: 'Secure12345',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    createdUserData = undefined;
    createdPersonData = undefined;
    administratorCount = 0;
    authenticatedUser = undefined;
    prisma.$transaction.mockImplementation(
      (work: (client: typeof prisma) => Promise<unknown>) =>
        work({ ...prisma }),
    );
    prisma.$queryRaw.mockResolvedValue([{ locked: 1 }]);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.findUnique.mockImplementation(
      ({ where }: { where: { id?: number } }) =>
        Promise.resolve(
          where.id === 1 && authenticatedUser ? authenticatedUser : null,
        ),
    );
    prisma.user.count.mockImplementation(() =>
      Promise.resolve(administratorCount),
    );
    prisma.role.findUnique.mockImplementation(
      ({ where }: { where: { name: string } }) =>
        Promise.resolve(
          where.name === 'Administrador' ? administratorRole : role,
        ),
    );
    prisma.person.findMany.mockResolvedValue([]);
    prisma.person.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        createdPersonData = data;
        return Promise.resolve({ id: 12, ...data });
      },
    );
    prisma.user.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        createdUserData = data;
        return Promise.resolve({
          id: 8,
          ...data,
          phoneCountryCode: data.phoneCountryCode ?? null,
          phoneNationalNumber: data.phoneNationalNumber ?? null,
          phone: null,
          address: data.address ?? null,
          lockedAt: null,
          role: data.roleId === administratorRole.id ? administratorRole : role,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      },
    );
    prisma.user.update.mockResolvedValue({ id: 8 });
    prisma.session.create.mockResolvedValue({ id: 1 });
    prisma.auditLog.create.mockResolvedValue({ id: 1 });

    const module = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn() })
      .overrideProvider(USERS_AUDIT_PORT)
      .useValue({ record: jest.fn() })
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

  it('creates linked Person and sanitized ACTIVE User through POST /register', async () => {
    const response = await register().expect(201);

    expect(prisma.role.findUnique).toHaveBeenCalledWith({
      where: { name: 'Subscription_L1' },
      select: { id: true, name: true, description: true, isActive: true },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(createdPersonData).toMatchObject({
      firstName: 'Persona',
      firstSurname: 'Usuaria',
      secondSurname: 'Prueba',
      identification: '123456789',
      identificationType: 'NATIONAL',
      normalizedIdentification: '123456789',
      phoneCountryCode: '+506',
      phoneNationalNumber: '88888888',
      address: 'Curime',
    });
    expect(createdPersonData).not.toHaveProperty('email');
    expect(createdPersonData).not.toHaveProperty('legacyFullName');
    expect(createdUserData).toMatchObject({
      fullName: 'Persona Usuaria Prueba',
      email: 'persona@example.com',
      status: 'ACTIVE',
      roleId: 5,
      personId: 12,
    });
    const expiration = createdUserData?.subscriptionExpirationDate as Date;
    expect(expiration).toBeInstanceOf(Date);
    expect(expiration.getUTCFullYear()).toBe(new Date().getUTCFullYear() + 1);
    expect(
      await bcrypt.compare(
        validBody.password,
        createdUserData?.passwordHash as string,
      ),
    ).toBe(true);
    expect(prisma.userRequest.create).not.toHaveBeenCalled();
    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(response.body).toMatchObject({
      id: 8,
      status: 'ACTIVE',
      role: { name: 'Subscription_L1' },
    });
    for (const field of [
      'password',
      'passwordHash',
      'accessToken',
      'refreshToken',
    ]) {
      expect(response.body).not.toHaveProperty(field);
    }
  });

  it.each([
    ['short password', { password: 'Short1A' }],
    ['invalid email', { email: 'invalid-email' }],
    ['invalid NATIONAL', { identification: '023456789' }],
    ['invalid DIMEX', { identificationType: 'DIMEX', identification: '123' }],
    ['invalid first name', { firstName: '123' }],
    ['invalid first surname', { firstSurname: '---' }],
  ])('rejects %s before Person/User creation', async (_name, override) => {
    await register(override).expect(400);
    expect(prisma.person.create).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it.each(['fullName', 'passwordConfirmation', 'roleId', 'status', 'isAdmin'])(
    'rejects forbidden request field %s',
    async (field) => {
      await register({ [field]: 'forbidden' }).expect(400);
      expect(prisma.person.create).not.toHaveBeenCalled();
    },
  );

  it('collapses duplicate email and existing-Person account to generic 400', async () => {
    prisma.user.findFirst.mockResolvedValueOnce({ id: 10 });
    const duplicateEmail = await register().expect(400);
    expect((duplicateEmail.body as { message: string }).message).toBe(
      'Email or identification is already registered',
    );

    prisma.user.findFirst.mockResolvedValue(null);
    prisma.person.findMany.mockResolvedValueOnce([
      {
        id: 12,
        firstName: 'Persona',
        firstSurname: 'Usuaria',
        secondSurname: 'Prueba',
        identification: '123456789',
        identificationType: 'NATIONAL',
        normalizedIdentification: '123456789',
      },
    ]);
    prisma.user.findUnique.mockResolvedValueOnce({ id: 8 });
    const duplicateIdentity = await register({
      email: 'other@example.com',
    }).expect(400);
    expect((duplicateIdentity.body as { message: string }).message).toBe(
      'Email or identification is already registered',
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('maps User uniqueness races without exposing Prisma metadata', async () => {
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      }),
    );

    const response = await register().expect(400);
    expect((response.body as { message: string }).message).toBe(
      'Email or identification is already registered',
    );
    expect(JSON.stringify(response.body)).not.toContain('P2002');
    expect(JSON.stringify(response.body)).not.toContain('target');
  });

  it('does not create Person when Subscription_L1 is unavailable', async () => {
    prisma.role.findUnique.mockResolvedValue(null);

    const response = await register().expect(500);
    expect((response.body as { message: string }).message).toBe(
      'Registration role is not configured',
    );
    expect(prisma.person.create).not.toHaveBeenCalled();
  });

  it('keeps the registered account compatible with subsequent login', async () => {
    await register().expect(201);
    expect(prisma.session.create).not.toHaveBeenCalled();
    prisma.user.findUnique.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) => {
        if ('email' in where && createdUserData) {
          return Promise.resolve({
            id: 8,
            ...createdUserData,
            failedLoginAttempts: 0,
            lockedAt: null,
            lastLoginAt: null,
            role,
          });
        }
        return Promise.resolve(null);
      },
    );

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'persona@example.com', password: validBody.password })
      .expect(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(
      (response.body as { user: Record<string, unknown> }).user,
    ).toMatchObject({
      id: 8,
      fullName: 'Persona Usuaria Prueba',
    });
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });

  it('bootstraps first Admin publicly, then enforces administrator authentication', async () => {
    const first = await request(app.getHttpServer())
      .post('/admin/register')
      .send(validBody)
      .expect(201);
    expect(createdPersonData).toBeDefined();
    expect(createdUserData).toMatchObject({
      status: 'ACTIVE',
      roleId: administratorRole.id,
      subscriptionExpirationDate: null,
    });
    expect(first.body).toMatchObject({ role: { name: 'Administrador' } });

    administratorCount = 1;
    await request(app.getHttpServer())
      .post('/admin/register')
      .send({ ...validBody, email: 'second@example.com' })
      .expect(401);

    authenticatedUser = {
      id: 1,
      fullName: 'Subscription',
      email: 'subscription@example.com',
      status: 'ACTIVE',
      passwordHash: 'hash',
      lockedAt: null,
      failedLoginAttempts: 0,
      lastLoginAt: null,
      role: { name: 'Subscription_L1' },
      subscriptionExpirationDate: new Date(Date.now() + 60_000),
    };
    const subscriptionToken = await jwt.signAsync({
      sub: 1,
      email: authenticatedUser.email,
      role: 'Subscription_L1',
    });
    await request(app.getHttpServer())
      .post('/admin/register')
      .set('Authorization', `Bearer ${subscriptionToken}`)
      .send({ ...validBody, email: 'third@example.com' })
      .expect(403);

    authenticatedUser = {
      ...authenticatedUser,
      role: { name: 'Administrador' },
      subscriptionExpirationDate: null,
    };
    const adminToken = await jwt.signAsync({
      sub: 1,
      email: authenticatedUser.email,
      role: 'Administrador',
    });
    await request(app.getHttpServer())
      .post('/admin/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBody, email: 'fourth@example.com' })
      .expect(201);
  });

  function register(override: Record<string, unknown> = {}) {
    return request(app.getHttpServer())
      .post('/register')
      .send({ ...validBody, ...override });
  }
});
