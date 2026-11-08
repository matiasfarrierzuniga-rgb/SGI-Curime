import { hasCapability } from "@/shared/security/access";

/**
 * Administrative metrics aggregate institutional data. A dashboard-entry grant
 * alone intentionally renders only the shared ERP shell.
 */
export function canUseAdministrativeDashboard(
  permissionCodes: readonly string[] | null | undefined,
) {
  return (
    hasCapability(permissionCodes, "erp.dashboard.read") &&
    hasCapability(permissionCodes, "adm.affiliates.read")
  );
}
