import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { AuditAction } from '../src/audit/audit-actions';
import {
  CANONICAL_ROLE_CODES,
  SYSTEM_ADMIN_ROLE,
} from '../src/auth/domain/policies/canonical-role-catalog';
import {
  applyCanonicalRbacPlan,
  inspectCanonicalRbac,
} from './canonical-rbac-sync';
import { INITIAL_ROLES } from './seed-roles';

const BCRYPT_ROUNDS = 12;

export type MinimalBootstrapAdmin = {
  fullName: string;
  identification: string;
  email: string;
  password: string;
};

export type MinimalBootstrapResult = {
  administrator: 'CREATED' | 'UNCHANGED';
  roles: number;
  grants: number;
};

type BootstrapTransaction = {
  role: {
    upsert(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<
      Array<{
        id: number;
        name: string;
        isActive: boolean;
        permissions: Array<{ permission: { code: string } }>;
      }>
    >;
    findUniqueOrThrow(args: unknown): Promise<{ id: number }>;
  };
  permission: {
    upsert(args: unknown): Promise<unknown>;
    findUniqueOrThrow(args: unknown): Promise<{ id: number }>;
  };
  rolePermission: {
    upsert(args: unknown): Promise<unknown>;
    count(args?: unknown): Promise<number>;
  };
  user: {
    findMany(args: unknown): Promise<
      Array<{
        id: number;
        email: string;
        identification: string | null;
        passwordHash: string | null;
        status: string;
        role: { name: string; isActive: boolean };
      }>
    >;
    count(args: unknown): Promise<number>;
    create(args: unknown): Promise<{ id: number }>;
  };
  auditLog: { create(args: unknown): Promise<unknown> };
};

export type MinimalBootstrapClient = {
  $transaction<T>(
    operation: (transaction: BootstrapTransaction) => Promise<T>,
    options: { isolationLevel: Prisma.TransactionIsolationLevel },
  ): Promise<T>;
};

export async function runMinimalBootstrap(
  client: MinimalBootstrapClient,
  rawAdmin: MinimalBootstrapAdmin,
): Promise<MinimalBootstrapResult> {
  const admin = validateMinimalBootstrapAdmin(rawAdmin);
  const candidateHash = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);

  return client.$transaction(
    async (tx) => {
      for (const role of INITIAL_ROLES) {
        await tx.role.upsert({
          where: { name: role.name },
          update: {},
          create: role,
        });
      }

      const persistedRoles = await tx.role.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          permissions: {
            select: { permission: { select: { code: true } } },
          },
        },
      });
      const plan = inspectCanonicalRbac(
        persistedRoles.map((role) => ({
          id: role.id,
          name: role.name,
          isActive: role.isActive,
          permissionCodes: role.permissions.map(
            ({ permission }) => permission.code,
          ),
        })),
      );

      if (plan.historicalActiveRoles.length > 0) {
        throw new Error('BOOTSTRAP_REQUIRES_CLEAN_ROLE_CATALOG');
      }
      if (plan.unexpectedGrants.length > 0) {
        throw new Error('BOOTSTRAP_REJECTED_UNEXPECTED_GRANTS');
      }

      await applyCanonicalRbacPlan(
        {
          ensurePermission: async (code) => {
            await tx.permission.upsert({
              where: { code },
              update: {},
              create: { code, name: code },
            });
          },
          ensureRolePermission: async (roleName, permissionCode) => {
            const [role, permission] = await Promise.all([
              tx.role.findUniqueOrThrow({ where: { name: roleName } }),
              tx.permission.findUniqueOrThrow({
                where: { code: permissionCode },
              }),
            ]);
            await tx.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              },
              update: {},
              create: { roleId: role.id, permissionId: permission.id },
            });
          },
          revokeRolePermission: () =>
            Promise.reject(new Error('BOOTSTRAP_NEVER_REVOKES_GRANTS')),
        },
        plan,
      );

      const administratorRole = await tx.role.findUniqueOrThrow({
        where: { name: SYSTEM_ADMIN_ROLE },
      });
      const candidates = await tx.user.findMany({
        where: {
          OR: [
            { email: { equals: admin.email, mode: 'insensitive' } },
            { identification: admin.identification },
          ],
        },
        select: {
          id: true,
          email: true,
          identification: true,
          passwordHash: true,
          status: true,
          role: { select: { name: true, isActive: true } },
        },
      });
      const administratorCount = await tx.user.count({
        where: { role: { name: SYSTEM_ADMIN_ROLE } },
      });

      if (candidates.length > 0) {
        if (candidates.length !== 1 || administratorCount !== 1) {
          throw new Error('BOOTSTRAP_ADMIN_IDENTITY_CONFLICT');
        }
        const existing = candidates[0];
        const exactIdentity =
          existing.email.trim().toLowerCase() === admin.email &&
          existing.identification === admin.identification;
        const validAccount =
          existing.role.name === SYSTEM_ADMIN_ROLE &&
          existing.role.isActive &&
          existing.status === 'ACTIVE' &&
          Boolean(existing.passwordHash);
        const passwordMatches =
          existing.passwordHash === null
            ? false
            : await bcrypt.compare(admin.password, existing.passwordHash);
        if (!exactIdentity || !validAccount || !passwordMatches) {
          throw new Error('BOOTSTRAP_ADMIN_IDENTITY_CONFLICT');
        }
        return {
          administrator: 'UNCHANGED',
          roles: INITIAL_ROLES.length,
          grants: await tx.rolePermission.count({
            where: { role: { name: { in: CANONICAL_ROLE_CODES } } },
          }),
        };
      }

      if (administratorCount !== 0) {
        throw new Error('BOOTSTRAP_ADMIN_ALREADY_EXISTS');
      }

      const created = await tx.user.create({
        data: {
          fullName: admin.fullName,
          identification: admin.identification,
          email: admin.email,
          passwordHash: candidateHash,
          roleId: administratorRole.id,
          status: 'ACTIVE',
          personId: null,
          subscriptionExpirationDate: null,
        },
        select: { id: true },
      });
      await tx.auditLog.create({
        data: {
          userId: created.id,
          action: AuditAction.USER_CREATED,
          module: 'SYSTEM',
          entityType: 'User',
          entityId: String(created.id),
          details: {
            source: 'MINIMAL_BOOTSTRAP',
            role: SYSTEM_ADMIN_ROLE,
          },
        },
      });

      return {
        administrator: 'CREATED',
        roles: INITIAL_ROLES.length,
        grants: await tx.rolePermission.count({
          where: { role: { name: { in: CANONICAL_ROLE_CODES } } },
        }),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export function validateMinimalBootstrapAdmin(
  input: MinimalBootstrapAdmin,
): MinimalBootstrapAdmin {
  const fullName = normalizeText(input.fullName);
  const identification = input.identification?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!fullName || fullName.length > 200)
    throw new Error('INVALID_ADMIN_FULL_NAME');
  if (!identification || identification.length > 64)
    throw new Error('INVALID_ADMIN_IDENTIFICATION');
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('INVALID_ADMIN_EMAIL');
  if (
    typeof password !== 'string' ||
    password.length < 10 ||
    password.length > 128 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error('INVALID_ADMIN_PASSWORD');
  }
  return { fullName, identification, email, password };
}

function normalizeText(value: string): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}
