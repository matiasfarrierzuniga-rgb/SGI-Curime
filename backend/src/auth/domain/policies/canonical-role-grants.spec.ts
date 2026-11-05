import { CAPABILITIES } from '../../presentation/capabilities/capability-policy';
import {
  CANONICAL_ROLE_GRANTS,
  validateCanonicalRoleGrants,
} from './canonical-role-grants';

describe('canonical RBAC V2 grants', () => {
  it('contains the reviewed 107 grants, known codes, and zero community grants', () => {
    validateCanonicalRoleGrants();
    const grants = Object.values(CANONICAL_ROLE_GRANTS).flat();
    expect(grants).toHaveLength(107);
    expect(grants.every((grant) => CAPABILITIES.includes(grant))).toBe(true);
    expect(CANONICAL_ROLE_GRANTS.ROLE_COMMUNITY_USER).toEqual([]);
  });
});
