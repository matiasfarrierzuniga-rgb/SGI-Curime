export { AuthModule } from './auth.module';
export { Roles } from './presentation/decorators/roles.decorator';
export { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
export { RolesGuard } from './presentation/guards/roles.guard';
export type { AuthenticatedUser } from './domain/entities/auth-user';
export {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
  lockoutCutoff,
} from './domain/policies/account-lockout.policy';
