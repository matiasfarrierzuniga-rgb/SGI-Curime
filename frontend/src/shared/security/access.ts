// Frontend checks project route and UX access;
// backend enforcement remains authoritative.

export const ACCESS_CAPABILITIES = [
  'erp.dashboard.read',
  'usr.users.read',
  'usr.user-requests.read',
  'usr.user-requests.review',
  'usr.roles.read',
  'usr.profile.read',
  'adm.affiliates.read',
  'adm.requests.read',
  'adm.assemblies.read',
  'adm.assemblies.manage',
  'adm.institutional-profile.read',
  'adm.institutional-profile.update',
  'adm.institutional-board.read',
  'adm.institutional-board.manage',
  'adm.justifications.read',
  'adm.justifications.approve',
  'adm.justifications.reject',
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
  'ent.ventures.read',
  'ent.ventures.create',
  'ent.ventures.update',
  'vol.opportunities.read',
  'vol.opportunities.create',
  'vol.opportunities.update',
] as const

export type AccessCapability =
  (typeof ACCESS_CAPABILITIES)[number]

export function hasCapability(
  permissionCodes: unknown,
  capability: string,
): boolean {
  return Array.isArray(permissionCodes) && permissionCodes.includes(capability)
}
