import { canAccessErp } from './internal-access.policy';

describe('canAccessErp', () => {
  const valid = {
    userStatus: 'ACTIVE',
    userRoleId: 2,
    userRoleName: 'Vecino/Afiliado',
    userRoleIsActive: true,
    hasPerson: true,
    affiliateStatus: 'ACTIVE',
    affiliateRoleId: 2,
  };

  it('allows only a fully consistent active affiliate', () => {
    expect(canAccessErp(valid)).toBe(true);
  });

  it.each([
    ['general account without affiliate', { userRoleId: 1, userRoleName: 'Subscription_L1', hasPerson: false, affiliateStatus: null, affiliateRoleId: null }],
    ['inactive affiliate', { affiliateStatus: 'INACTIVE' }],
    ['historical affiliate without role', { affiliateRoleId: null }],
    ['role mismatch', { userRoleId: 3 }],
    ['inactive role', { userRoleIsActive: false }],
    ['inactive user', { userStatus: 'INACTIVE' }],
    ['inconsistent Subscription_L1 affiliate', { userRoleId: 1, userRoleName: 'Subscription_L1', affiliateRoleId: 1 }],
  ])('denies %s', (_label, overrides) => {
    expect(canAccessErp({ ...valid, ...overrides })).toBe(false);
  });
});
