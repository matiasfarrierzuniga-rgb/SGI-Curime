export const CAPABILITIES = [
  'erp.dashboard.read',
  'usr.users.read',
  'usr.roles.read',
  'usr.profile.read',
  'adm.affiliates.read',
  'adm.requests.read',
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
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const ROLE_ADMIN = 'Administrador';
const ROLE_INVENTORY_MANAGER = 'Gestor de Inventario';
const ROLE_TREASURER = 'Tesorero';

export const ROLE_CAPABILITIES: Readonly<Record<string, readonly Capability[]>> = {
  [ROLE_ADMIN]: CAPABILITIES,
  [ROLE_INVENTORY_MANAGER]: [
    'erp.dashboard.read',
    'usr.profile.read',
    'inv.inventory.read',
  ],
  [ROLE_TREASURER]: ['fin.charges.read', 'fin.payments.record'],
};

export function hasCapability(role: string | undefined, capability: string): boolean {
  return (
    CAPABILITIES.includes(capability as Capability) &&
    role !== undefined &&
    ROLE_CAPABILITIES[role]?.includes(capability as Capability) === true
  );
}
