import { hasCapability } from "@/shared/security/access";

export function canUseOperatorDashboard(
  permissionCodes: readonly string[] | null | undefined,
) {
  return hasCapability(permissionCodes, "erp.dashboard.read");
}
