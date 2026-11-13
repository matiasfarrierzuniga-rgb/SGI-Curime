import type { AccountAccess } from "../model/users.types";

export function accountStatusBadgeVariant(access: AccountAccess): "warning" | "accountActive" | "accountInactive" | "accountPending" {
  if (access.isBlocked) return "warning";
  if (access.status === "ACTIVE") return "accountActive";
  if (access.status === "PENDING_EMAIL_VERIFICATION") return "accountPending";
  return "accountInactive";
}

export function statusLabel(u: AccountAccess) {
  return u.isTemporarilyLocked
    ? "Bloqueo temporal"
    : u.isAdministrativelyBlocked
      ? "Bloqueado administrativo"
      : u.status === "ACTIVE"
        ? "Activo"
        : u.status === "PENDING_EMAIL_VERIFICATION"
          ? "Correo pendiente de verificación"
          : "Inactivo";
}
