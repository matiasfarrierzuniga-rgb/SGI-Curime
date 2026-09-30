process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

import { UsersController } from './users.controller';

const user = {
  id: '12',
  fullName: 'Persona Usuaria',
  identification: '1-1111-1111',
  identificationType: 'NATIONAL' as const,
  contactEmail: 'person@example.com',
  phoneCountryCode: null,
  phoneNationalNumber: null,
  address: null,
  access: {
    id: 7,
    fullName: 'Cuenta de Persona',
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
    person: { id: '12', contactEmail: 'person@example.com' },
    affiliate: { id: '22', status: 'ACTIVE' as const, legacyRoleId: 4 },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  affiliate: { id: '22', status: 'ACTIVE' as const, legacyRoleId: 4 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersController F0 response contracts', () => {
  const listUsers = { execute: jest.fn() };
  const getUser = {
    execute: jest.fn(),
    executeAdminPerson: jest.fn(),
    executeWithAffiliation: jest.fn(),
  };
  const controller = new UsersController(
    listUsers as never,
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
      user: user.access,
      affiliation: {
        affiliateId: '22',
        affiliateStatus: 'ACTIVE',
        affiliateRoleId: 4,
        affiliateRequestStatus: null,
        canAccessErp: true,
      },
    });

    await expect(
      controller.me({
        user: { id: 7, permissionCodes: ['usr.users.read'] },
      } as never),
    ).resolves.toMatchObject({
      personId: '12',
      affiliateId: '22',
      permissionCodes: ['usr.users.read'],
    });
  });

  it('adds actor-aware account actions to admin read responses', async () => {
    listUsers.execute.mockResolvedValue({
      data: [user],
      total: 1,
      page: 1,
      limit: 20,
    });

    await expect(
      controller.findAll(
        { page: 1, limit: 20 } as never,
        {
          user: {
            permissionCodes: [
              'usr.users.read',
              'usr.users.update',
              'usr.users.role.change',
              'usr.users.lifecycle.manage',
              'usr.users.unlock',
            ],
          },
        } as never,
      ),
    ).resolves.toMatchObject({
      data: [
        {
          actions: {
            read: true,
            update: true,
            changeRole: true,
            manageLifecycle: true,
            unlock: true,
          },
          id: '12',
          access: { id: 7, email: 'account@example.com', status: 'ACTIVE' },
        },
      ],
    });
  });

  it('returns Person-only detail by Person id with no account mutation actions', async () => {
    getUser.executeAdminPerson.mockResolvedValue({
      ...user,
      id: '19',
      access: null,
      affiliate: null,
    });

    await expect(
      controller.findOne(
        19,
        {
          user: {
            permissionCodes: [
              'usr.users.read',
              'usr.users.update',
              'usr.users.role.change',
              'usr.users.lifecycle.manage',
              'usr.users.unlock',
            ],
          },
        } as never,
      ),
    ).resolves.toMatchObject({
      id: '19',
      person: { id: '19', contactEmail: 'person@example.com' },
      access: null,
      affiliate: null,
      actions: {
        read: true,
        update: false,
        changeRole: false,
        manageLifecycle: false,
        unlock: false,
      },
    });
    expect(getUser.executeAdminPerson).toHaveBeenCalledWith(19);
    expect(getUser.execute).not.toHaveBeenCalled();
  });

  it('fails closed in read action information when persisted grants are absent', async () => {
    listUsers.execute.mockResolvedValue({
      data: [user],
      total: 1,
      page: 1,
      limit: 20,
    });

    await expect(
      controller.findAll(
        { page: 1, limit: 20 } as never,
        { user: { permissionCodes: [] } } as never,
      ),
    ).resolves.toMatchObject({
      data: [
        {
          actions: {
            read: false,
            update: false,
            changeRole: false,
            manageLifecycle: false,
            unlock: false,
          },
        },
      ],
    });
  });
});
