import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import type { User } from "../model/users.types";
import { statusLabel } from "../model/userStatus";

export type UsersDialogMode =
  | "edit"
  | "role"
  | "activate"
  | "deactivate"
  | "unlock"
  | null;

interface UserDetailsModalProps {
  selected: User;
  busy: boolean;
  onClose: () => void;
  onMode: (mode: Exclude<UsersDialogMode, null>) => void;
}

export function UserDetailsModal({
  selected,
  busy,
  onClose,
  onMode,
}: UserDetailsModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent size="lg" showCloseButton={!busy}>
        <DialogHeader><DialogTitle>Usuario: {selected.fullName}</DialogTitle><DialogDescription>Revise la información y seleccione una acción para esta cuenta.</DialogDescription></DialogHeader>
        <dl className="grid grid-cols-1 gap-4 text-body-small sm:grid-cols-2">
          <div className="min-w-0 rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Identificación</dt>
            <dd className="mt-1 break-words font-medium text-text-primary">{selected.identification}</dd>
          </div>
          <div className="min-w-0 rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Teléfono</dt>
            <dd className="mt-1 break-words font-medium text-text-primary">
            {selected.phoneCountryCode && selected.phoneNationalNumber
              ? `${selected.phoneCountryCode} ${selected.phoneNationalNumber}`
              : selected.phone || "—"}
            </dd>
          </div>
          <div className="min-w-0 rounded-control bg-surface-muted p-3 sm:col-span-2">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Dirección</dt>
            <dd className="mt-1 break-words font-medium text-text-primary">{selected.address || "—"}</dd>
          </div>
          <div className="rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Cuenta</dt>
            <dd className="mt-1"><Badge variant={selected.isBlocked ? "warning" : selected.status === "ACTIVE" ? "success" : "neutral"}>{statusLabel(selected)}</Badge></dd>
          </div>
          <div className="rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Creado</dt>
            <dd className="mt-1 font-medium text-text-primary">{new Date(selected.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
        <DialogFooter className="sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onMode("edit")} disabled={busy}>Editar datos</Button>
            <Button type="button" variant="outline" onClick={() => onMode("role")} disabled={busy}>Cambiar rol</Button>
          </div>
          <div className="flex flex-wrap gap-2">
          {selected.status !== "ACTIVE" && !selected.isAdministrativelyBlocked && (
            <Button type="button" variant="primary" onClick={() => onMode("activate")} disabled={busy}>Activar</Button>
          )}
          {selected.status !== "INACTIVE" && (
          <Button type="button" variant="destructive" onClick={() => onMode("deactivate")} disabled={busy}>
            Inactivar
          </Button>
        )}
        {selected.isTemporarilyLocked && (
          <Button type="button" variant="outline" onClick={() => onMode("unlock")} disabled={busy}>Desbloquear</Button>
        )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
