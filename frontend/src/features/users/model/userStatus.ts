import type { AccountAccess } from "../model/users.types";

export function statusLabel(u: AccountAccess) {
  if (u.isTemporarilyLocked) return "Bloqueada temporalmente";
  if (u.isAdministrativelyBlocked) return "Bloqueado administrativo";
  if (u.status === "ACTIVE") return "Activo";
  if (u.status === "INACTIVE") return "Pendiente de activación";
  if (u.status === "BLOCKED") return "Bloqueada";
  return "Sin cuenta SGI";
}