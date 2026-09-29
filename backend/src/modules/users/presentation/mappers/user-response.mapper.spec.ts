process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

import { UserStatus } from '../../domain/entities/user';
import { toAdminUserResponse, toUserResponse } from './user-response.mapper';

const domainUser = {
  id: 2,
  fullName: 'Persona Usuaria',
  identification: '222222222',
  identificationType: 'NATIONAL' as const,
  email: 'persona@example.com',
  phoneCountryCode: null,
  phoneNationalNumber: null,
  phone: null,
  address: null,
  status: UserStatus.ACTIVE,
  subscriptionExpirationDate: null,
  lockedAt: null,
  roleId: 2,
  role: { id: 2, name: 'Tesorero', description: null, isActive: true },
  personId: null,
  affiliateId: null,
  person: null,
  affiliate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('user-response.mapper', () => {
  it('marks a plain active user as not blocked', () => {
    const response = toUserResponse(domainUser);

    expect(response.isBlocked).toBe(false);
    expect(response.isTemporarilyLocked).toBe(false);
    expect(response.isAdministrativelyBlocked).toBe(false);
  });

  it('marks a blocked user as administratively blocked', () => {
    const response = toUserResponse({
      ...domainUser,
      status: UserStatus.BLOCKED,
    });

    expect(response.isBlocked).toBe(true);
    expect(response.isAdministrativelyBlocked).toBe(true);
  });

  it('marks a user with an active temporary lock', () => {
    const response = toUserResponse({
      ...domainUser,
      lockedAt: new Date(),
    });

    expect(response.isBlocked).toBe(true);
    expect(response.isTemporarilyLocked).toBe(true);
  });

  it('separates canonical Person contact from linked User access email', () => {
    const response = toAdminUserResponse({
      id: '12',
      fullName: 'Persona Usuaria',
      identification: '222222222',
      identificationType: 'NATIONAL',
      contactEmail: 'person@example.com',
      phoneCountryCode: null,
      phoneNationalNumber: null,
      address: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      access: { ...domainUser, email: 'access@example.com' },
      affiliate: { id: '22', status: 'ACTIVE', legacyRoleId: 4 },
    });

    expect(response).toMatchObject({
      person: { id: '12', contactEmail: 'person@example.com' },
      access: {
        id: 2,
        email: 'access@example.com',
        status: 'ACTIVE',
        role: { id: 2, name: 'Tesorero' },
      },
      affiliate: { id: '22', status: 'ACTIVE', legacyRoleId: 4 },
    });
    expect(response).not.toHaveProperty('email');
  });

  it('returns person-only rows without account affordances or sensitive fields', () => {
    const response = toAdminUserResponse({
      id: '12',
      fullName: 'Solo Persona',
      identification: '222222222',
      identificationType: 'NATIONAL',
      contactEmail: 'person@example.com',
      phoneCountryCode: null,
      phoneNationalNumber: null,
      address: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      access: null,
      affiliate: null,
    });

    expect(response.person).toEqual({
      id: '12',
      contactEmail: 'person@example.com',
    });
    expect(response.access).toBeNull();
    expect(response.affiliate).toBeNull();
    expect(response).not.toHaveProperty('passwordHash');
    expect(response).not.toHaveProperty('failedLoginAttempts');
  });
});
