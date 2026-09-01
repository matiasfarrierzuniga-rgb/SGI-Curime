import './helpers/configure-auth-env';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { AUDIT_PORT as USERS_AUDIT_PORT } from '../src/modules/users/application/ports/audit.port';
import { UsersModule } from '../src/modules/users/users.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('RegistrationController (e2e)', () => {
  let app: INestApplication<App>;
  let createdData:
    | {
        email: string;
        passwordHash: string;
        status: string;
        roleId: number;
        [key: string]: unknown;
      }
    | undefined;
  const role = {
    id: 5,
    name: 'Subscription_L1',
    description: null,
    isActive: true,
  };
  const prisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRequest: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  };
  const validBody = {
    fullName: '  Persona Usuaria  ',
    identificationType: 'NATIONAL',
    identification: '123456789',
    email: ' PERSONA@EXAMPLE.COM ',
    password: 'Secure12345',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    createdData = undefined;
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.role.findUnique.mockResolvedValue(role);
    prisma.user.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        createdData = data as typeof createdData;
        return Promise.resolve({
          id: 8,
          ...data,
          phoneCountryCode: data.phoneCountryCode ?? null,
          phoneNationalNumber: data.phoneNationalNumber ?? null,
          phone: null,
          address: data.address ?? null,
          lockedAt: null,
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      },
    );
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
    await app.init();
  });

  afterEach(() => app.close());

  it('creates a sanitized active user through public POST /register', async () => {
    const response = await request(app.getHttpServer())
      .post('/register')
      .send(validBody)
      .expect(201);

    expect(prisma.role.findUnique).toHaveBeenCalledWith({
      where: { name: 'Subscription_L1' },
      select: { id: true, name: true, description: true, isActive: true },
    });
    if (!createdData) throw new Error('Expected User creation data');
    expect(createdData).toMatchObject({
      email: 'persona@example.com',
      status: 'ACTIVE',
      roleId: 5,
    });
    expect(
      await bcrypt.compare(validBody.password, createdData.passwordHash),
    ).toBe(true);
    expect(createdData).not.toHaveProperty('password');
    expect(prisma.userRequest.create).not.toHaveBeenCalled();
    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(response.body).toMatchObject({
      id: 8,
      status: 'ACTIVE',
      role: { name: 'Subscription_L1' },
    });
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');
  });

  it.each([
    ['short password', { password: 'Short1A' }],
    ['missing lowercase', { password: 'UPPERCASE123' }],
    ['missing uppercase', { password: 'lowercase123' }],
    ['missing number', { password: 'NoNumbersHere' }],
    ['invalid email', { email: 'invalid-email' }],
  ])('rejects %s', async (_name, override) => {
    await request(app.getHttpServer())
      .post('/register')
      .send({ ...validBody, ...override })
      .expect(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it.each(['roleId', 'role', 'status', 'capabilities', 'isAdmin'])(
    'rejects forbidden privilege field %s',
    async (field) => {
      await request(app.getHttpServer())
        .post('/register')
        .send({ ...validBody, [field]: 'Administrador' })
        .expect(400);
      expect(prisma.user.create).not.toHaveBeenCalled();
    },
  );

  it('maps duplicate detection and uniqueness races to 400', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 10 });

    await request(app.getHttpServer())
      .post('/register')
      .send(validBody)
      .expect(400);
    expect(prisma.user.create).not.toHaveBeenCalled();

    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    const raceResponse = await request(app.getHttpServer())
      .post('/register')
      .send(validBody)
      .expect(400);
    expect((raceResponse.body as { message: string }).message).toBe(
      'Email or identification is already registered',
    );
  });

  it('returns a controlled 500 when Subscription_L1 is unavailable', async () => {
    prisma.role.findUnique.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post('/register')
      .send(validBody)
      .expect(500);
    expect((response.body as { message: string }).message).toBe(
      'Registration role is not configured',
    );
  });
});
