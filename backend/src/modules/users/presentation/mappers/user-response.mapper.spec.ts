process.env.MAX_LOGIN_ATTEMPTS = '3';
process.env.ACCOUNT_LOCKOUT_MINUTES = '15';

import { UserStatus } from '../../domain/entities/user';
import { toUserResponse } from './user-response.mapper';

const domainUser = {
  id: 2,
  fullName: 'Persona Usuaria',
  identification: '2-2222',
  email: 'persona@example.com',
  phone: null,
  address: null,
  status: UserStatus.ACTIVE,
  lockedAt: null,
  roleId: 2,
  role: { id: 2, name: 'Tesorero', description: null, isActive: true },
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
});
