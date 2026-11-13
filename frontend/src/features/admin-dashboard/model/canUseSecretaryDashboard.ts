import { hasCapability } from "@/shared/security/access";

/** Secretariat dashboard uses only data scoped by existing dashboard capabilities. */
export function canUseSecretaryDashboard(
  permissionCodes: readonly string[] | null | undefined,
) {
  return (
    hasCapability(permissionCodes, "erp.dashboard.read") &&
    hasCapability(permissionCodes, "padron.application.review") &&
    hasCapability(permissionCodes, "governance.assembly.session")
  );
}
