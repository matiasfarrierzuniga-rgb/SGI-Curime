import './helpers/configure-auth-env';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { AUDIT_PORT as USERS_AUDIT_PORT } from '../src/modules/users/application/ports/audit.port';
import { UsersModule } from '../src/modules/users/users.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRequestsService } from '../src/user-requests/user-requests.service';

describe('RegistrationController public account request (e2e)', () => {
  let app: INestApplication<App>;
  const userRequests = { create: jest.fn() };
  const prisma = {
    user: { create: jest.fn() },
    person: { create: jest.fn() },
  };
  const body = {
    fullName: 'Persona Solicitante',
    firstName: 'Persona',
    firstSurname: 'Solicitante',
    identificationType: 'NATIONAL',
    identification: '123456789',
    email: ' PERSONA@EXAMPLE.COM ',
    phoneCountryCode: '+506',
    phoneNationalNumber: '88888888',
    address: ' Curime ',
    reason: ' Solicito acceso institucional ',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    userRequests.create.mockResolvedValue({ id: 10, status: 'PENDING' });
    const module = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(UserRequestsService)
      .useValue(userRequests)
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

  it('creates a pending request through POST /register without User, Person, or session creation', async () => {
    await request(app.getHttpServer()).post('/register').send(body).expect(201);

    expect(userRequests.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Persona Solicitante',
        email: 'persona@example.com',
        reason: 'Solicito acceso institucional',
      }),
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.person.create).not.toHaveBeenCalled();
  });

  it('rejects password and administrator fields from public registration', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({ ...body, password: 'Secure12345', roleId: 1 })
      .expect(400);
    expect(userRequests.create).not.toHaveBeenCalled();
  });

  it('requires public request reason and identity snapshots', async () => {
    await request(app.getHttpServer())
      .post('/register')
      .send({ ...body, reason: undefined })
      .expect(400);
    expect(userRequests.create).not.toHaveBeenCalled();
  });
});
