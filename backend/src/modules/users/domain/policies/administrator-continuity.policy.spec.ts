import { UserStatus } from '../entities/user';
import { LastAdministratorError } from '../errors/last-administrator.error';
import {
  assertAnotherActiveAdministrator,
  requiresAdminContinuity,
} from './administrator-continuity.policy';

const admin = {
  status: UserStatus.ACTIVE,
  role: { id: 1, name: 'Administrador', description: null, isActive: true },
};

describe('administrator-continuity.policy', () => {
  describe('requiresAdminContinuity', () => {
    it('is required when deactivating the last active administrator', () => {
      expect(requiresAdminContinuity(admin)).toBe(true);
    });

    it('is required when demoting an active administrator to a non-admin role', () => {
      expect(requiresAdminContinuity(admin, 'Tesorero')).toBe(true);
    });

    it('is not required when keeping the administrator role', () => {
      expect(requiresAdminContinuity(admin, 'Administrador')).toBe(false);
    });

    it('is not required for an inactive administrator', () => {
      expect(
        requiresAdminContinuity({ ...admin, status: UserStatus.INACTIVE }),
      ).toBe(false);
    });

    it('is not required for a non-administrator', () => {
      const user = {
        status: UserStatus.ACTIVE,
        role: { id: 2, name: 'Tesorero', description: null, isActive: true },
      };
      expect(requiresAdminContinuity(user)).toBe(false);
    });
  });

  describe('assertAnotherActiveAdministrator', () => {
    it('does not throw when another active administrator exists', () => {
      expect(() => assertAnotherActiveAdministrator(1)).not.toThrow();
    });

    it('throws LastAdministratorError when none remains', () => {
      expect(() => assertAnotherActiveAdministrator(0)).toThrow(
        LastAdministratorError,
      );
    });
  });
});
