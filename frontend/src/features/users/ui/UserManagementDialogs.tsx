import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Field, FieldLabel } from "@/shared/ui/field";
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

export function UserManagementDialogs({ action, user, roles, busy, error, onClose, onUpdate, onChangeRole, onLifecycle }: UserManagementDialogsProps) {
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    setRoleId(user?.access ? String(user.access.roleId) : "");
  }, [user]);

  if (!action || !user?.access) return null;
  const name = user.fullName || "Persona sin nombre registrado";
  const account = user.access.email;

  if (action === "edit") {
    const submit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      onUpdate({
        fullName: String(data.get("fullName") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        phoneCountryCode: String(data.get("phoneCountryCode") ?? "").trim() || undefined,
        phoneNationalNumber: String(data.get("phoneNationalNumber") ?? "").trim() || undefined,
        address: String(data.get("address") ?? "").trim() || undefined,
      });
    };
    return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent size="lg"><form onSubmit={submit} className="grid gap-6"><DialogHeader className="pr-8"><DialogTitle>Editar perfil de cuenta</DialogTitle><DialogDescription>Actualice datos del perfil y acceso de cuenta SGI de {name}. La identificación de persona no se modifica desde este formulario.</DialogDescription></DialogHeader><div className="grid gap-5 sm:grid-cols-2"><Field className="gap-2 sm:col-span-2"><FieldLabel htmlFor="account-full-name">Nombre completo</FieldLabel><Input id="account-full-name" name="fullName" required defaultValue={user.fullName ?? ""} /></Field><Field className="gap-2 sm:col-span-2"><FieldLabel htmlFor="account-email">Correo de cuenta SGI</FieldLabel><Input id="account-email" name="email" type="email" required defaultValue={account} /></Field><Field className="gap-2"><FieldLabel htmlFor="account-country-code">Código de país</FieldLabel><Input id="account-country-code" name="phoneCountryCode" defaultValue={user.phoneCountryCode ?? ""} /></Field><Field className="gap-2"><FieldLabel htmlFor="account-phone">Número de teléfono</FieldLabel><Input id="account-phone" name="phoneNationalNumber" defaultValue={user.phoneNationalNumber ?? ""} /></Field><Field className="gap-2 sm:col-span-2"><FieldLabel htmlFor="account-address">Dirección</FieldLabel><Input id="account-address" name="address" defaultValue={user.address ?? ""} /></Field></div>{error ? <p className="rounded-control border border-status-error-border bg-status-error-surface px-3 py-2 text-body-small font-medium text-status-error-foreground" role="alert">{error}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" loading={busy}>Guardar cambios</Button></DialogFooter></form></DialogContent></Dialog>;
  }

  if (action === "role") {
    return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent><form onSubmit={(event) => { event.preventDefault(); onChangeRole(Number(roleId)); }} className="grid gap-6"><DialogHeader className="pr-8"><DialogTitle>Cambiar rol de cuenta</DialogTitle><DialogDescription>Modifique rol asignado a cuenta SGI {account}. Rol actual: {user.access.role.name}.</DialogDescription></DialogHeader><Field className="gap-2"><FieldLabel htmlFor="account-role">Nuevo rol de cuenta</FieldLabel><Select id="account-role" value={roleId} onChange={(event) => setRoleId(event.target.value)} required><option value="" disabled>Seleccione un rol</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></Field>{error ? <p className="rounded-control border border-status-error-border bg-status-error-surface px-3 py-2 text-body-small font-medium text-status-error-foreground" role="alert">{error}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" loading={busy} disabled={!roleId}>Guardar rol</Button></DialogFooter></form></DialogContent></Dialog>;
  }

  const content = action === "activate"
    ? { title: "Activar cuenta SGI", description: `Activará acceso a cuenta SGI ${account} para ${name}.`, label: "Activar cuenta", danger: false }
    : action === "deactivate"
      ? { title: "Desactivar cuenta SGI", description: `Desactivará acceso a cuenta SGI ${account} para ${name}.`, label: "Desactivar cuenta", danger: true }
      : { title: "Desbloquear cuenta SGI", description: `Desbloqueará acceso temporalmente bloqueado de cuenta SGI ${account}.`, label: "Desbloquear cuenta", danger: false };
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent size="sm"><div className="grid gap-6"><DialogHeader className="pr-8"><DialogTitle>{content.title}</DialogTitle><DialogDescription>{content.description} Cambia estado de acceso de cuenta; no modifica persona ni afiliación.</DialogDescription></DialogHeader>{error ? <p className="rounded-control border border-status-error-border bg-status-error-surface px-3 py-2 text-body-small font-medium text-status-error-foreground" role="alert">{error}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="button" variant={content.danger ? "danger" : "primary"} loading={busy} onClick={() => onLifecycle(action)}>{content.label}</Button></DialogFooter></div></DialogContent></Dialog>;
}
