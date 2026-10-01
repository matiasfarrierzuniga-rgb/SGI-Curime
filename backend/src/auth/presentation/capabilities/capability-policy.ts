export const DONATION_CAPABILITIES = {
  read: 'don.donations.read',
  create: 'don.donations.create',
  update: 'don.donations.update',
  cancel: 'don.donations.cancel',
  delete: 'don.donations.delete',
} as const;

export const VENTURE_CAPABILITIES = {
  read: 'ent.ventures.read',
  create: 'ent.ventures.create',
  update: 'ent.ventures.update',
} as const;

export const VOLUNTEER_OPPORTUNITY_CAPABILITIES = {
  read: 'vol.opportunities.read',
  create: 'vol.opportunities.create',
  update: 'vol.opportunities.update',
} as const;

export const CAPABILITIES = [
  'erp.dashboard.read',
  'usr.users.read',
  'usr.users.update',
  'usr.users.role.change',
  'usr.users.lifecycle.manage',
  'usr.users.unlock',
  'usr.roles.read',
  'usr.profile.read',
  'adm.affiliates.read',
  'adm.requests.read',
  'adm.assemblies.read',
  'adm.assemblies.manage',
  'adm.justifications.read',
  'adm.justifications.approve',
  'adm.justifications.reject',
  'adm.institutional-profile.read',
  'adm.institutional-profile.update',
  'adm.institutional-board.read',
  'adm.institutional-board.manage',
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
  DONATION_CAPABILITIES.read,
  DONATION_CAPABILITIES.create,
  DONATION_CAPABILITIES.update,
  DONATION_CAPABILITIES.cancel,
  DONATION_CAPABILITIES.delete,
  VENTURE_CAPABILITIES.read,
  VENTURE_CAPABILITIES.create,
  VENTURE_CAPABILITIES.update,
  VOLUNTEER_OPPORTUNITY_CAPABILITIES.read,
  VOLUNTEER_OPPORTUNITY_CAPABILITIES.create,
  VOLUNTEER_OPPORTUNITY_CAPABILITIES.update,
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export function isKnownCapability(capability: string): capability is Capability {
  return CAPABILITIES.includes(capability as Capability);
}

const ROLE_ADMIN = 'Administrador';
const ROLE_INVENTORY_MANAGER = 'Gestor de Inventario';
const ROLE_TREASURER = 'Tesorero';

export const ROLE_CAPABILITIES: Readonly<
  Record<string, readonly Capability[]>
> = {
  [ROLE_ADMIN]: CAPABILITIES,
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
    DONATION_CAPABILITIES.read,
    DONATION_CAPABILITIES.create,
    DONATION_CAPABILITIES.update,
    DONATION_CAPABILITIES.cancel,
  ],
};

export function hasCapability(
  role: string | undefined,
  capability: string,
): boolean {
  return (
    isKnownCapability(capability) &&
    role !== undefined &&
    ROLE_CAPABILITIES[role]?.includes(capability as Capability) === true
  );
}

/**
 * Runtime authorization source. ROLE_CAPABILITIES/hasCapability remain only
 * as seed and equivalence-reference data during the RBAC cutover.
 */
export function hasPersistedCapability(
  permissionCodes: readonly string[] | undefined,
  capability: string,
): boolean {
  return (
    isKnownCapability(capability) &&
    Array.isArray(permissionCodes) &&
    permissionCodes.includes(capability)
  );
}
