import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import type { User } from "../model/users.types";
import { statusLabel } from "../model/userStatus";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingState } from "@/shared/ui/LoadingState";

interface UserDetailsModalProps {
  selected: User | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}

export function UserDetailsModal({
  selected,
  loading,
  error,
  onRetry,
  onClose,
}: UserDetailsModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{selected ? `Persona: ${selected.fullName || "Sin nombre registrado"}` : "Detalle de persona"}</DialogTitle>
          <DialogDescription>Identidad, cuenta SGI y afiliación se muestran como registros independientes y de solo lectura.</DialogDescription>
        </DialogHeader>
        {loading ? <LoadingState label="Cargando detalle de la persona…" /> : error ? (
          <ErrorState message={error} action={<Button type="button" variant="outline" onClick={onRetry}>Reintentar</Button>} />
        ) : selected ? <dl className="grid grid-cols-1 gap-4 text-body-small sm:grid-cols-2">
          <div className="min-w-0 rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Identificación</dt>
            <dd className="mt-1 break-words font-medium text-text-primary">{selected.identification || "Sin identificación registrada"}</dd>
          </div>
          <div className="min-w-0 rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Teléfono de persona</dt>
            <dd className="mt-1 break-words font-medium text-text-primary">
            {selected.phoneCountryCode && selected.phoneNationalNumber
              ? `${selected.phoneCountryCode} ${selected.phoneNationalNumber}`
              : "—"}
            </dd>
          </div>
          <div className="min-w-0 rounded-control bg-surface-muted p-3 sm:col-span-2">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Dirección de persona</dt>
            <dd className="mt-1 break-words font-medium text-text-primary">{selected.address || "—"}</dd>
          </div>
          <div className="rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Correo de contacto personal</dt>
            <dd className="mt-1 break-all font-medium text-text-primary">{selected.person.contactEmail || "Sin correo de contacto"}</dd>
          </div>
          <div className="min-w-0 rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Cuenta SGI</dt>
            <dd className="mt-1">{selected.access ? <div className="grid gap-1"><Badge variant={selected.access.isBlocked ? "warning" : selected.access.status === "ACTIVE" ? "success" : "neutral"}>{statusLabel(selected.access)}</Badge><span className="break-all font-medium text-text-primary">{selected.access.email}</span><span className="text-text-secondary">Rol: {selected.access.role.name}</span></div> : <span className="font-medium text-text-primary">No existe cuenta SGI</span>}</dd>
          </div>
          <div className="min-w-0 rounded-control bg-surface-muted p-3">
            <dt className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Afiliación</dt>
            <dd className="mt-1 font-medium text-text-primary">{selected.affiliate ? selected.affiliate.status === "ACTIVE" ? "Afiliación activa" : "Afiliación inactiva" : "No afiliada"}</dd>
          </div>
        </dl> : null}
        <DialogFooter><p className="mr-auto text-body-small text-text-secondary">Solo consulta. No hay acciones de escritura disponibles.</p><Button type="button" variant="outline" onClick={onClose}>Cerrar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
