export { AuthModule } from './auth.module';
export { Roles } from './presentation/decorators/roles.decorator';
export { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
export { CapabilityGuard } from './presentation/guards/capability.guard';
export { UnsupportedOperationGuard } from './presentation/guards/unsupported-operation.guard';
export {
  CAPABILITIES,
  VENTURE_CAPABILITIES,
  hasPersistedCapability,
  isKnownCapability,
  type Capability,
} from './presentation/capabilities/capability-policy';
export { RequireCapabilities } from './presentation/decorators/require-capabilities.decorator';
export { RequireAnyCapabilities } from './presentation/decorators/require-any-capabilities.decorator';
export { RequireCapabilityByBodyValue } from './presentation/decorators/require-capability-by-body-value.decorator';
export { RolesGuard } from './presentation/guards/roles.guard';
export type { AuthenticatedUser } from './domain/entities/auth-user';
export { canAccessErp } from './domain/policies/internal-access.policy';
export {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
  lockoutCutoff,
} from './domain/policies/account-lockout.policy';
