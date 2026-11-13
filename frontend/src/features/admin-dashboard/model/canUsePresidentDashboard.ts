import { hasCapability } from "@/shared/security/access";

/** Presidency dashboard is enabled only when its existing data domains are authorized. */
export function canUsePresidentDashboard(
  permissionCodes: readonly string[] | null | undefined,
) {
  return (
    hasCapability(permissionCodes, "erp.dashboard.read") &&
    hasCapability(permissionCodes, "padron.application.review") &&
    hasCapability(permissionCodes, "governance.assembly.session")
  );
}
