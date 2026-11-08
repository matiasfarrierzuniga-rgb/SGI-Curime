import { useEffect, useState, type FormEvent } from 'react'

import { AdministrativeListLayout, AdministrativeListResults } from '@/shared/ui/AdministrativeListLayout'
import { Button } from '@/shared/ui/button'
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { useToast } from '@/shared/ui/Toast'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { getErrorMessage } from '@/shared/lib/errors'
import { rolesService, type RoleOption } from '@/features/roles'
import { auditLogsService } from '../../services/auditLogsService'
import type { AuditLog, AuditQuery, BoardPrivilegeReview, BoardPrivilegeReviewResolution } from '../../types/audit'

const limit = 20
const canonicalRoleCodes = new Set(['ROLE_SYSTEM_ADMIN', 'ROLE_INSTITUTIONAL_PRESIDENT', 'ROLE_INSTITUTIONAL_SECRETARY', 'ROLE_INSTITUTIONAL_TREASURER', 'ROLE_INSTITUTIONAL_OPERATOR', 'ROLE_COMMUNITY_USER'])
const sensitiveDetailKey = /password|token|jwt|secret|database_url|admin_password/i
const redactDetails = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redactDetails)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sensitiveDetailKey.test(key) ? '[REDACTED]' : redactDetails(entry)]))
  return value
}
const safeDetails = (value: unknown) => typeof value === 'object' && value !== null ? JSON.stringify(redactDetails(value), null, 2) : String(value ?? '—')

