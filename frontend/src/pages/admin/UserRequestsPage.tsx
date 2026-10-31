import { useCallback, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { rolesService } from "@/features/roles";
import { userRequestsService } from "@/features/user-requests";
import type { RequestStatus, UserRequest } from "@/features/user-requests";
import { useAuth } from "@/features/auth";
import type { RoleOption } from "@/features/users";
import { getErrorMessage } from "@/shared/lib/errors";
import { hasCapability } from "@/shared/security/access";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/shared/ui/DataTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { FormField } from "@/shared/ui/FormField";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Modal } from "@/shared/ui/Modal";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Pagination } from "@/shared/ui/Pagination";
import { Select } from "@/shared/ui/select";
import { SearchFilterBar } from "@/shared/ui/SearchFilterBar";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { Textarea } from "@/shared/ui/textarea";
import { useToast } from "@/shared/ui/Toast";

const limit = 10;

const statusPresentation: Record<RequestStatus, { label: string; variant: "warning" | "success" | "danger" }> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  APPROVED: { label: "Aprobada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "danger" },
};

const avatarTones = ["bg-status-info-surface text-status-info", "bg-status-success-surface text-status-success", "bg-status-warning-surface text-status-warning", "bg-status-neutral-surface text-status-neutral"];

function reviewRequiredMessage(error: unknown) {
  const message = axios.isAxiosError(error)
    ? error.response?.data && typeof error.response.data === "object" && "message" in error.response.data
      ? String(error.response.data.message)
      : ""
    : "";
  if (axios.isAxiosError(error) && error.response?.status === 409 && /identity|review/i.test(message)) {
    return "La solicitud sigue pendiente: la identidad requiere revisión institucional antes de aprobarla.";
  }
  return getErrorMessage(error);
}

function getInitials(fullName: string) {
  return fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase() || "SR";
}

function getAvatarTone(fullName: string) {
  const hash = Array.from(fullName).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return avatarTones[hash % avatarTones.length];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" }).format(new Date(value));
}

