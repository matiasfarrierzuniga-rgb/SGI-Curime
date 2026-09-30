import { useEffect, useRef, useState } from "react";
import { Eye, MoreHorizontal, Pencil, ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";
import type { User } from "../model/users.types";
import { statusLabel } from "../model/userStatus";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/shared/ui/DataTable";

type ManagementAction = "edit" | "role" | "activate" | "deactivate" | "unlock";

interface UsersTableProps {
  users: User[];
  onOpen: (personId: string) => void;
  onManage: (user: User, action: ManagementAction) => void;
}

interface UserActionsCellProps {
  user: User;
  menuOpen: boolean;
  menuTriggerRef: (node: HTMLButtonElement | null) => void;
  onOpen: () => void;
  onManage: (action: ManagementAction) => void;
  onToggleMenu: () => void;
}

function UserActionsCell({ user, menuOpen, menuTriggerRef, onOpen, onManage, onToggleMenu }: UserActionsCellProps) {
  const name = user.fullName || "persona sin nombre registrado";
  const access = user.access;
  const canView = user.actions.read;
  const canEdit = access !== null && user.actions.update;
  const roleAction = access !== null && user.actions.changeRole ? { label: "Cambiar rol", action: "role" as const, icon: ShieldCheck } : null;
  const lifecycleAction = access === null || !user.actions.manageLifecycle
    ? null
    : access.status === "INACTIVE"
      ? { label: "Activar cuenta", action: "activate" as const, icon: UserRoundCheck }
      : access.status === "ACTIVE"
        ? { label: "Desactivar cuenta", action: "deactivate" as const, icon: UserRoundX }
        : null;
  const unlockAction = access !== null && user.actions.unlock && access.isTemporarilyLocked
    ? { label: "Desbloquear cuenta", action: "unlock" as const, icon: ShieldCheck }
    : null;
  const hasAccountOperations = Boolean(canEdit || roleAction || lifecycleAction || unlockAction);

  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      <Button variant="outline" size="sm" type="button" title={`Ver detalle de ${name}`} disabled={!canView} onClick={onOpen}>
        <Eye aria-hidden="true" />Ver detalle
      </Button>
      <Button
        className="hidden lg:inline-flex"
        variant="ghost"
        size="sm"
        type="button"
        title={canEdit ? `Editar perfil de cuenta de ${name}` : "No hay cuenta SGI editable para esta persona"}
        disabled={!canEdit}
        onClick={() => onManage("edit")}
      >
        <Pencil aria-hidden="true" />Editar
      </Button>
      <div className="relative">
        <Button ref={menuTriggerRef} variant="ghost" size="icon-sm" type="button" title="Más acciones de cuenta" aria-label={`Más acciones para ${name}`} aria-expanded={menuOpen} aria-haspopup="menu" onClick={onToggleMenu}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
        {menuOpen ? (
          <div className="absolute right-0 z-10 mt-2 grid min-w-52 gap-1 rounded-control border border-border bg-surface p-1.5 text-left shadow-overlay" role="menu" aria-label={`Acciones de cuenta para ${name}`}>
            <p className="px-2 py-1 text-caption font-semibold uppercase tracking-wide text-text-secondary">Cuenta SGI</p>
            {canEdit ? <Button className="justify-start lg:hidden" variant="ghost" size="sm" type="button" role="menuitem" onClick={() => onManage("edit")}><Pencil aria-hidden="true" />Editar</Button> : null}
            {roleAction ? <Button className="justify-start" variant="ghost" size="sm" type="button" role="menuitem" onClick={() => onManage(roleAction.action)}><roleAction.icon aria-hidden="true" />{roleAction.label}</Button> : null}
            {lifecycleAction || unlockAction ? <><div className="my-1 border-t border-border-subtle" role="separator" /><p className="px-2 py-1 text-caption font-semibold uppercase tracking-wide text-text-secondary">Acceso y ciclo de vida</p>{lifecycleAction ? <Button className="justify-start" variant={lifecycleAction.action === "deactivate" ? "danger" : "ghost"} size="sm" type="button" role="menuitem" onClick={() => onManage(lifecycleAction.action)}><lifecycleAction.icon aria-hidden="true" />{lifecycleAction.label}</Button> : null}{unlockAction ? <Button className="justify-start" variant="ghost" size="sm" type="button" role="menuitem" onClick={() => onManage(unlockAction.action)}><unlockAction.icon aria-hidden="true" />{unlockAction.label}</Button> : null}</> : null}
            {!hasAccountOperations ? <p className="px-2 py-2 text-body-small text-text-secondary">No hay acciones de cuenta disponibles para esta persona.</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function UsersTable({ users, onOpen, onManage }: UsersTableProps) {
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!menuFor) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const activeMenu = menuFor;
      setMenuFor(null);
      menuTriggerRefs.current[activeMenu]?.focus();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuFor]);

  return (
    <DataTable className="min-w-[980px]" scrollLabel="En pantallas estrechas, desplaza horizontalmente para ver más columnas de usuarios">
      <DataTableHeader>
        <DataTableRow className="hover:bg-surface-muted">
          <DataTableHead>Persona</DataTableHead>
          <DataTableHead>Contacto personal</DataTableHead>
          <DataTableHead>Cuenta SGI</DataTableHead>
          <DataTableHead>Rol de cuenta</DataTableHead>
          <DataTableHead>Afiliación</DataTableHead>
          <DataTableHead className="w-56 whitespace-nowrap text-right">Acciones</DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
        {users.map((user) => (
          <DataTableRow key={user.id}>
            <DataTableCell className="min-w-48 font-semibold text-text-primary">{user.fullName || "Persona sin nombre registrado"}</DataTableCell>
            <DataTableCell className="w-56 max-w-56 overflow-hidden text-ellipsis whitespace-nowrap text-text-secondary">{user.person.contactEmail || "Sin correo de contacto"}</DataTableCell>
            <DataTableCell className="w-56 max-w-56">
              {user.access ? <div className="grid gap-1"><Badge variant={user.access.isBlocked ? "warning" : user.access.status === "ACTIVE" ? "success" : "neutral"}>{statusLabel(user.access)}</Badge><span className="overflow-hidden text-ellipsis whitespace-nowrap text-caption text-text-secondary">{user.access.email}</span></div> : <span className="text-text-secondary">Sin cuenta SGI</span>}
            </DataTableCell>
            <DataTableCell className="whitespace-nowrap">{user.access?.role.name || "Sin rol de cuenta"}</DataTableCell>
            <DataTableCell><Badge variant={user.affiliate?.status === "ACTIVE" ? "success" : "neutral"}>{user.affiliate ? user.affiliate.status === "ACTIVE" ? "Afiliación activa" : "Afiliación inactiva" : "Sin afiliación"}</Badge></DataTableCell>
            <DataTableCell className="text-right">
              <UserActionsCell
                user={user}
                menuOpen={menuFor === user.id}
                menuTriggerRef={(node) => { menuTriggerRefs.current[user.id] = node; }}
                onOpen={() => onOpen(user.personId)}
                onManage={(action) => { setMenuFor(null); onManage(user, action); }}
                onToggleMenu={() => setMenuFor(menuFor === user.id ? null : user.id)}
              />
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
