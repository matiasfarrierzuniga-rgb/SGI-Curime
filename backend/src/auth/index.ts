export { AuthModule } from './auth.module';
export { Roles } from './presentation/decorators/roles.decorator';
export { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
export { CapabilityGuard } from './presentation/guards/capability.guard';
export {
  CAPABILITIES,
  ROLE_CAPABILITIES,
  hasCapability,
  type Capability,
} from './presentation/capabilities/capability-policy';
export { RequireCapabilities } from './presentation/decorators/require-capabilities.decorator';
export { RolesGuard } from './presentation/guards/roles.guard';
export type { AuthenticatedUser } from './domain/entities/auth-user';
export {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
  lockoutCutoff,
} from './domain/policies/account-lockout.policy';
