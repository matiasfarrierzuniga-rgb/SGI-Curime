import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth';
import { AuditModule } from '../../audit/audit.module';
import { PublicRequestRateLimitModule } from '../../common/rate-limit/public-request-rate-limit.module';
import { IdentityModule } from '../../identity/identity.module';
import { AUDIT_PORT } from './application/ports/audit.port';
import { ActivateUserUseCase } from './application/use-cases/activate-user.use-case';
import { ChangeUserRoleUseCase } from './application/use-cases/change-user-role.use-case';
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UnlockUserUseCase } from './application/use-cases/unlock-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UpdateSubscriptionExpirationUseCase } from './application/use-cases/update-subscription-expiration.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { RegisterAdministratorUseCase } from './application/use-cases/register-administrator.use-case';
import { OptionalJwtAuthGuard } from '../../auth/presentation/guards/optional-jwt-auth.guard';
import { USERS_REPOSITORY } from './domain/repositories/users-repository';
import { AuditServiceAdapter } from './infrastructure/audit/audit-service.adapter';
import { PrismaUsersRepository } from './infrastructure/prisma-users.repository';
import { UsersController } from './presentation/controllers/users.controller';
import { RegistrationController } from './presentation/controllers/registration.controller';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    PublicRequestRateLimitModule,
    IdentityModule,
  ],
  controllers: [UsersController, RegistrationController],
  providers: [
    PrismaUsersRepository,
    { provide: USERS_REPOSITORY, useExisting: PrismaUsersRepository },
    { provide: AUDIT_PORT, useClass: AuditServiceAdapter },
    ListUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    UpdateSubscriptionExpirationUseCase,
    ChangeUserRoleUseCase,
    ActivateUserUseCase,
    DeactivateUserUseCase,
    UnlockUserUseCase,
    RegisterUserUseCase,
    RegisterAdministratorUseCase,
    OptionalJwtAuthGuard,
  ],
})
export class UsersModule {}
