import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

@Module({})
class StubAuthModule {}

describe('Users and Roles module composition', () => {
  let module: TestingModule;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;
  const originalMaxLoginAttempts = process.env.MAX_LOGIN_ATTEMPTS;
  const originalAccountLockoutMinutes = process.env.ACCOUNT_LOCKOUT_MINUTES;
  let rolesRepositoryToken: symbol;
  let usersRepositoryToken: symbol;
  let listRolesUseCase: typeof import('./modules/roles/application/use-cases/list-roles.use-case').ListRolesUseCase;
  let listUsersUseCase: typeof import('./modules/users/application/use-cases/list-users.use-case').ListUsersUseCase;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://localhost/sgi_curime_test';
    process.env.JWT_SECRET = 'bootstrap-test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.MAX_LOGIN_ATTEMPTS = '5';
    process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

    const { AuthModule } =
      jest.requireActual<typeof import('./auth/auth.module')>(
        './auth/auth.module',
      );
    const { AuditModule } = jest.requireActual<
      typeof import('./audit/audit.module')
    >('./audit/audit.module');
    const { PrismaModule } = jest.requireActual<
      typeof import('./prisma/prisma.module')
    >('./prisma/prisma.module');
    const { RolesModule } = jest.requireActual<
      typeof import('./modules/roles/roles.module')
    >('./modules/roles/roles.module');
    const { ListRolesUseCase } = jest.requireActual<
      typeof import('./modules/roles/application/use-cases/list-roles.use-case')
    >('./modules/roles/application/use-cases/list-roles.use-case');
    const { ROLES_REPOSITORY } = jest.requireActual<
      typeof import('./modules/roles/domain/repositories/roles-repository')
    >('./modules/roles/domain/repositories/roles-repository');
    const { UsersModule } = jest.requireActual<
      typeof import('./modules/users/users.module')
    >('./modules/users/users.module');
    const { ListUsersUseCase } = jest.requireActual<
      typeof import('./modules/users/application/use-cases/list-users.use-case')
    >('./modules/users/application/use-cases/list-users.use-case');
    const { USERS_REPOSITORY } = jest.requireActual<
      typeof import('./modules/users/domain/repositories/users-repository')
    >('./modules/users/domain/repositories/users-repository');
    rolesRepositoryToken = ROLES_REPOSITORY;
    usersRepositoryToken = USERS_REPOSITORY;
    listRolesUseCase = ListRolesUseCase;
    listUsersUseCase = ListUsersUseCase;

    module = await Test.createTestingModule({
      imports: [
        PrismaModule,
        AuthModule,
        AuditModule,
        UsersModule,
        RolesModule,
      ],
    })
      .overrideModule(AuthModule)
      .useModule(StubAuthModule)
      .compile();
  });

  afterAll(async () => {
    await module?.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
    process.env.MAX_LOGIN_ATTEMPTS = originalMaxLoginAttempts;
    process.env.ACCOUNT_LOCKOUT_MINUTES = originalAccountLockoutMinutes;
  });

  it('resolves both repository tokens and their use cases', () => {
    expect(module.get(usersRepositoryToken)).toBeDefined();
    expect(module.get(rolesRepositoryToken)).toBeDefined();
    expect(module.get(listUsersUseCase)).toBeDefined();
    expect(module.get(listRolesUseCase)).toBeDefined();
  });
});
