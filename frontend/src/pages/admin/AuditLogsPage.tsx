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
import { getErrorMessage } from '@/shared/lib/errors'
import { auditLogsService } from '../../services/auditLogsService'
import type { AuditLog, AuditQuery } from '../../types/audit'

const limit = 20
const safeDetails = (value: unknown) => typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value ?? '—')

export function AuditLogsPage() {
  const { notify } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ action: '', module: '', dateFrom: '', dateTo: '' })
  const [filters, setFilters] = useState<AuditQuery>({})
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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
  }, [filters, page])

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
      action: form.action || undefined,
      module: form.module || undefined,
      dateFrom: form.dateFrom ? new Date(`${form.dateFrom}T00:00:00`).toISOString() : undefined,
      dateTo: form.dateTo ? new Date(`${form.dateTo}T23:59:59`).toISOString() : undefined,
    })
  }

  return (
    <AdministrativeListLayout header={<PageHeader context="Administración" title="Bitácora" />}>
      <form className="filters card" onSubmit={submit}>
        <label>Acción<input maxLength={100} value={form.action} onChange={(event) => setForm({ ...form, action: event.target.value })} /></label>
        <label>Módulo<input maxLength={100} value={form.module} onChange={(event) => setForm({ ...form, module: event.target.value })} /></label>
        <label>Desde<input type="date" value={form.dateFrom} onChange={(event) => setForm({ ...form, dateFrom: event.target.value })} /></label>
        <label>Hasta<input type="date" value={form.dateTo} onChange={(event) => setForm({ ...form, dateTo: event.target.value })} /></label>
        <div className="actions"><Button type="submit">Aplicar filtros</Button></div>
      </form>
      {error ? <ErrorState message={error} /> : loading ? <LoadingState label="Cargando bitácora…" /> : logs.length === 0 ? (
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
    </AdministrativeListLayout>
  )
}
