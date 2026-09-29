process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

import { UsersController } from './users.controller';

const user = {
  id: 7,
  fullName: 'Persona Usuaria',
  identification: '1-1111-1111',
  identificationType: 'NATIONAL' as const,
  email: 'account@example.com',
  phoneCountryCode: null,
  phoneNationalNumber: null,
  phone: null,
  address: null,
  status: 'ACTIVE' as const,
  subscriptionExpirationDate: null,
  lockedAt: null,
  roleId: 1,
  role: { id: 1, name: 'Administrador', description: null, isActive: true },
  personId: '12',
  affiliateId: '22',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersController F0 response contracts', () => {
  const getUser = { execute: jest.fn(), executeWithAffiliation: jest.fn() };
  const controller = new UsersController(
    { execute: jest.fn() } as never,
    getUser as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns persisted permission codes and scalar identities from GET /users/me', async () => {
    getUser.executeWithAffiliation.mockResolvedValue({
      user,
      affiliation: {
        affiliateId: '22',
        affiliateStatus: 'ACTIVE',
        affiliateRoleId: 4,
        affiliateRequestStatus: null,
        canAccessErp: true,
      },
    });

    await expect(
      controller.me({ user: { id: 7, permissionCodes: ['usr.users.read'] } } as never),
    ).resolves.toMatchObject({
      personId: '12',
      affiliateId: '22',
      permissionCodes: ['usr.users.read'],
    });
  });
});
