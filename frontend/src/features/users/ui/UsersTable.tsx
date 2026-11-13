import { useRef, useState } from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Eye, Link2, MoreHorizontal, Pencil, ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";
import type { User } from "../model/users.types";
import { accountStatusBadgeVariant, statusLabel } from "../model/userStatus";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/shared/ui/DataTable";
import { PersonAvatar } from "@/shared/ui/PersonAvatar";

type ManagementAction = "edit" | "role" | "activate" | "deactivate" | "unlock";

interface UsersTableProps {
  users: User[];
  onOpen: (accountId: string) => void;
  onManage: (user: User, action: ManagementAction) => void;
  onLinkPerson: (user: User) => void;
}

interface UserActionsCellProps {
  user: User;
  menuOpen: boolean;
  onOpen: () => void;
  onManage: (action: ManagementAction) => void;
  onLinkPerson: () => void;
  onMenuOpenChange: (open: boolean) => void;
}

function UserActionsCell({ user, menuOpen, onOpen, onManage, onLinkPerson, onMenuOpenChange }: UserActionsCellProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
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
  const canLinkPerson = access !== null && user.actions.linkPerson;
  const hasAccountOperations = Boolean(canEdit || roleAction || lifecycleAction || unlockAction || canLinkPerson);

  return (
    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
      <Button variant="outline" size="icon-sm" type="button" title={`Ver detalle de ${name}`} aria-label="Ver detalle" disabled={!canView} onClick={onOpen}>
        <Eye aria-hidden="true" />
        <span className="sr-only">Ver detalle</span>
      </Button>
      <Button
        className="hidden xl:inline-flex"
        variant="ghost"
        size="sm"
        type="button"
        title={canEdit ? `Editar perfil de cuenta de ${name}` : "No hay cuenta SGI editable para esta persona"}
        disabled={!canEdit}
        onClick={() => onManage("edit")}
      >
        <Pencil aria-hidden="true" />Editar
      </Button>
      <MenuPrimitive.Root open={menuOpen} onOpenChange={(open) => { onMenuOpenChange(open); if (!open) triggerRef.current?.focus(); }}>
        <MenuPrimitive.Trigger render={<Button ref={triggerRef} variant="ghost" size="icon-sm" type="button" title="Más acciones de cuenta" aria-label={`Más acciones para ${name}`} />}>
          <MoreHorizontal aria-hidden="true" />
        </MenuPrimitive.Trigger>
        <MenuPrimitive.Portal>
          <MenuPrimitive.Positioner side="bottom" align="end" sideOffset={8} className="z-toast">
            <MenuPrimitive.Popup className="grid min-w-56 gap-1 rounded-control border border-border bg-surface p-1.5 text-left shadow-overlay outline-none" aria-label={`Acciones de cuenta para ${name}`}>
              <p className="px-2 py-1 text-caption font-semibold uppercase tracking-wide text-text-secondary">Cuenta SGI</p>
               {canEdit ? <MenuPrimitive.Item className="flex min-h-9 items-center gap-1.5 rounded-control px-3 text-sm font-semibold outline-none data-highlighted:bg-muted xl:hidden" onClick={() => onManage("edit")}><Pencil aria-hidden="true" />Editar</MenuPrimitive.Item> : null}
               {canLinkPerson ? <MenuPrimitive.Item className="flex min-h-9 items-center gap-1.5 rounded-control px-3 text-sm font-semibold outline-none data-highlighted:bg-muted" onClick={onLinkPerson}><Link2 aria-hidden="true" />Vincular Persona</MenuPrimitive.Item> : null}
              {roleAction ? <MenuPrimitive.Item className="flex min-h-9 items-center gap-1.5 rounded-control px-3 text-sm font-semibold outline-none data-highlighted:bg-muted" onClick={() => onManage(roleAction.action)}><roleAction.icon aria-hidden="true" />{roleAction.label}</MenuPrimitive.Item> : null}
              {lifecycleAction || unlockAction ? <><div className="my-1 border-t border-border-subtle" role="separator" /><p className="px-2 py-1 text-caption font-semibold uppercase tracking-wide text-text-secondary">Acceso y ciclo de vida</p>{lifecycleAction ? <MenuPrimitive.Item className={`flex min-h-9 items-center gap-1.5 rounded-control px-3 text-sm font-semibold outline-none data-highlighted:bg-muted ${lifecycleAction.action === "deactivate" ? "text-status-error-foreground data-highlighted:bg-status-error-surface" : ""}`} onClick={() => onManage(lifecycleAction.action)}><lifecycleAction.icon aria-hidden="true" />{lifecycleAction.label}</MenuPrimitive.Item> : null}{unlockAction ? <MenuPrimitive.Item className="flex min-h-9 items-center gap-1.5 rounded-control px-3 text-sm font-semibold outline-none data-highlighted:bg-muted" onClick={() => onManage(unlockAction.action)}><unlockAction.icon aria-hidden="true" />{unlockAction.label}</MenuPrimitive.Item> : null}</> : null}
              {!hasAccountOperations ? <p className="px-2 py-2 text-body-small text-text-secondary">No hay acciones de cuenta disponibles para esta persona.</p> : null}
            </MenuPrimitive.Popup>
          </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
      </MenuPrimitive.Root>
    </div>
  );
}

