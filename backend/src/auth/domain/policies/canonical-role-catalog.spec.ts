import {
  CANONICAL_ROLES,
  CANONICAL_ROLE_CODES,
  getCanonicalRoleLabel,
  isCanonicalRoleCode,
} from './canonical-role-catalog';

describe('canonical role catalog', () => {
  it('defines exactly six unique codes with friendly labels', () => {
    expect(CANONICAL_ROLES).toHaveLength(6);
    expect(new Set(CANONICAL_ROLE_CODES).size).toBe(6);
    expect(new Set(CANONICAL_ROLES.map((role) => role.label)).size).toBe(6);

    for (const role of CANONICAL_ROLES) {
      expect(isCanonicalRoleCode(role.code)).toBe(true);
      expect(getCanonicalRoleLabel(role.code)).toBe(role.label);
      expect(role.label).not.toBe(role.code);
    }
  });

  it('does not accept legacy role names', () => {
    expect(isCanonicalRoleCode('Administrador')).toBe(false);
    expect(isCanonicalRoleCode('Tesorero')).toBe(false);
    expect(isCanonicalRoleCode('Subscription_L1')).toBe(false);
  });
});
