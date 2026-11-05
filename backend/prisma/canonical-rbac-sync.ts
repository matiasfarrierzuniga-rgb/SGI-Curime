import { CANONICAL_ROLE_CODES } from '../src/auth/domain/policies/canonical-role-catalog';
import {
  CANONICAL_ROLE_GRANTS,
  validateCanonicalRoleGrants,
} from '../src/auth/domain/policies/canonical-role-grants';

export type PersistedRbacRole = {
  id: number;
  name: string;
  isActive: boolean;
  permissionCodes: readonly string[];
};

export type CanonicalRbacSyncPlan = {
  missingRoles: readonly string[];
  inactiveCanonicalRoles: readonly string[];
  historicalActiveRoles: readonly string[];
  permissionsToEnsure: readonly string[];
  grantsToCreate: readonly { role: string; capability: string }[];
  unexpectedGrants: readonly { role: string; capability: string }[];
};

/** Pure inspection. Callers must present this plan for approval before apply. */
export function inspectCanonicalRbac(
  persistedRoles: readonly PersistedRbacRole[],
): CanonicalRbacSyncPlan {
  validateCanonicalRoleGrants();
  const byName = new Map(persistedRoles.map((role) => [role.name, role]));
  const missingRoles = CANONICAL_ROLE_CODES.filter((name) => !byName.has(name));
  const inactiveCanonicalRoles = CANONICAL_ROLE_CODES.filter(
    (name) => byName.has(name) && !byName.get(name)!.isActive,
  );
  const historicalActiveRoles = persistedRoles
    .filter((role) => !CANONICAL_ROLE_CODES.includes(role.name as never) && role.isActive)
    .map((role) => role.name);
  const permissionsToEnsure = [...new Set(Object.values(CANONICAL_ROLE_GRANTS).flat())].sort();
  const grantsToCreate: { role: string; capability: string }[] = [];
  const unexpectedGrants: { role: string; capability: string }[] = [];

  for (const role of CANONICAL_ROLE_CODES) {
    const expected: Set<string> = new Set(CANONICAL_ROLE_GRANTS[role]);
    const current = new Set(byName.get(role)?.permissionCodes ?? []);
    for (const capability of expected) {
      if (!current.has(capability)) grantsToCreate.push({ role, capability });
    }
    for (const capability of current) {
      if (!expected.has(capability)) unexpectedGrants.push({ role, capability });
    }
  }
  return {
    missingRoles,
    inactiveCanonicalRoles,
    historicalActiveRoles,
    permissionsToEnsure,
    grantsToCreate,
    unexpectedGrants,
  };
}

export type CanonicalRbacWriter = {
  ensurePermission(code: string): Promise<void>;
  ensureRolePermission(roleName: string, permissionCode: string): Promise<void>;
};

/** Controlled application. Deliberately additive: it never deletes historical data. */
export async function applyCanonicalRbacPlan(
  writer: CanonicalRbacWriter,
  plan: CanonicalRbacSyncPlan,
): Promise<void> {
  if (plan.missingRoles.length || plan.inactiveCanonicalRoles.length) {
    throw new Error('Canonical roles must exist and be active before grant synchronization.');
  }
  for (const permission of plan.permissionsToEnsure) await writer.ensurePermission(permission);
  for (const grant of plan.grantsToCreate) {
    await writer.ensureRolePermission(grant.role, grant.capability);
  }
}
