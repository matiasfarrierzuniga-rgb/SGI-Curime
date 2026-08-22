import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import { RolesModule } from '../src/modules/roles/roles.module';
import { ListRolesUseCase } from '../src/modules/roles/application/use-cases/list-roles.use-case';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';
process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = '30';

describe('RolesController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let role = 'Administrador';
  const listRoles = { execute: jest.fn() };
  const prisma = {
    user: {
      findUnique: jest.fn(() => Promise.resolve({
        id: 1,
        fullName: 'Admin',
        email: 'admin@example.com',
        status: 'ACTIVE',
        role: { name: role },
      })),
    },
  };

  beforeEach(async () => {
    role = 'Administrador';
    jest.clearAllMocks();
    listRoles.execute.mockResolvedValue([{ id: 1, name: 'Administrador' }]);
    const module = await Test.createTestingModule({ imports: [RolesModule] })
      .overrideProvider(PrismaService).useValue(prisma)
      .overrideProvider(AUDIT_PORT).useValue({ record: jest.fn(() => Promise.resolve()) })
      .overrideProvider(ListRolesUseCase).useValue(listRoles)
      .compile();
    app = module.createNestApplication();
    jwt = module.get(JwtService);
    await app.init();
  });

  afterEach(() => app?.close());
  const auth = async () => `Bearer ${await jwt.signAsync({ sub: 1, email: 'admin@example.com', role })}`;

  it('requires JWT', () => request(app.getHttpServer()).get('/roles').expect(401));

  it('forbids non-administrators', async () => {
    role = 'Tesorero';
    await request(app.getHttpServer()).get('/roles').set('Authorization', await auth()).expect(403);
  });

  it('returns the active safe role catalog to administrators', async () => {
    await request(app.getHttpServer())
      .get('/roles')
      .set('Authorization', await auth())
      .expect(200)
      .expect([{ id: 1, name: 'Administrador' }]);
    expect(listRoles.execute).toHaveBeenCalledTimes(1);
  });
});
