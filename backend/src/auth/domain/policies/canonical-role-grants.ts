import {
  isKnownCapability,
  type Capability,
} from '../../presentation/capabilities/capability-policy';
import {
  CANONICAL_ROLE_CODES,
  type CanonicalRoleCode,
} from './canonical-role-catalog';

export const CANONICAL_ROLE_GRANT_COUNTS: Readonly<Record<CanonicalRoleCode, number>> = {
  ROLE_INSTITUTIONAL_PRESIDENT: 16,
  ROLE_INSTITUTIONAL_SECRETARY: 24,
  ROLE_INSTITUTIONAL_TREASURER: 26,
  ROLE_INSTITUTIONAL_OPERATOR: 12,
  ROLE_SYSTEM_ADMIN: 29,
  ROLE_COMMUNITY_USER: 0,
};

/**
 * Versioned RBAC V2 assignment contract. Entries come from the reviewed
 * 107-row OpenSpec matrix; controller mappings remain independently exact.
 */
export const CANONICAL_ROLE_GRANTS: Readonly<Record<CanonicalRoleCode, readonly Capability[]>> = {
  ROLE_INSTITUTIONAL_PRESIDENT: [
    'document.restricted.read', 'donations.approval', 'erp.dashboard.read',
    'events.proposal.approve', 'events.proposal.create', 'finance.expense.request',
    'finance.report.dinadeco', 'governance.agreement.manage', 'governance.assembly.create',
    'governance.assembly.session', 'governance.minute.sign', 'inventory.decommission',
    'padron.affiliate.read', 'padron.application.review', 'padron.sanction.apply', 'usr.profile.read',
  ],
  ROLE_INSTITUTIONAL_SECRETARY: [
    'directory.enterprise.review', 'document.official.manage', 'document.restricted.read',
    'erp.dashboard.read', 'events.proposal.create', 'events.proposal.review', 'events.publish',
    'finance.expense.request', 'finance.report.dinadeco', 'governance.agreement.manage',
    'governance.assembly.create', 'governance.assembly.session', 'governance.attendance.scan',
    'governance.minute.sign', 'governance.minute.write', 'padron.affiliate.read',
    'padron.affiliate.status', 'padron.affiliate.update', 'padron.application.approve',
    'padron.application.review', 'padron.sanction.apply', 'usr.profile.read',
    'volunteer.campaign.manage', 'volunteer.hours.certify',
  ],
  ROLE_INSTITUTIONAL_TREASURER: [
    'donations.inkind.register', 'donations.monetary.register', 'donations.receipt.emit',
    'don.donations.cancel', 'don.donations.create', 'don.donations.read', 'don.donations.update',
    'erp.dashboard.read', 'finance.cxc.generate', 'finance.expense.approve',
    'finance.expense.request', 'finance.ledger.reverse', 'finance.ledger.write',
    'finance.payment.verify', 'finance.period.lock', 'finance.receipt.emit', 'finance.reconcile',
    'finance.report.dinadeco', 'fin.charges.read', 'fin.dinadeco.read',
    'fin.movements.create', 'fin.movements.read', 'fin.payments.record',
    'inventory.decommission', 'maintenance.funds.approve', 'usr.profile.read',
  ],
  ROLE_INSTITUTIONAL_OPERATOR: [
    'bookings.handover', 'bookings.manage', 'directory.stall.assign', 'erp.dashboard.read',
    'events.proposal.create', 'finance.expense.request', 'inventory.decommission',
    'inventory.item.manage', 'inventory.loan.manage', 'inv.inventory.read',
    'maintenance.order.manage', 'usr.profile.read',
  ],
  ROLE_SYSTEM_ADMIN: [
    'adm.affiliates.read', 'adm.assemblies.read', 'adm.institutional-board.read',
    'adm.institutional-profile.read', 'adm.justifications.read', 'adm.requests.read',
    'aud.logs.read', 'don.donations.read', 'ent.ventures.read', 'erp.dashboard.read',
    'fin.charges.read', 'fin.dinadeco.read', 'fin.movements.read', 'inv.inventory.read',
    'res.reservations.read', 'system.audit.read', 'system.identity.manage',
    'system.maintenance.operate', 'system.rbac.manage', 'usr.profile.read',
    'usr.roles.read', 'usr.user-requests.read', 'usr.user-requests.review',
    'usr.users.lifecycle.manage', 'usr.users.read', 'usr.users.role.change',
    'usr.users.unlock', 'usr.users.update', 'vol.opportunities.read',
  ],
  ROLE_COMMUNITY_USER: [],
};

export function validateCanonicalRoleGrants(): void {
  if (Object.keys(CANONICAL_ROLE_GRANTS).length !== CANONICAL_ROLE_CODES.length) {
    throw new Error('Canonical RBAC role set is incomplete.');
  }
  for (const role of CANONICAL_ROLE_CODES) {
    const grants = CANONICAL_ROLE_GRANTS[role];
    if (new Set(grants).size !== grants.length) throw new Error(`Duplicate grant for ${role}.`);
    if (!grants.every(isKnownCapability)) throw new Error(`Unknown grant for ${role}.`);
    if (grants.length !== CANONICAL_ROLE_GRANT_COUNTS[role]) {
      throw new Error(`Unexpected grant count for ${role}.`);
    }
  }
  if (CANONICAL_ROLE_GRANTS.ROLE_COMMUNITY_USER.length !== 0) {
    throw new Error('Community role must not receive ERP grants.');
  }
}