export function UserRequestsPage() {
  const { notify } = useToast();
  const { user } = useAuth();
  const canReview = hasCapability(user?.permissionCodes, "usr.user-requests.review");
  const [items, setItems] = useState<UserRequest[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [roleId, setRoleId] = useState("");
  const [reason, setReason] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RequestStatus | "">("");
  const [selected, setSelected] = useState<UserRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | "rejectConfirm" | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userRequestsService.list({ page, limit, status: status || undefined });
      setItems(response.data);
      setTotal(response.total);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!canReview) return;
    rolesService.listActive().then(setRoles).catch((reason) => setError(getErrorMessage(reason, "No fue posible cargar los roles.")));
  }, [canReview]);

  const run = async () => {
    if (!canReview || !selected || !action || (action === "approve" && !roleId) || (action === "reject" && !reason.trim())) return;
    setBusy(true);
    try {
      if (action === "approve") await userRequestsService.approve(selected.id, Number(roleId));
      else await userRequestsService.reject(selected.id, reason.trim());
      notify(action === "approve" ? "Solicitud aprobada." : "Solicitud rechazada.", "success");
      setAction(null);
      setSelected(null);
      setRoleId("");
      setReason("");
      await load();
    } catch (reason) {
      notify(action === "approve" ? reviewRequiredMessage(reason) : getErrorMessage(reason), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-8">
      <PageHeader context="Administración · Cuentas" title="Solicitudes de registro" description="Revise las solicitudes de acceso al sistema y gestione su resolución institucional." />

      <section className="rounded-surface border border-border-default bg-surface-card p-4 shadow-sm sm:p-5" aria-labelledby="account-request-filters-heading">
        <div className="mb-4 border-b border-border-subtle pb-4">
          <h2 id="account-request-filters-heading" className="text-heading-3 font-semibold text-text-primary">Filtrar solicitudes</h2>
          <p className="mt-1 text-body-small text-text-secondary">Seleccione un estado para actualizar el listado.</p>
        </div>
        <SearchFilterBar className="sm:max-w-xs" label="Filtrar solicitudes de registro">
          <FormField id="user-request-status" label="Estado">
          <Select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as RequestStatus | ""); }}>
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobada</option>
            <option value="REJECTED">Rechazada</option>
          </Select>
          </FormField>
        </SearchFilterBar>
      </section>

      {error ? <ErrorState message={error} action={<Button type="button" variant="outline" onClick={() => void load()}>Reintentar</Button>} /> : null}
      {loading ? <LoadingState label="Cargando solicitudes de registro..." /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState title="No hay solicitudes para mostrar" description="Las solicitudes de registro recibidas aparecerán en este listado." /> : null}
      {!loading && !error && items.length > 0 ? <section className="space-y-4" aria-labelledby="account-request-results-heading">
        <div className="flex flex-col gap-1 border-b border-border-subtle pb-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h2 id="account-request-results-heading" className="text-heading-2 font-bold text-text-primary">Resultados</h2>
            <p className="text-body-small text-text-secondary" aria-live="polite">{total} {total === 1 ? "solicitud encontrada" : "solicitudes encontradas"}</p>
          </div>
          <p className="text-caption text-text-secondary">Seleccione una solicitud para revisar sus datos.</p>
        </div>
        <DataTable className="min-w-[44rem]" scrollLabel="En pantallas estrechas, desplaza horizontalmente para ver más columnas de solicitudes de registro">
            <caption className="sr-only">Listado de solicitudes de registro</caption>
            <DataTableHeader>
              <DataTableRow className="hover:bg-surface-muted">
                <DataTableHead>Persona solicitante</DataTableHead>
                <DataTableHead>Correo</DataTableHead>
                <DataTableHead>Estado</DataTableHead>
                <DataTableHead className="whitespace-nowrap">Recibida</DataTableHead>
                <DataTableHead className="text-right"><span className="sr-only">Acciones</span></DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {items.map((item) => {
                const presentation = statusPresentation[item.status];
                return <DataTableRow key={item.id} className="focus-within:bg-surface-muted/80">
                  <DataTableCell>
                    <div className="flex min-w-52 items-center gap-3">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-full text-label font-bold ${getAvatarTone(item.fullName)}`} aria-hidden="true">{getInitials(item.fullName)}</span>
                      <span className="min-w-0 break-words font-semibold text-text-primary">{item.fullName}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="break-all text-text-secondary">{item.email}</DataTableCell>
                  <DataTableCell><StatusBadge variant={presentation.variant}>{presentation.label}</StatusBadge></DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-text-secondary">{formatDate(item.createdAt)}</DataTableCell>
                  <DataTableCell className="text-right"><Button size="sm" variant="outline" type="button" onClick={() => { setSelected(item); setRoleId(""); setReason(""); }}>Ver detalle</Button></DataTableCell>
                </DataTableRow>;
              })}
            </DataTableBody>
        </DataTable>
        <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      </section> : null}

      {selected && !action ? <Modal title={`Solicitud de ${selected.fullName}`} onClose={() => setSelected(null)}>
        <dl className="grid gap-5 sm:grid-cols-2">
          <RequestDetail label="Identificación">{selected.identificationType === "DIMEX" ? "DIMEX" : "Nacional"}: {selected.identification}</RequestDetail>
          <RequestDetail label="Teléfono">{selected.phoneCountryCode && selected.phoneNationalNumber ? `${selected.phoneCountryCode} ${selected.phoneNationalNumber}` : selected.phone || "—"}</RequestDetail>
          <RequestDetail label="Dirección">{selected.address || "—"}</RequestDetail>
          <RequestDetail label="Motivo">{selected.reason}</RequestDetail>
          {selected.rejectionReason ? <RequestDetail label="Rechazo">{selected.rejectionReason}</RequestDetail> : null}
        </dl>
        {canReview && selected.status === "PENDING" ? <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="danger" onClick={() => setAction("reject")}>Rechazar</Button><Button type="button" onClick={() => setAction("approve")}>Aprobar</Button></div> : null}
      </Modal> : null}
      {action === "approve" ? <Modal title="Aprobar solicitud" onClose={() => setAction(null)} busy={busy}>
        <p className="text-text-secondary">Seleccione el rol que tendrá la nueva cuenta y confirme la aprobación.</p>
        <label className="mt-5 flex flex-col gap-1 text-label font-semibold text-text-primary">Rol
          <Select value={roleId} onChange={(event) => setRoleId(event.target.value)}><option value="">Seleccione un rol</option>{roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</Select>
        </label>
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setAction(null)} disabled={busy}>Cancelar</Button><Button type="button" loading={busy} disabled={!roleId || busy} onClick={() => void run()}>{busy ? "Aprobando…" : "Aprobar solicitud"}</Button></div>
      </Modal> : null}
      {action === "reject" ? <Modal title="Rechazar solicitud" onClose={() => setAction(null)}>
        <FormField id="user-request-rejection-reason" label="Motivo del rechazo" description="El motivo es obligatorio.">
          <Textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setAction(null)}>Cancelar</Button><Button type="button" variant="danger" disabled={!reason.trim()} onClick={() => setAction("rejectConfirm")}>Continuar</Button></div>
      </Modal> : null}
      {action === "rejectConfirm" ? <ConfirmDialog title="Confirmar rechazo" message="¿Confirmas el rechazo de esta solicitud con el motivo indicado?" confirmLabel="Rechazar solicitud" danger busy={busy} onClose={() => setAction("reject")} onConfirm={() => void run()} /> : null}
    </section>
  );
}

function RequestDetail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-label font-semibold text-text-secondary">{label}</dt><dd className="mt-1 break-words text-body text-text-primary">{children}</dd></div>;
}