export function AuditLogsPage() {
  const { notify } = useToast()
  const { user, isLoading: isSessionLoading } = useAuth()
  const mayReadAudit = hasCapability(user?.permissionCodes, 'aud.logs.read')
  const mayReviewPrivileges = hasCapability(user?.permissionCodes, 'usr.users.read') && hasCapability(user?.permissionCodes, 'usr.users.role.change')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ userId: '', action: '', module: '', dateFrom: '', dateTo: '' })
  const [filters, setFilters] = useState<AuditQuery>({})
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<BoardPrivilegeReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [reviewing, setReviewing] = useState<BoardPrivilegeReview | null>(null)
  const [reviewForm, setReviewForm] = useState<BoardPrivilegeReviewResolution>({ decision: 'NO_CHANGE', justification: '' })
  const [reviewRoles, setReviewRoles] = useState<RoleOption[]>([])
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (isSessionLoading || !mayReadAudit) return
    let active = true
    setLoading(true)
    setError('')
    auditLogsService.list({ ...filters, page, limit })
      .then((result) => {
        if (active) {
          setLogs(result.data)
          setTotal(result.total)
        }
      })
      .catch((cause) => active && setError(getErrorMessage(cause)))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [filters, isSessionLoading, mayReadAudit, page])

  const loadPrivilegeReviews = () => {
    if (isSessionLoading || !mayReviewPrivileges) return
    setReviewsLoading(true)
    setReviewsError('')
    Promise.all([auditLogsService.listBoardPrivilegeReviews({ page: 1, limit: 50 }), rolesService.listActive()])
      .then(([result, roles]) => { setReviews(result.data); setReviewRoles(roles.filter(role => canonicalRoleCodes.has(role.name))) })
      .catch((cause) => setReviewsError(getErrorMessage(cause)))
      .finally(() => setReviewsLoading(false))
  }

  useEffect(() => { loadPrivilegeReviews() }, [isSessionLoading, mayReviewPrivileges])

  const detail = async (id: number) => {
    try {
      setSelected(await auditLogsService.get(id))
    } catch (cause) {
      notify(getErrorMessage(cause), 'error')
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setFilters({
      userId: form.userId ? Number(form.userId) : undefined,
      action: form.action || undefined,
      module: form.module || undefined,
      dateFrom: form.dateFrom ? new Date(`${form.dateFrom}T00:00:00`).toISOString() : undefined,
      dateTo: form.dateTo ? new Date(`${form.dateTo}T23:59:59`).toISOString() : undefined,
    })
  }

  const resolveReview = async (event: FormEvent) => {
    event.preventDefault()
    if (!reviewing || resolving) return
    if (reviewForm.justification.trim().length < 3) {
      notify('Indique una justificación de al menos tres caracteres.', 'error')
      return
    }
    if (reviewForm.decision === 'ROLE_CHANGED' && !reviewForm.roleId) {
      notify('Seleccione el rol canónico autorizado.', 'error')
      return
    }
    setResolving(true)
    try {
      await auditLogsService.resolveBoardPrivilegeReview(reviewing.id, { ...reviewForm, justification: reviewForm.justification.trim() })
      notify('Revisión de privilegios resuelta.', 'success')
      setReviewing(null)
      loadPrivilegeReviews()
    } catch (cause) {
      notify(getErrorMessage(cause), 'error')
    } finally {
      setResolving(false)
    }
  }

  return (
    <AdministrativeListLayout header={<PageHeader context="Administración" title="Bitácora" />}>
      {mayReviewPrivileges ? <section className="mb-6 rounded-surface border border-border-default bg-surface-card p-5 shadow-surface" aria-labelledby="privilege-reviews-title">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="privilege-reviews-title" className="text-heading-3 font-semibold text-text-primary">Revisiones de privilegios institucionales</h2><p className="mt-1 text-body-small text-text-secondary">Requieren decisión técnica explícita. Los nombramientos no modifican roles automáticamente.</p></div><Button type="button" variant="outline" size="sm" onClick={loadPrivilegeReviews} disabled={reviewsLoading}>Actualizar</Button></div>
        {reviewsError ? <ErrorState message={reviewsError} /> : reviewsLoading ? <LoadingState label="Cargando revisiones…" /> : reviews.length === 0 ? <p className="mt-4 text-body-small text-text-secondary">No hay revisiones registradas.</p> : <div className="mt-4 overflow-x-auto rounded-control border border-border-default"><DataTable className="min-w-[58rem]"><DataTableHeader><DataTableRow><DataTableHead>Fecha</DataTableHead><DataTableHead>Persona / cuenta</DataTableHead><DataTableHead>Origen</DataTableHead><DataTableHead>Acceso efectivo</DataTableHead><DataTableHead>Estado</DataTableHead><DataTableHead><span className="sr-only">Acción</span></DataTableHead></DataTableRow></DataTableHeader><DataTableBody>{reviews.map(review => <DataTableRow key={review.id}><DataTableCell>{new Date(review.createdAt).toLocaleString()}</DataTableCell><DataTableCell>{review.person?.fullName ?? `Persona ${review.person?.id ?? '—'}`}<br /><span className="text-text-secondary">{review.account ? `${review.account.email} · ${review.account.role.name}` : 'Sin cuenta vinculada'}</span></DataTableCell><DataTableCell>{review.trigger ?? '—'}<br /><span className="text-text-secondary">Nombramiento #{review.membership?.id ?? '—'} · período #{review.membership?.term.id ?? '—'}</span></DataTableCell><DataTableCell>{review.account ? `${review.account.effectiveCapabilities.length} capacidades` : '—'}</DataTableCell><DataTableCell>{review.resolution ? `Resuelta: ${review.resolution.decision ?? '—'}` : 'Pendiente'}</DataTableCell><DataTableCell>{!review.resolution && review.account ? <Button type="button" size="sm" onClick={() => { setReviewing(review); setReviewForm({ decision: 'NO_CHANGE', justification: '' }) }}>Resolver</Button> : null}</DataTableCell></DataTableRow>)}</DataTableBody></DataTable></div>}
      </section> : null}
      <form className="filters card" onSubmit={submit} aria-label="Filtrar bitácora">
        <label>Usuario (ID)<input type="number" min="1" inputMode="numeric" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} /></label>
        <label>Acción<input maxLength={100} value={form.action} onChange={(event) => setForm({ ...form, action: event.target.value })} /></label>
        <label>Módulo<input maxLength={100} value={form.module} onChange={(event) => setForm({ ...form, module: event.target.value })} /></label>
        <label>Desde<input type="date" value={form.dateFrom} onChange={(event) => setForm({ ...form, dateFrom: event.target.value })} /></label>
        <label>Hasta<input type="date" value={form.dateTo} onChange={(event) => setForm({ ...form, dateTo: event.target.value })} /></label>
        <div className="actions"><Button type="submit">Aplicar filtros</Button></div>
      </form>
      {error ? <ErrorState message={error} /> : loading || isSessionLoading ? <LoadingState label="Cargando bitácora…" /> : logs.length === 0 ? (
        <EmptyState title="Sin eventos" description="No hay eventos que coincidan con los filtros." />
      ) : (
        <AdministrativeListResults count={`${total} ${total === 1 ? 'evento encontrado' : 'eventos encontrados'}`}>
          <DataTable scrollLabel="Tabla de bitácora, desplazable horizontalmente" pagination={<Pagination page={page} total={total} limit={limit} onChange={setPage} />}>
            <DataTableHeader>
              <DataTableRow><DataTableHead>Fecha</DataTableHead><DataTableHead>Usuario</DataTableHead><DataTableHead>Acción</DataTableHead><DataTableHead>Módulo</DataTableHead><DataTableHead><span className="sr-only">Acciones</span></DataTableHead></DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {logs.map((log) => (
                <DataTableRow key={log.id}>
                  <DataTableCell>{new Date(log.createdAt).toLocaleString()}</DataTableCell>
                  <DataTableCell>{log.user ? `${log.user.fullName} (${log.user.email})` : 'Sistema / sin usuario'}</DataTableCell>
                  <DataTableCell>{log.action}</DataTableCell>
                  <DataTableCell>{log.module}</DataTableCell>
                  <DataTableCell><Button type="button" variant="outline" size="sm" onClick={() => void detail(log.id)}>Ver detalle</Button></DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </AdministrativeListResults>
      )}
      {selected && (
        <Modal title="Detalle de evento" onClose={() => setSelected(null)}>
          <dl className="detail-grid">
            <div><dt>Fecha/hora</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div>
            <div><dt>Usuario</dt><dd>{selected.user ? `${selected.user.fullName} (${selected.user.email})` : 'Sistema / sin usuario'}</dd></div>
            <div><dt>Acción</dt><dd>{selected.action}</dd></div>
            <div><dt>Módulo</dt><dd>{selected.module}</dd></div>
            <div><dt>Tipo de entidad</dt><dd>{selected.entityType || '—'}</dd></div>
            <div><dt>ID de entidad</dt><dd>{selected.entityId || '—'}</dd></div>
            <div><dt>IP</dt><dd>{selected.ipAddress || '—'}</dd></div>
            <div><dt>User-Agent</dt><dd>{selected.userAgent || '—'}</dd></div>
          </dl>
          <h3>Detalles</h3>
          <pre className="details">{safeDetails(selected.details)}</pre>
        </Modal>
      )}
      {reviewing ? <Modal title="Resolver revisión de privilegios" onClose={() => { if (!resolving) setReviewing(null) }}><form className="grid gap-4" onSubmit={resolveReview}><p className="text-body-small text-text-secondary">Persona: <span className="font-semibold text-text-primary">{reviewing.person?.fullName ?? 'No disponible'}</span><br />Cuenta: <span className="font-semibold text-text-primary">{reviewing.account?.email ?? 'No vinculada'}</span><br />Rol actual: <span className="font-semibold text-text-primary">{reviewing.account?.role.name ?? '—'}</span></p><p className="text-body-small text-text-secondary">Capacidades efectivas: {reviewing.account?.effectiveCapabilities.join(', ') || 'ninguna'}.</p><label className="grid gap-2 text-sm font-semibold">Decisión<select value={reviewForm.decision} onChange={event => setReviewForm({ decision: event.target.value as BoardPrivilegeReviewResolution['decision'], justification: reviewForm.justification })}><option value="NO_CHANGE">Sin cambio de rol</option><option value="ROLE_CHANGED">Cambiar rol técnico</option></select></label>{reviewForm.decision === 'ROLE_CHANGED' ? <label className="grid gap-2 text-sm font-semibold">Rol canónico<select required value={reviewForm.roleId ?? ''} onChange={event => setReviewForm({ ...reviewForm, roleId: Number(event.target.value) || undefined })}><option value="">Seleccione un rol</option>{reviewRoles.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label> : null}<label className="grid gap-2 text-sm font-semibold">Justificación<textarea required minLength={3} maxLength={1000} value={reviewForm.justification} onChange={event => setReviewForm({ ...reviewForm, justification: event.target.value })} /></label><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={resolving} onClick={() => setReviewing(null)}>Cancelar</Button><Button type="submit" disabled={resolving}>{resolving ? 'Guardando…' : 'Registrar resolución'}</Button></div></form></Modal> : null}
    </AdministrativeListLayout>
  )
}
