import { canAccessErp } from './internal-access.policy';

describe('canAccessErp', () => {
  const validAffiliate = {
    userStatus: 'ACTIVE',
    userRoleId: 2,
    userRoleName: 'Vecino/Afiliado',
    userRoleIsActive: true,
    hasPerson: true,
    affiliateStatus: 'ACTIVE',
    affiliateRoleId: 2,
  };

  const administrator = {
    userStatus: 'ACTIVE',
    userRoleId: 1,
    userRoleName: 'Administrador',
    userRoleIsActive: true,
    hasPerson: false,
    affiliateStatus: null,
    affiliateRoleId: null,
  };

  it('allows an active administrator with an active role without a person or affiliate', () => {
    expect(canAccessErp(administrator)).toBe(true);
  });

  it('denies an administrator with an inactive role', () => {
    expect(canAccessErp({ ...administrator, userRoleIsActive: false })).toBe(
      false,
    );
  });

  it('denies an inactive administrator', () => {
    expect(canAccessErp({ ...administrator, userStatus: 'INACTIVE' })).toBe(
      false,
    );
  });

  it('denies Subscription_L1', () => {
    expect(
      canAccessErp({
        ...validAffiliate,
        userRoleId: 1,
        userRoleName: 'Subscription_L1',
        affiliateRoleId: 1,
      }),
    ).toBe(false);
  });

  it('denies a treasurer without an affiliate', () => {
    expect(
      canAccessErp({
        ...validAffiliate,
        userRoleId: 3,
        userRoleName: 'Tesorero',
        hasPerson: false,
        affiliateStatus: null,
        affiliateRoleId: null,
      }),
    ).toBe(false);
  });

  it('allows a treasurer with a consistent active affiliate', () => {
    expect(
      canAccessErp({
        ...validAffiliate,
        userRoleId: 3,
        userRoleName: 'Tesorero',
        affiliateRoleId: 3,
      }),
    ).toBe(true);
  });

  it('allows a Vecino/Afiliado with a consistent active affiliate', () => {
    expect(canAccessErp(validAffiliate)).toBe(true);
  });

  it.each([
    [
      'general account without affiliate',
      {
        userRoleId: 1,
        userRoleName: 'Subscription_L1',
        hasPerson: false,
        affiliateStatus: null,
        affiliateRoleId: null,
      },
    ],
    ['inactive affiliate', { affiliateStatus: 'INACTIVE' }],
    ['historical affiliate without role', { affiliateRoleId: null }],
    ['role mismatch', { userRoleId: 3 }],
    ['inactive role', { userRoleIsActive: false }],
    ['inactive user', { userStatus: 'INACTIVE' }],
    [
      'inconsistent Subscription_L1 affiliate',
      { userRoleId: 1, userRoleName: 'Subscription_L1', affiliateRoleId: 1 },
    ],
  ])('denies %s', (_label, overrides) => {
    expect(canAccessErp({ ...validAffiliate, ...overrides })).toBe(false);
  });
});
