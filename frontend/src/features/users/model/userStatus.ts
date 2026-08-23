import type { User } from "../model/users.types";
export function statusLabel(u: User) {
  return u.isTemporarilyLocked
    ? "Bloqueo temporal"
    : u.isAdministrativelyBlocked
      ? "Bloqueado administrativo"
      : u.status === "ACTIVE"
        ? "Activo"
        : "Inactivo";
}
