import { CAPABILITIES } from '../../presentation/capabilities/capability-policy';
import {
  CANONICAL_ROLE_GRANTS,
  validateCanonicalRoleGrants,
} from './canonical-role-grants';

describe('canonical RBAC V2 grants', () => {
  it('contains the reviewed 111 grants, known codes, and zero community grants', () => {
    validateCanonicalRoleGrants();
    const grants = Object.values(CANONICAL_ROLE_GRANTS).flat();
    expect(grants).toHaveLength(111);
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
});
