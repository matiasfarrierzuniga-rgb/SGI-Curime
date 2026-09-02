import { LEGACY_ROLE_NAMES, ROLE_NAMES } from './roleNames'

// Frontend checks project route and UX access; backend enforcement remains authoritative.
export const ACCESS_CAPABILITIES = [
  'erp.dashboard.read',
  'usr.users.read',
  'usr.roles.read',
  'usr.profile.read',
  'adm.affiliates.read',
  'adm.requests.read',
  'aud.logs.read',
  'inv.inventory.read',
] as const

export type AccessCapability = (typeof ACCESS_CAPABILITIES)[number]

const ACCOUNT_CAPABILITIES = ['usr.profile.read'] as const satisfies readonly AccessCapability[]

export const ACCESS_ROLE_CAPABILITIES: Readonly<Record<string, readonly AccessCapability[]>> = {
  [ROLE_NAMES.ADMIN]: ACCESS_CAPABILITIES,
  [ROLE_NAMES.INVENTORY_MANAGER]: ['erp.dashboard.read', 'usr.profile.read', 'inv.inventory.read'],
  [ROLE_NAMES.TREASURER]: ACCOUNT_CAPABILITIES,
  [ROLE_NAMES.USER]: ACCOUNT_CAPABILITIES,
  [LEGACY_ROLE_NAMES.COMMUNITY_MEMBER]: ACCOUNT_CAPABILITIES,
}

const MANAGEMENT_CAPABILITIES: readonly AccessCapability[] = ACCESS_CAPABILITIES.filter(
  (capability) => capability !== 'usr.profile.read',
)

export function hasCapability(role: string | null | undefined, capability: string): boolean {
  return role !== null && role !== undefined && ACCESS_ROLE_CAPABILITIES[role]?.includes(capability as AccessCapability) === true
}

export function hasManagementCapabilities(role: string | null | undefined): boolean {
  return MANAGEMENT_CAPABILITIES.some((capability) => hasCapability(role, capability))
}

export function hasAuthenticatedSessionCapability(capability: string): boolean {
  return capability === 'usr.profile.read'
}
