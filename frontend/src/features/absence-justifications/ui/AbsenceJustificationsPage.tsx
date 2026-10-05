import { useState } from 'react'
import { Eye, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/shared/lib/errors'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { absenceJustificationsService } from '../api/absenceJustifications.api'
import { useAbsenceJustificationsList, useAbsenceJustificationsMutations } from '../hooks/useAbsenceJustificationsQueries'
import type { JustificationStatus } from '../model/absenceJustifications.types'

const limit = 20

const statusLabels: Record<JustificationStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

const evidenceLabel = (mimeType?: string | null, size?: number | null) => {
  if (!mimeType && !size) return 'Sin archivo'
  const format = mimeType?.split('/')[1]?.toUpperCase() ?? 'ARCHIVO'
  const formattedSize = size ? `${(size / 1024 / 1024).toFixed(2)} MB` : 'Sin tamaño'
  return `${format} • ${formattedSize}`
}

const statusVariant: Record<JustificationStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

export function AbsenceJustificationsPage() {
  const { user } = useAuth()
  const mayApprove = hasCapability(user?.permissionCodes, 'adm.justifications.approve')
  const mayReject = hasCapability(user?.permissionCodes, 'adm.justifications.reject')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<JustificationStatus | ''>('PENDING')
  const [decisionId, setDecisionId] = useState<number | null>(null)
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [observation, setObservation] = useState('')
  const [error, setError] = useState('')
  const [evidenceId, setEvidenceId] = useState<number | null>(null)
  const { approve, reject } = useAbsenceJustificationsMutations()
  const listQuery = useAbsenceJustificationsList({ status: status || undefined, page, limit })
  const items = listQuery.data?.data ?? []
  const total = listQuery.data?.total ?? 0

  const resetDecision = () => {
    setDecisionId(null)
    setDecision('APPROVED')
    setObservation('')
    setError('')
  }

  const handleApprove = async (id: number) => {
    setDecisionId(id)
    setDecision('APPROVED')
    setError('')
    setObservation('')
  }

  const handleConfirm = async () => {
    if (decisionId === null || (decision === 'APPROVED' ? !mayApprove : !mayReject)) return
    const trimmed = observation.trim()
    if (decision === 'REJECTED' && !trimmed) {
      setError('Debe escribir una observación antes de rechazar la justificación.')
      return
    }

    try {
      if (decision === 'APPROVED') {
        await approve.mutateAsync({ id: decisionId, payload: trimmed ? { observation: trimmed } : undefined })
      } else {
        await reject.mutateAsync({ id: decisionId, payload: { rejectionReason: trimmed } })
      }
      toast.success(decision === 'APPROVED' ? 'Justificación aprobada correctamente.' : 'Justificación rechazada correctamente.')
      resetDecision()
    } catch (reason) {
      setError(getErrorMessage(reason, decision === 'APPROVED' ? 'No fue posible aprobar la justificación.' : 'No fue posible rechazar la justificación.'))
    }
  }

  const openEvidence = async (id: number) => {
    const evidenceWindow = window.open('', '_blank', 'noopener,noreferrer')
    setEvidenceId(id)
    try {
      const evidence = await absenceJustificationsService.getEvidence(id)
      if (!evidence.attachmentUrl) {
        evidenceWindow?.close()
        setError('La evidencia no tiene un documento disponible.')
        return
      }
      const file = await absenceJustificationsService.getEvidenceFile(id)
      const objectUrl = URL.createObjectURL(file)
      if (evidenceWindow) evidenceWindow.location.href = objectUrl
      else window.location.href = objectUrl
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (reason) {
      evidenceWindow?.close()
      setError(getErrorMessage(reason, 'No fue posible consultar la evidencia.'))
    } finally {
      setEvidenceId(null)
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        context="Gestión administrativa"
        title="Justificaciones de ausencias"
        description="Revise, apruebe o rechace las solicitudes de ausencia por asistencia a asambleas."
        actions={
          <select
            aria-label="Filtrar por estado de justificación"
            className="min-h-11 rounded-md border border-border-default bg-surface px-3 text-sm"
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as JustificationStatus | '')
            }}
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>
        }
      />

      {error && decisionId === null ? <div className="rounded-control border border-status-danger/30 bg-status-danger-surface px-4 py-3 text-body-small text-status-danger" role="alert">{error}</div> : null}

      {listQuery.isPending ? (
        <LoadingState label="Cargando justificaciones..." />
      ) : listQuery.isError ? (
        <ErrorState
          message={getErrorMessage(listQuery.error, 'No fue posible cargar las justificaciones.')}
            action={<Button variant="outline" type="button" onClick={() => void listQuery.refetch()}>Reintentar</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No hay justificaciones de ausencia"
          description={status ? 'No existen justificaciones que coincidan con el filtro seleccionado.' : 'Aún no se han registrado justificantes para asambleas.'}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-sm">
            <div className="overflow-x-auto">
              <table aria-label="Listado de justificaciones" className="min-w-[860px] text-left text-sm">
                <thead className="bg-surface-muted text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Persona afiliada</th>
                    <th className="px-4 py-3 font-semibold">Asamblea</th>
                    <th className="px-4 py-3 font-semibold">Motivo</th>
                    <th className="px-4 py-3 font-semibold">Evidencia</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border-default align-top transition-colors hover:bg-surface-muted/60">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-text-primary">{item.affiliate?.fullName ?? 'Persona sin registro'}</div>
                        <div className="text-xs text-text-secondary">{item.affiliate?.identification ?? 'Identificación sin registro'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-text-primary">{item.assembly?.title ?? 'Asamblea sin registro'}</div>
                        <div className="text-xs text-text-secondary">
                          {item.assembly?.date ? new Date(item.assembly.date).toLocaleDateString('es-CR', { dateStyle: 'medium' }) : 'Fecha sin registro'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-md whitespace-pre-line text-text-secondary">{item.reason}</div>
                      </td>
                      <td className="px-4 py-4">
                        {item.attachmentOriginalName ? (
                          <div className="space-y-1">
                            <div className="font-medium text-text-primary">{item.attachmentOriginalName}</div>
                            <div className="text-xs text-text-secondary">{evidenceLabel(item.attachmentMimeType, item.attachmentSize)}</div>
                            <Button
                              type="button"
                              onClick={() => void openEvidence(item.id)}
                              disabled={evidenceId === item.id}
                              variant="link"
                              size="sm"
                              className="h-auto px-0 text-xs"
                            >
                              <Eye aria-hidden="true" />
                              {evidenceId === item.id ? 'Consultando evidencia...' : 'Ver evidencia protegida'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-secondary">Sin archivo</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge variant={statusVariant[item.status]}>{statusLabels[item.status]}</StatusBadge>
                      </td>
                      <td className="px-4 py-4">
                        {item.status === 'PENDING' && (mayApprove || mayReject) ? (
                          <div className="flex flex-col items-end gap-2">
                            {mayApprove ? <Button
                              type="button"
                              size="sm"
                              disabled={approve.isPending || reject.isPending}
                              onClick={() => void handleApprove(item.id)}
                            >
                              Aprobar
                            </Button> : null}
                            {mayReject ? <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-status-danger text-status-danger hover:bg-status-danger-surface"
                              disabled={approve.isPending || reject.isPending}
                              onClick={() => {
                                setDecisionId(item.id)
                                setDecision('REJECTED')
                                setObservation('')
                                setError('')
                              }}
                            >
                              Rechazar
                            </Button> : null}
                          </div>
                        ) : item.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-text-secondary"><ShieldAlert aria-hidden="true" className="size-3.5" />Sin permiso para revisar</span>
                        ) : (
                          <span className="text-xs text-text-secondary">Revisión cerrada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Dialog open={decisionId !== null} onOpenChange={(open) => !open && resetDecision()}>
            <DialogContent size="md">
              <div className="grid gap-5">
              <DialogHeader className="pr-8">
                <DialogTitle>{decision === 'APPROVED' ? 'Aprobar justificación' : 'Rechazar justificación'}</DialogTitle>
                <DialogDescription>{decision === 'APPROVED' ? 'Puede registrar una observación opcional para esta decisión.' : 'Explique el motivo del rechazo. Esta observación es obligatoria.'}</DialogDescription>
              </DialogHeader>
              {error ? <p className="rounded-control border border-status-danger/30 bg-status-danger-surface px-3 py-2 text-body-small text-status-danger" role="alert">{error}</p> : null}
              <div>
              <label htmlFor="justification-observation" className="block text-sm font-semibold text-text-primary">Observación{decision === 'REJECTED' ? ' (obligatoria)' : ' (opcional)'}</label>
              <textarea
                id="justification-observation"
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                maxLength={1000}
                className="mt-2 min-h-28 w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-describedby="justification-observation-help"
                placeholder={decision === 'REJECTED' ? 'Indique el motivo del rechazo.' : 'Agregue una observación, si corresponde.'}
              />
              <p id="justification-observation-help" className="mt-2 text-xs text-text-secondary">Máximo 1.000 caracteres.</p>
              </div>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" disabled={approve.isPending || reject.isPending} />}>Cancelar</DialogClose>
                <Button
                  type="button"
                  variant={decision === 'APPROVED' ? 'primary' : 'danger'}
                  onClick={() => void handleConfirm()}
                  loading={approve.isPending || reject.isPending}
                  disabled={(decision === 'REJECTED' && !observation.trim()) || approve.isPending || reject.isPending}
                >
                  {approve.isPending || reject.isPending ? 'Procesando…' : `Confirmar ${decision === 'APPROVED' ? 'aprobación' : 'rechazo'}`}
                </Button>
              </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </>
      )}
    </section>
  )
}
