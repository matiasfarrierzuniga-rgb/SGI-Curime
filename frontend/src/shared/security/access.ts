import {
  getRoleName,
  ROLE_ADMIN,
  ROLE_INVENTORY_MANAGER,
  ROLE_TREASURER,
  type RoleLike,
} from './roles'

// Frontend checks project route and UX access;
// backend enforcement remains authoritative.

export const ACCESS_CAPABILITIES = [
  'erp.dashboard.read',
  'usr.users.read',
  'usr.roles.read',
  'usr.profile.read',
  'adm.affiliates.read',
  'adm.requests.read',
  'adm.assemblies.read',
  'adm.assemblies.manage',
  'adm.justifications.read',
  'abs.justifications.read',
  'aud.logs.read',
  'inv.inventory.read',
  'pub.events.manage',
  'pub.events.publish',
  'res.reservations.read',
  'res.reservations.approve',
  'res.reservations.reject',
  'res.reservations.cancel',
  'fin.charges.read',
  'fin.payments.record',
  'fin.movements.read',
  'fin.movements.create',
  'fin.dinadeco.read',
  'don.donations.read',
  'don.donations.create',
  'don.donations.update',
  'don.donations.cancel',
  'don.donations.delete',
] as const

export type AccessCapability =
  (typeof ACCESS_CAPABILITIES)[number]

export const ACCESS_ROLE_CAPABILITIES: Readonly<
  Record<string, readonly AccessCapability[]>
> = {
  [ROLE_ADMIN]: ACCESS_CAPABILITIES,

  [ROLE_INVENTORY_MANAGER]: [
    'erp.dashboard.read',
    'usr.profile.read',
    'inv.inventory.read',
  ],

  [ROLE_TREASURER]: [
    'fin.charges.read',
    'fin.payments.record',
    'fin.movements.read',
    'fin.movements.create',
    'fin.dinadeco.read',
    'don.donations.read',
    'don.donations.create',
    'don.donations.update',
    'don.donations.cancel',
  ],

  'Vecino/Afiliado': [
    'erp.dashboard.read',
    'usr.profile.read',
    'abs.justifications.read',
  ],
}
export function hasCapability(
  role: RoleLike,
  capability: string,
): boolean {
  const roleName = getRoleName(role)

  if (!roleName) {
    return false
  }

  return (
    ACCESS_ROLE_CAPABILITIES[roleName]?.includes(
      capability as AccessCapability,
    ) === true
  )
}
