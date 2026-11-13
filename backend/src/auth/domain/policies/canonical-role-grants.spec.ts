import { CAPABILITIES } from '../../presentation/capabilities/capability-policy';
import {
  CANONICAL_ROLE_GRANTS,
  CANONICAL_ROLE_GRANT_COUNTS,
  validateCanonicalRoleGrants,
} from './canonical-role-grants';

const RESERVATION_DECISION_CAPABILITIES = [
  'res.reservations.approve',
  'res.reservations.reject',
  'res.reservations.cancel',
] as const;

const UNCHANGED_ROLE_GRANTS = {
  ROLE_INSTITUTIONAL_PRESIDENT: [
    'document.restricted.read',
    'donations.approval',
    'erp.dashboard.read',
    'events.proposal.approve',
    'events.proposal.create',
    'finance.expense.request',
    'finance.report.dinadeco',
    'governance.agreement.manage',
    'governance.assembly.create',
    'governance.assembly.session',
    'governance.minute.sign',
    'inventory.decommission',
    'padron.affiliate.read',
    'padron.application.review',
    'padron.sanction.apply',
    'usr.profile.read',
  ],
  ROLE_INSTITUTIONAL_SECRETARY: [
    'directory.enterprise.review',
    'document.official.manage',
    'document.restricted.read',
    'erp.dashboard.read',
    'events.proposal.create',
    'events.proposal.review',
    'events.publish',
    'finance.expense.request',
    'finance.report.dinadeco',
    'adm.institutional-board.read',
    'adm.institutional-board.manage',
    'governance.agreement.manage',
    'governance.assembly.create',
    'governance.assembly.session',
    'governance.attendance.scan',
    'governance.minute.sign',
    'governance.minute.write',
    'padron.affiliate.read',
    'padron.affiliate.status',
    'padron.affiliate.update',
    'padron.application.approve',
    'padron.application.review',
    'padron.sanction.apply',
    'usr.profile.read',
    'volunteer.campaign.manage',
    'volunteer.hours.certify',
  ],
  ROLE_INSTITUTIONAL_TREASURER: [
    'donations.inkind.register',
    'donations.monetary.register',
    'donations.receipt.emit',
    'don.donations.cancel',
    'don.donations.create',
    'don.donations.read',
    'don.donations.update',
    'don.requests.read',
    'don.requests.review',
    'erp.dashboard.read',
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
    'fin.charges.read',
    'fin.dinadeco.read',
    'fin.movements.create',
    'fin.movements.read',
    'fin.payments.record',
    'inventory.decommission',
    'maintenance.funds.approve',
    'usr.profile.read',
  ],
  ROLE_SYSTEM_ADMIN: [
    'adm.affiliates.read',
    'adm.assemblies.read',
    'adm.institutional-board.read',
    'adm.institutional-profile.read',
    'adm.justifications.read',
    'adm.requests.read',
    'aud.logs.read',
    'don.donations.read',
    'don.requests.read',
    'don.requests.review',
    'ent.ventures.read',
    'erp.dashboard.read',
    'fin.charges.read',
    'fin.dinadeco.read',
    'fin.movements.read',
    'inv.inventory.read',
    'res.reservations.read',
    'system.audit.read',
    'system.identity.manage',
    'system.maintenance.operate',
    'system.rbac.manage',
    'usr.profile.read',
    'usr.roles.read',
    'usr.users.lifecycle.manage',
    'usr.users.read',
    'usr.users.role.change',
    'usr.users.unlock',
    'usr.users.update',
    'vol.opportunities.read',
  ],
  ROLE_COMMUNITY_USER: [],
} as const;

describe('canonical RBAC V2 grants', () => {
  it('contains the reviewed 115 grants, known codes, and zero community grants', () => {
    validateCanonicalRoleGrants();
    const grants = Object.values(CANONICAL_ROLE_GRANTS).flat();
    expect(grants).toHaveLength(115);
    expect(grants.every((grant) => CAPABILITIES.includes(grant))).toBe(true);
    expect(CANONICAL_ROLE_GRANTS.ROLE_COMMUNITY_USER).toEqual([]);
    for (const [role, roleGrants] of Object.entries(CANONICAL_ROLE_GRANTS)) {
      for (const capability of ['don.requests.read', 'don.requests.review']) {
        expect(roleGrants.includes(capability as never)).toBe(
          role === 'ROLE_SYSTEM_ADMIN' || role === 'ROLE_INSTITUTIONAL_TREASURER',
        );
      }
    }
  });

  it('keeps the canonical grant counts per role', () => {
    expect(CANONICAL_ROLE_GRANT_COUNTS).toEqual({
      ROLE_INSTITUTIONAL_PRESIDENT: 16,
      ROLE_INSTITUTIONAL_SECRETARY: 26,
      ROLE_INSTITUTIONAL_TREASURER: 28,
      ROLE_INSTITUTIONAL_OPERATOR: 16,
      ROLE_SYSTEM_ADMIN: 29,
      ROLE_COMMUNITY_USER: 0,
    });
  });

  it('grants the institutional operator reservation consultation and decisions', () => {
    const operator = CANONICAL_ROLE_GRANTS.ROLE_INSTITUTIONAL_OPERATOR;
    expect(operator).toContain('res.reservations.read');
    expect(operator).toContain('res.reservations.approve');
    expect(operator).toContain('res.reservations.reject');
    expect(operator).toContain('res.reservations.cancel');
    expect(operator).toHaveLength(16);
  });

  it('keeps the system administrator read-only for reservations', () => {
    const administrator = CANONICAL_ROLE_GRANTS.ROLE_SYSTEM_ADMIN;
    expect(administrator).toContain('res.reservations.read');
    for (const capability of RESERVATION_DECISION_CAPABILITIES) {
      expect(administrator.includes(capability)).toBe(false);
    }
  });

  it('keeps every role except the institutional operator unchanged', () => {
    for (const [role, expected] of Object.entries(UNCHANGED_ROLE_GRANTS)) {
      expect([...CANONICAL_ROLE_GRANTS[role as keyof typeof CANONICAL_ROLE_GRANTS]]).toEqual([
        ...expected,
      ]);
    }
  });

  it('adds only already-known reservation codes to the canonical assignment', () => {
    const uniqueCapabilities = new Set(
      Object.values(CANONICAL_ROLE_GRANTS).flat(),
    );
    expect(uniqueCapabilities.size).toBe(81);
    expect(
      CAPABILITIES.filter((capability) =>
        capability.startsWith('res.reservations.'),
      ),
    ).toEqual([
      'res.reservations.read',
      'res.reservations.approve',
      'res.reservations.reject',
      'res.reservations.cancel',
    ]);
    for (const capability of RESERVATION_DECISION_CAPABILITIES) {
      expect(CAPABILITIES).toContain(capability);
    }
  });

  it('does not grant financial or donation capabilities to the institutional operator', () => {
    const operator = CANONICAL_ROLE_GRANTS.ROLE_INSTITUTIONAL_OPERATOR;
    expect(
      operator.filter((capability) =>
        ['fin.', 'don.', 'finance.'].some((prefix) =>
          capability.startsWith(prefix),
        ),
      ),
    ).toEqual(['finance.expense.request']);
  });
});
