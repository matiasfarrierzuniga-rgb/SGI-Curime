import { canAccessErp } from './internal-access.policy';

describe('canAccessErp', () => {
  const activeUser = {
    userStatus: 'ACTIVE',
    userRoleName: 'ROLE_SYSTEM_ADMIN',
    userRoleIsActive: true,
    hasPerson: false,
    affiliateStatus: null,
  };

  it.each([
    'ROLE_SYSTEM_ADMIN',
    'ROLE_INSTITUTIONAL_PRESIDENT',
    'ROLE_INSTITUTIONAL_SECRETARY',
    'ROLE_INSTITUTIONAL_TREASURER',
    'ROLE_INSTITUTIONAL_OPERATOR',
  ])('admits an active canonical ERP role %s', (userRoleName) => {
    expect(canAccessErp({ ...activeUser, userRoleName })).toBe(true);
  });

  it.each([
    'Administrador',
    'Tesorero',
    'Gestor de Inventario',
    'Vecino/Afiliado',
    'Miembro de Junta Directiva',
    'Subscription_L1',
    'Cuenta comunitaria',
    'ROLE_COMMUNITY_USER',
    'UNRECOGNIZED_ROLE',
  ])('rejects legacy or non-ERP role %s even with active affiliation', (userRoleName) => {
    expect(
      canAccessErp({
        ...activeUser,
        userRoleName,
        hasPerson: true,
        affiliateStatus: 'ACTIVE',
      }),
    ).toBe(false);
  });

  it.each([
    { userStatus: 'INACTIVE' },
    { userStatus: 'BLOCKED' },
    { userStatus: 'PENDING_EMAIL_VERIFICATION' },
    { userRoleIsActive: false },
  ])('denies an ineligible user or inactive role: %j', (overrides) => {
    expect(canAccessErp({ ...activeUser, ...overrides })).toBe(false);
  });

  it('does not require Person or Affiliate membership for ERP roles', () => {
    expect(
      canAccessErp({
        ...activeUser,
        hasPerson: false,
        affiliateStatus: null,
      }),
    ).toBe(true);
  });

  it('never treats affiliation or affiliate role identifiers as ERP authority', () => {
    expect(
      canAccessErp({
        ...activeUser,
        userRoleName: 'Vecino/Afiliado',
        hasPerson: true,
        affiliateStatus: 'ACTIVE',
      }),
    ).toBe(false);
  });
});
