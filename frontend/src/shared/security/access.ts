import { ROLE_ADMIN } from './roles'

// Frontend checks project route and UX access; backend enforcement remains authoritative.
export const ACCESS_CAPABILITIES = [
  'usr.users.read',
  'usr.roles.read',
  'usr.profile.read',
  'adm.affiliates.read',
  'adm.requests.read',
] as const

export type AccessCapability = (typeof ACCESS_CAPABILITIES)[number]

export const ACCESS_ROLE_CAPABILITIES: Readonly<Record<string, readonly AccessCapability[]>> = {
  [ROLE_ADMIN]: ACCESS_CAPABILITIES,
}

export function hasCapability(
  role: string | null | undefined,
  capability: string,
): boolean {
  return role !== null && role !== undefined &&
    ACCESS_ROLE_CAPABILITIES[role]?.includes(capability as AccessCapability) === true
}

export function hasAuthenticatedSessionCapability(capability: string): boolean {
  return capability === 'usr.profile.read'
}
