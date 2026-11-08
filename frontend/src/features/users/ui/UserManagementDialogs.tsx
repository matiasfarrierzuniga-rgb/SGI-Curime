import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import type { RoleOption, User, UserUpdate } from "../model/users.types";

type ManagementAction = "edit" | "role" | "activate" | "deactivate" | "unlock";

interface UserManagementDialogsProps {
  action: ManagementAction | null;
  user: User | null;
  roles: RoleOption[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onUpdate: (payload: UserUpdate) => void;
  onChangeRole: (roleId: number) => void;
  onLifecycle: (action: "activate" | "deactivate" | "unlock") => void;
}

function DialogError({ error }: { error: string | null }) {
  return error ? <p id="account-dialog-error" className="rounded-control border border-status-error-border bg-status-error-surface px-3 py-2 text-body-small font-medium text-status-error-foreground" role="alert">{error}</p> : null;
}

export function UserManagementDialogs({ action, user, roles, busy, error, onClose, onUpdate, onChangeRole, onLifecycle }: UserManagementDialogsProps) {
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    setRoleId(user?.access ? String(user.access.roleId) : "");
  }, [user]);

  if (!action || !user?.access) return null;

  const name = user.fullName || "Persona sin nombre registrado";
  const account = user.access.email;
  const closeWhenIdle = (open: boolean) => { if (!open && !busy) onClose(); };

  if (action === "edit") {
    const submit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      onUpdate({ email: String(data.get("email") ?? "").trim() });
    };

    return <Dialog open onOpenChange={closeWhenIdle}><DialogContent size="sm"><form onSubmit={submit} className="grid gap-6"><DialogHeader className="pr-8"><DialogTitle>Editar acceso de cuenta</DialogTitle><DialogDescription>Actualice correo de acceso SGI de {name}. Datos personales pertenecen al expediente de Persona y no se modifican desde esta cuenta.</DialogDescription></DialogHeader><div className="rounded-control border border-border-subtle bg-surface-muted px-3 py-2 text-body-small text-text-secondary"><span className="font-semibold text-text-primary">Cuenta actual: </span>{account}</div><Field className="gap-2"><FieldLabel htmlFor="account-email">Correo de cuenta SGI</FieldLabel><FieldDescription>Se usa para iniciar sesión y recibir comunicaciones de acceso.</FieldDescription><Input id="account-email" name="email" type="email" required autoComplete="email" defaultValue={account} aria-describedby={error ? "account-dialog-error" : undefined} aria-invalid={Boolean(error)} /></Field><DialogError error={error} /><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" loading={busy}>Guardar cambios</Button></DialogFooter></form></DialogContent></Dialog>;
  }

  if (action === "role") {
    return <Dialog open onOpenChange={closeWhenIdle}><DialogContent size="sm"><form onSubmit={(event) => { event.preventDefault(); onChangeRole(Number(roleId)); }} className="grid gap-6"><DialogHeader className="pr-8"><DialogTitle>Cambiar rol de cuenta</DialogTitle><DialogDescription>Modifique el rol asignado a la cuenta SGI de {name}. No cambia datos de Persona, afiliación ni nombramientos.</DialogDescription></DialogHeader><Field className="gap-2"><FieldLabel htmlFor="account-role">Nuevo rol de cuenta</FieldLabel><FieldDescription>Rol actual: {user.access.role.label}.</FieldDescription><Select id="account-role" value={roleId} onChange={(event) => setRoleId(event.target.value)} required aria-describedby={error ? "account-dialog-error" : undefined} aria-invalid={Boolean(error)}><option value="" disabled>Seleccione un rol</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</Select></Field><DialogError error={error} /><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" loading={busy} disabled={!roleId}>Guardar rol</Button></DialogFooter></form></DialogContent></Dialog>;
  }

  const content = action === "activate" ? { title: "Activar cuenta SGI", description: `Activará acceso a cuenta SGI ${account} para ${name}.`, label: "Activar cuenta", danger: false } : action === "deactivate" ? { title: "Desactivar cuenta SGI", description: `Desactivará acceso a cuenta SGI ${account} para ${name}.`, label: "Desactivar cuenta", danger: true } : { title: "Desbloquear cuenta SGI", description: `Desbloqueará acceso temporalmente bloqueado de cuenta SGI ${account}.`, label: "Desbloquear cuenta", danger: false };

  return <Dialog open onOpenChange={closeWhenIdle}><DialogContent size="sm"><div className="grid gap-6"><DialogHeader className="pr-8"><DialogTitle>{content.title}</DialogTitle><DialogDescription>{content.description} Cambia estado de acceso de cuenta; no modifica Persona ni afiliación.</DialogDescription></DialogHeader><DialogError error={error} /><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="button" variant={content.danger ? "danger" : "primary"} loading={busy} onClick={() => onLifecycle(action)}>{content.label}</Button></DialogFooter></div></DialogContent></Dialog>;
}
