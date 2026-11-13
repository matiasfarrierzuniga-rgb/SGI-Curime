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
import { ListAccountsUseCase } from './application/use-cases/list-accounts.use-case';
import { UnlockUserUseCase } from './application/use-cases/unlock-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { ResolveBoardPrivilegeReviewUseCase } from './application/use-cases/resolve-board-privilege-review.use-case';
import { RegisterAdministratorUseCase } from './application/use-cases/register-administrator.use-case';
import { CreatePersonUseCase } from './application/use-cases/create-person.use-case';
import { LinkAccountPersonUseCase } from './application/use-cases/link-account-person.use-case';
import { ListPersonLinkCandidatesUseCase } from './application/use-cases/list-person-link-candidates.use-case';
import { OptionalJwtAuthGuard } from '../../auth/presentation/guards/optional-jwt-auth.guard';
import { CommunityAccountsModule } from '../../user-requests/community-accounts.module';
import { USERS_REPOSITORY } from './domain/repositories/users-repository';
import { AuditServiceAdapter } from './infrastructure/audit/audit-service.adapter';
import { PrismaUsersRepository } from './infrastructure/prisma-users.repository';
import { UsersController } from './presentation/controllers/users.controller';
import { IdentityAccountLinksController } from './presentation/controllers/identity-account-links.controller';
import { IdentityPersonsController } from './presentation/controllers/identity-persons.controller';
import { RegistrationController } from './presentation/controllers/registration.controller';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    PublicRequestRateLimitModule,
    IdentityModule,
    CommunityAccountsModule,
  ],
  controllers: [
    UsersController,
    RegistrationController,
    IdentityAccountLinksController,
    IdentityPersonsController,
  ],
  providers: [
    PrismaUsersRepository,
    { provide: USERS_REPOSITORY, useExisting: PrismaUsersRepository },
    { provide: AUDIT_PORT, useClass: AuditServiceAdapter },
    ListUsersUseCase,
    ListAccountsUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    ResolveBoardPrivilegeReviewUseCase,
    ChangeUserRoleUseCase,
    ActivateUserUseCase,
    DeactivateUserUseCase,
    UnlockUserUseCase,
    RegisterAdministratorUseCase,
    CreatePersonUseCase,
    LinkAccountPersonUseCase,
    ListPersonLinkCandidatesUseCase,
    OptionalJwtAuthGuard,
  ],
})
export class UsersModule {}
