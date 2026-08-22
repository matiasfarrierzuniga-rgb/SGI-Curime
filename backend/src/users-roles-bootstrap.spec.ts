import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

type AuthModule = typeof import('./auth/auth.module')['AuthModule'];
type AuditModule = typeof import('./audit/audit.module')['AuditModule'];
type PrismaModule = typeof import('./prisma/prisma.module')['PrismaModule'];
type RolesModule = typeof import('./modules/roles/roles.module')['RolesModule'];
type UsersModule = typeof import('./modules/users/users.module')['UsersModule'];
type ListRolesUseCase = typeof import('./modules/roles/application/use-cases/list-roles.use-case')['ListRolesUseCase'];
type ListUsersUseCase = typeof import('./modules/users/application/use-cases/list-users.use-case')['ListUsersUseCase'];

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
  let listRolesUseCase: ListRolesUseCase;
  let listUsersUseCase: ListUsersUseCase;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://localhost/sgi_curime_test';
    process.env.JWT_SECRET = 'bootstrap-test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.MAX_LOGIN_ATTEMPTS = '5';
    process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

    const { AuthModule } = require('./auth/auth.module');
    const { AuditModule } = require('./audit/audit.module');
    const { PrismaModule } = require('./prisma/prisma.module');
    const { RolesModule } = require('./modules/roles/roles.module');
    const { ListRolesUseCase } = require(
      './modules/roles/application/use-cases/list-roles.use-case',
    );
    const { ROLES_REPOSITORY } = require(
      './modules/roles/domain/repositories/roles-repository',
    );
    const { UsersModule } = require('./modules/users/users.module');
    const { ListUsersUseCase } = require(
      './modules/users/application/use-cases/list-users.use-case',
    );
    const { USERS_REPOSITORY } = require(
      './modules/users/domain/repositories/users-repository',
    );
    rolesRepositoryToken = ROLES_REPOSITORY;
    usersRepositoryToken = USERS_REPOSITORY;
    listRolesUseCase = ListRolesUseCase;
    listUsersUseCase = ListUsersUseCase;

    module = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, AuditModule, UsersModule, RolesModule],
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
