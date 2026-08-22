import './helpers/configure-auth-env';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { AUDIT_PORT as USERS_AUDIT_PORT } from '../src/modules/users/application/ports/audit.port';
import { UsersModule } from '../src/modules/users/users.module';
import { ActivateUserUseCase } from '../src/modules/users/application/use-cases/activate-user.use-case';
import { ChangeUserRoleUseCase } from '../src/modules/users/application/use-cases/change-user-role.use-case';
import { DeactivateUserUseCase } from '../src/modules/users/application/use-cases/deactivate-user.use-case';
import { GetUserUseCase } from '../src/modules/users/application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../src/modules/users/application/use-cases/list-users.use-case';
import { UnlockUserUseCase } from '../src/modules/users/application/use-cases/unlock-user.use-case';
import { UpdateUserUseCase } from '../src/modules/users/application/use-cases/update-user.use-case';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  let status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  const listUsers = { execute: jest.fn() };
  const getUser = { execute: jest.fn() };
  const updateUser = { execute: jest.fn() };
  const changeUserRole = { execute: jest.fn() };
  const activateUser = { execute: jest.fn() };
  const deactivateUser = { execute: jest.fn() };
  const unlockUser = { execute: jest.fn() };
  const prisma = {
    user: {
      findUnique: jest.fn(() =>
        Promise.resolve({
          id: 1,
          fullName: 'Admin',
          email: 'admin@example.com',
          status,
          lockedAt: null,
          role: { name: role },
        }),
      ),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    role = 'Administrador';
    status = 'ACTIVE';
    listUsers.execute.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    getUser.execute.mockResolvedValue({
      id: 2,
      email: 'user@example.com',
      status: 'ACTIVE',
      lockedAt: null,
    });
    updateUser.execute.mockResolvedValue({
      id: 2,
      fullName: 'Nombre Nuevo',
      status: 'ACTIVE',
      lockedAt: null,
    });
    changeUserRole.execute.mockResolvedValue({
      id: 2,
      roleId: 2,
      status: 'ACTIVE',
      lockedAt: null,
    });
    activateUser.execute.mockResolvedValue({
      id: 2,
      status: 'ACTIVE',
      lockedAt: null,
    });
    deactivateUser.execute.mockImplementation(() => {
      status = 'INACTIVE';
      return Promise.resolve({ id: 1, status, lockedAt: null });
    });
    unlockUser.execute.mockResolvedValue({
      id: 2,
      lockedAt: null,
      isTemporarilyLocked: false,
    });

    const module = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AUDIT_PORT)
      .useValue({ record: jest.fn(() => Promise.resolve()) })
      .overrideProvider(USERS_AUDIT_PORT)
      .useValue({ record: jest.fn(() => Promise.resolve()) })
      .overrideProvider(ListUsersUseCase)
      .useValue(listUsers)
      .overrideProvider(GetUserUseCase)
      .useValue(getUser)
      .overrideProvider(UpdateUserUseCase)
      .useValue(updateUser)
      .overrideProvider(ChangeUserRoleUseCase)
      .useValue(changeUserRole)
      .overrideProvider(ActivateUserUseCase)
      .useValue(activateUser)
      .overrideProvider(DeactivateUserUseCase)
      .useValue(deactivateUser)
      .overrideProvider(UnlockUserUseCase)
      .useValue(unlockUser)
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

  it('requires authentication and administrator role for listing', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
    role = 'Tesorero';
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('passes valid filters and pagination for an administrator', async () => {
    await request(app.getHttpServer())
      .get(
        '/users?name=Ana&email=ana&identification=123&status=ACTIVE&roleId=2&blocked=false&page=2&limit=5',
      )
      .set('Authorization', await authorization())
      .expect(200);
    expect(listUsers.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5, blocked: false, roleId: 2 }),
    );
  });

  it('gets detail and validates the id', async () => {
    await request(app.getHttpServer())
      .get('/users/2')
      .set('Authorization', await authorization())
      .expect(200);
    await request(app.getHttpServer())
      .get('/users/not-a-number')
      .set('Authorization', await authorization())
      .expect(400);
  });

  it('accepts an allowed update and rejects invalid or prohibited fields', async () => {
    await request(app.getHttpServer())
      .patch('/users/2')
      .set('Authorization', await authorization())
      .send({ fullName: ' Nombre Nuevo ', email: 'NEW@EXAMPLE.COM' })
      .expect(200);
    expect(updateUser.execute).toHaveBeenCalledWith(2, {
      fullName: 'Nombre Nuevo',
      email: 'new@example.com',
    }, 1, expect.objectContaining({ ipAddress: expect.any(String) }));

    await request(app.getHttpServer())
      .patch('/users/2')
      .set('Authorization', await authorization())
      .send({ email: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/users/2')
      .set('Authorization', await authorization())
      .send({ passwordHash: 'forbidden', roleId: 1, status: 'ACTIVE' })
      .expect(400);
  });

  it('changes role and denies the action without permission', async () => {
    await request(app.getHttpServer())
      .patch('/users/2/role')
      .set('Authorization', await authorization())
      .send({ roleId: 2 })
      .expect(200);
    role = 'Tesorero';
    await request(app.getHttpServer())
      .patch('/users/2/role')
      .set('Authorization', await authorization())
      .send({ roleId: 2 })
      .expect(403);
  });

  it('routes account activation', async () => {
    await request(app.getHttpServer())
      .patch('/users/2/activate')
      .set('Authorization', await authorization())
      .expect(200);
    expect(activateUser.execute).toHaveBeenCalledWith(2, 1, expect.objectContaining({ ipAddress: expect.any(String) }));
  });

  it('allows only an administrator to unlock an account', async () => {
    await request(app.getHttpServer())
      .patch('/users/2/unlock')
      .set('Authorization', await authorization())
      .expect(200);
    expect(unlockUser.execute).toHaveBeenCalledWith(2, 1, expect.objectContaining({ ipAddress: expect.any(String) }));

    role = 'Tesorero';
    await request(app.getHttpServer())
      .patch('/users/2/unlock')
      .set('Authorization', await authorization())
      .expect(403);
  });

  it('invalidates a previously issued JWT after deactivation', async () => {
    const token = await authorization();
    await request(app.getHttpServer())
      .patch('/users/1/deactivate')
      .set('Authorization', token)
      .expect(200);
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', token)
      .expect(401);
  });
});
