import {
  CAPABILITIES,
  CAPABILITY_CATALOG,
  type Capability,
} from './capabilities';
import {
  LEGACY_ROLE_NAMES,
  ROLE_NAMES,
  type LegacyRoleName,
  type RoleName,
} from './roles';

/** Capabilities available to every recognized authenticated account. */
export const UNIVERSAL_AUTHENTICATED_CAPABILITIES = [
  CAPABILITIES.PROFILE_READ,
] as const satisfies readonly Capability[];

type TransitionalRoleName = RoleName | LegacyRoleName;

export const ROLE_CAPABILITIES = {
  [ROLE_NAMES.ADMIN]: CAPABILITY_CATALOG,
  [ROLE_NAMES.TREASURER]: UNIVERSAL_AUTHENTICATED_CAPABILITIES,
  [ROLE_NAMES.INVENTORY_MANAGER]: [
    ...UNIVERSAL_AUTHENTICATED_CAPABILITIES,
    CAPABILITIES.ERP_DASHBOARD_READ,
    CAPABILITIES.INVENTORY_READ,
    CAPABILITIES.INVENTORY_MANAGE,
  ],
  [ROLE_NAMES.USER]: UNIVERSAL_AUTHENTICATED_CAPABILITIES,
  [LEGACY_ROLE_NAMES.COMMUNITY_MEMBER]: UNIVERSAL_AUTHENTICATED_CAPABILITIES,
} as const satisfies Readonly<
  Record<TransitionalRoleName, readonly Capability[]>
>;

const NO_CAPABILITIES: readonly Capability[] = Object.freeze([]);

/** Unknown roles are denied by default. */
export function resolveCapabilitiesForRole(
  role: string | null | undefined,
): readonly Capability[] {
  if (role === null || role === undefined) return NO_CAPABILITIES;

  return (
    (ROLE_CAPABILITIES as Readonly<Record<string, readonly Capability[]>>)[
      role
    ] ?? NO_CAPABILITIES
  );
}
