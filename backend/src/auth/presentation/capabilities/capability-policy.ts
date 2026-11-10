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
  publish: 'ent.ventures.publish',
} as const;

export const VOLUNTEER_OPPORTUNITY_CAPABILITIES = {
  read: 'vol.opportunities.read',
  create: 'vol.opportunities.create',
  update: 'vol.opportunities.update',
} as const;

export const LEGACY_CAPABILITIES = [
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
  VENTURE_CAPABILITIES.publish,
  VOLUNTEER_OPPORTUNITY_CAPABILITIES.read,
  VOLUNTEER_OPPORTUNITY_CAPABILITIES.create,
  VOLUNTEER_OPPORTUNITY_CAPABILITIES.update,
] as const;

/**
 * Approved RBAC V2 identifiers discovered in the persisted V2 contract.
 * They are recognized by runtime policy but receive no seed grants here.
 * Endpoint mappings remain explicit; a catalog entry never grants access.
 */
export const RBAC_V2_CAPABILITIES = [
  'bookings.handover',
  'bookings.manage',
  'directory.enterprise.review',
  'directory.stall.assign',
  'document.official.manage',
  'document.restricted.read',
  'donations.approval',
  'donations.inkind.register',
  'donations.monetary.register',
  'donations.receipt.emit',
  'events.proposal.approve',
  'events.proposal.create',
  'events.proposal.review',
  'events.publish',
  'finance.cxc.generate',
  'finance.expense.approve',
  'finance.expense.request',
  'finance.ledger.reverse',
  'finance.ledger.write',
  'finance.payment.verify',
  'finance.period.lock',
  'finance.receipt.emit',
  'finance.reconcile',
  'finance.report.dinadeco',
  'governance.agreement.manage',
  'governance.assembly.create',
  'governance.assembly.session',
  'governance.attendance.scan',
  'governance.minute.sign',
  'governance.minute.write',
  'inventory.decommission',
  'inventory.item.manage',
  'inventory.loan.manage',
  'maintenance.funds.approve',
  'maintenance.order.manage',
  'padron.affiliate.read',
  'padron.affiliate.status',
  'padron.affiliate.update',
  'padron.application.approve',
  'padron.application.review',
  'padron.sanction.apply',
  'system.audit.read',
  'system.identity.manage',
  'system.maintenance.operate',
  'system.rbac.manage',
  'volunteer.campaign.manage',
  'volunteer.hours.certify',
] as const;

export const CAPABILITIES = [
  ...LEGACY_CAPABILITIES,
  ...RBAC_V2_CAPABILITIES,
  // Request access is recognized but has no default role grant.
  'don.requests.read',
  'don.requests.review',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export function isKnownCapability(
  capability: string,
): capability is Capability {
  return CAPABILITIES.includes(capability as Capability);
}

/** Runtime authorization source. Role labels never grant capabilities. */
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
