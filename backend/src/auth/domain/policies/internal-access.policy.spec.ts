import { canAccessErp } from './internal-access.policy';

describe('canAccessErp', () => {
  const validAffiliate = {
    userStatus: 'ACTIVE',
    userRoleName: 'Vecino/Afiliado',
    userRoleIsActive: true,
    hasPerson: true,
    affiliateStatus: 'ACTIVE',
  };

  const administrator = {
    userStatus: 'ACTIVE',
    userRoleName: 'Administrador',
    userRoleIsActive: true,
    hasPerson: false,
    affiliateStatus: null,
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
        userRoleName: 'Subscription_L1',
      }),
    ).toBe(false);
  });

  it('denies a treasurer without an affiliate', () => {
    expect(
      canAccessErp({
        ...validAffiliate,
        userRoleName: 'Tesorero',
        hasPerson: false,
        affiliateStatus: null,
      }),
    ).toBe(false);
  });

  it('allows a treasurer with an active affiliate', () => {
    expect(
      canAccessErp({
        ...validAffiliate,
        userRoleName: 'Tesorero',
      }),
    ).toBe(true);
  });

  it('allows a Vecino/Afiliado with an active affiliate', () => {
    expect(canAccessErp(validAffiliate)).toBe(true);
  });

  it('does not use null or different affiliate legacy roles as ERP authority', () => {
    expect(
      canAccessErp({
        ...validAffiliate,
        affiliateRoleId: null,
      }),
    ).toBe(true);
    expect(
      canAccessErp({
        ...validAffiliate,
        affiliateRoleId: 999,
      }),
    ).toBe(true);
  });

  it.each([
    [
      'general account without affiliate',
      {
        userRoleName: 'Subscription_L1',
        hasPerson: false,
        affiliateStatus: null,
      },
    ],
    ['inactive affiliate', { affiliateStatus: 'INACTIVE' }],
    ['inactive role', { userRoleIsActive: false }],
    ['inactive user', { userStatus: 'INACTIVE' }],
    [
      'inconsistent Subscription_L1 affiliate',
      { userRoleName: 'Subscription_L1' },
    ],
  ])('denies %s', (_label, overrides) => {
    expect(canAccessErp({ ...validAffiliate, ...overrides })).toBe(false);
  });
});
