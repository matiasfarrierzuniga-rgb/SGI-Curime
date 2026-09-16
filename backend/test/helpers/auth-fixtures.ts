type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

const ROLE_IDS: Record<string, number> = {
  Subscription_L1: 1,
  'Vecino/Afiliado': 2,
  Tesorero: 3,
  'Gestor de Inventario': 4,
  Administrador: 5,
};

type PrismaAuthUserOptions = {
  id?: number;
  fullName?: string;
  email?: string;
  passwordHash?: string;
  status?: UserStatus;
  roleName?: string;
  roleId?: number;
  roleIsActive?: boolean;
  hasPerson?: boolean;
  affiliateStatus?: 'ACTIVE' | 'INACTIVE' | null;
  affiliateRoleId?: number | null;
  lockedAt?: Date | null;
  failedLoginAttempts?: number;
  lastLoginAt?: Date | null;
  subscriptionExpirationDate?: Date | null;
};

export function buildPrismaAuthUser(options: PrismaAuthUserOptions = {}) {
  const roleName = options.roleName ?? 'Administrador';
  const roleId = options.roleId ?? ROLE_IDS[roleName] ?? 99;
  const hasPerson =
    options.hasPerson ??
    (roleName !== 'Administrador' && roleName !== 'Subscription_L1');
  const affiliateStatus =
    options.affiliateStatus === undefined ? 'ACTIVE' : options.affiliateStatus;
  const affiliateRoleId =
    options.affiliateRoleId === undefined ? roleId : options.affiliateRoleId;

  return {
    id: options.id ?? 1,
    fullName: options.fullName ?? 'Usuario E2E',
    email: options.email ?? 'user@example.com',
    passwordHash: options.passwordHash ?? 'unused',
    status: options.status ?? 'ACTIVE',
    roleId,
    role: {
      name: roleName,
      isActive: options.roleIsActive ?? true,
    },
    person: hasPerson
      ? {
          affiliate:
            affiliateStatus === null && affiliateRoleId === null
              ? null
              : { status: affiliateStatus, roleId: affiliateRoleId },
        }
      : null,
    lockedAt: options.lockedAt ?? null,
    failedLoginAttempts: options.failedLoginAttempts ?? 0,
    lastLoginAt: options.lastLoginAt ?? null,
    subscriptionExpirationDate: options.subscriptionExpirationDate ?? null,
  };
}
