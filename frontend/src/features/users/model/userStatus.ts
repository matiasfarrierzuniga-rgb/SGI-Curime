import type { AccountAccess } from "../model/users.types";
export function statusLabel(u: AccountAccess) {
  return u.isTemporarilyLocked
    ? "Bloqueo temporal"
    : u.isAdministrativelyBlocked
      ? "Bloqueado administrativo"
      : u.status === "ACTIVE"
        ? "Activo"
        : "Inactivo";
}