export function UsersTable({ users, onOpen, onManage, onLinkPerson }: UsersTableProps) {
  const [menuFor, setMenuFor] = useState<string | null>(null);

  return (
    <DataTable className="min-w-[44rem] xl:min-w-[60rem]" scrollLabel="En pantallas estrechas, desplaza horizontalmente para consultar columnas adicionales de usuarios">
      <DataTableHeader>
        <DataTableRow>
          <DataTableHead>Cuenta</DataTableHead>
          <DataTableHead className="hidden xl:table-cell">Vinculación personal</DataTableHead>
          <DataTableHead>Cuenta SGI</DataTableHead>
          <DataTableHead className="hidden lg:table-cell">Rol de cuenta</DataTableHead>
          <DataTableHead className="hidden xl:table-cell">Afiliación</DataTableHead>
          <DataTableHead className="w-24 whitespace-nowrap text-right">Acciones</DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
        {users.map((user) => (
          <DataTableRow key={user.id}>
            <DataTableCell className="min-w-48">
              <div className="flex min-w-0 items-center gap-3">
                <PersonAvatar name={user.fullName} />
                <span className="min-w-0 truncate font-semibold text-text-primary" title={user.fullName || undefined}>{user.fullName || "Cuenta sin nombre registrado"}</span>
              </div>
            </DataTableCell>
            <DataTableCell className="hidden w-56 max-w-56 overflow-hidden text-ellipsis whitespace-nowrap text-text-secondary xl:table-cell">{user.person ? user.person.contactEmail || "Persona vinculada sin correo" : "Sin persona vinculada"}</DataTableCell>
            <DataTableCell className="min-w-48 max-w-56">
              {user.access ? <div className="grid gap-1"><Badge variant={accountStatusBadgeVariant(user.access)}>{statusLabel(user.access)}</Badge><span className="overflow-hidden text-ellipsis whitespace-nowrap text-caption text-text-secondary">{user.access.email}</span></div> : <span className="text-text-secondary">Sin cuenta SGI</span>}
            </DataTableCell>
            <DataTableCell className="hidden whitespace-nowrap lg:table-cell">{user.access?.role.label || "Sin rol de cuenta"}</DataTableCell>
            <DataTableCell className="hidden xl:table-cell"><Badge variant={user.affiliate?.status === "ACTIVE" ? "success" : "neutral"}>{user.affiliate ? user.affiliate.status === "ACTIVE" ? "Afiliación activa" : "Afiliación inactiva" : "Sin afiliación"}</Badge></DataTableCell>
            <DataTableCell className="whitespace-nowrap text-right">
              <UserActionsCell
                user={user}
                menuOpen={menuFor === user.id}
                onOpen={() => onOpen(user.id)}
                onManage={(action) => { setMenuFor(null); onManage(user, action); }}
                onLinkPerson={() => { setMenuFor(null); onLinkPerson(user); }}
                onMenuOpenChange={(open) => setMenuFor(open ? user.id : null)}
              />
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
