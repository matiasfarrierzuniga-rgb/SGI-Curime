import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { absenceJustificationsService } from '../api/absenceJustifications.api'
import { useAbsenceJustificationsList, useAbsenceJustificationsMutations } from '../hooks/useAbsenceJustificationsQueries'
import type { JustificationStatus } from '../model/absenceJustifications.types'

const limit = 20

const statusLabels: Record<JustificationStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

const evidenceLabel = (mimeType?: string, size?: number) => {
  if (!mimeType && !size) return 'Sin archivo'
  const format = mimeType?.split('/')[1]?.toUpperCase() ?? 'ARCHIVO'
  const formattedSize = size ? `${(size / 1024 / 1024).toFixed(2)} MB` : 'Sin tamaño'
  return `${format} • ${formattedSize}`
}

const getAttachment = (item: {
  attachment?: { originalName: string; mimeType: string; size: number; url?: string | null } | null
  attachmentOriginalName?: string | null
  attachmentMimeType?: string | null
  attachmentSize?: number | null
  attachmentUrl?: string | null
}) => item.attachment ?? (item.attachmentOriginalName ? {
  originalName: item.attachmentOriginalName,
  mimeType: item.attachmentMimeType ?? '',
  size: item.attachmentSize ?? 0,
  url: item.attachmentUrl,
} : null)

export function AbsenceJustificationsPage() {
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
    if (decisionId === null) return
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
      resetDecision()
    } catch (reason) {
      setError(getErrorMessage(reason, 'No fue posible rechazar la justificación.'))
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

      {listQuery.isPending ? (
        <LoadingState label="Cargando justificaciones..." />
      ) : listQuery.isError ? (
        <ErrorState
          message={getErrorMessage(listQuery.error, 'No fue posible cargar las justificaciones.')}
          action={
            <button className="min-h-10 rounded-control border border-border-default px-4 font-semibold" type="button" onClick={() => void listQuery.refetch()}>
              Reintentar
            </button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No hay justificaciones de ausencia"
          description={status ? 'No existen justificaciones que coincidan con el filtro seleccionado.' : 'Aún no se han registrado justificantes para asambleas.'}
        />
      ) : (
        <>
          {error ? (
            <div className="rounded-md border border-status-danger/30 bg-status-danger-surface p-3 text-sm text-status-danger" role="alert">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-sm">
            <div className="overflow-x-auto">
              <table aria-label="Listado de justificaciones pendientes" className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Afiliado</th>
                    <th className="px-4 py-3 font-semibold">Asamblea</th>
                    <th className="px-4 py-3 font-semibold">Motivo</th>
                    <th className="px-4 py-3 font-semibold">Evidencia</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border-default align-top">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-text-primary">{item.affiliate.fullName}</div>
                        <div className="text-xs text-text-secondary">{item.affiliate.identification}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-text-primary">{item.assembly.title}</div>
                        <div className="text-xs text-text-secondary">
                          {new Date(item.assembly.date).toLocaleDateString('es-CR', { dateStyle: 'medium' })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-md whitespace-pre-line text-text-secondary">{item.reason}</div>
                      </td>
                      <td className="px-4 py-4">
                        {getAttachment(item) ? (
                          <div className="space-y-1">
                            <div className="font-medium text-text-primary">{getAttachment(item)?.originalName}</div>
                            <div className="text-xs text-text-secondary">{evidenceLabel(getAttachment(item)?.mimeType, getAttachment(item)?.size)}</div>
                            <button
                              type="button"
                              onClick={() => void openEvidence(item.id)}
                              disabled={evidenceId === item.id}
                              className="text-left text-xs font-semibold text-brand-primary underline-offset-4 hover:underline disabled:opacity-60"
                            >
                              {evidenceId === item.id ? 'Consultando evidencia...' : 'Ver evidencia protegida'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-secondary">Sin archivo</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-brand-soft/20 px-2.5 py-1 text-xs font-semibold text-brand-deep">
                          {statusLabels[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {item.status === 'PENDING' ? (
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              className="min-h-10 rounded-control bg-brand-deep px-4 font-semibold text-brand-ivory"
                              disabled={approve.isPending || reject.isPending}
                              onClick={() => void handleApprove(item.id)}
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className="min-h-10 rounded-control border border-danger px-4 font-semibold text-danger"
                              disabled={approve.isPending || reject.isPending}
                              onClick={() => {
                                setDecisionId(item.id)
                                setDecision('REJECTED')
                                setObservation('')
                                setError('')
                              }}
                            >
                              Rechazar
                            </button>
                          </div>
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

          {decisionId !== null && (
            <div className="rounded-xl border border-border-default bg-surface-card p-5">
              <h3 className="font-heading text-heading-4 text-text-primary">{decision === 'APPROVED' ? 'Aprobar justificación' : 'Rechazar justificación'}</h3>
              <p className="mt-2 text-sm text-text-secondary">La observación es opcional al aprobar y obligatoria al rechazar.</p>
              <label htmlFor="justification-observation" className="mt-4 block text-sm font-semibold text-text-primary">Observación</label>
              <textarea
                id="justification-observation"
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm"
                placeholder="Indique el motivo del rechazo y la observación relevante."
              />
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button type="button" className="min-h-10 rounded-control border border-border-default px-4 font-semibold" onClick={resetDecision}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="min-h-10 rounded-control bg-danger px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => void handleConfirm()}
                  disabled={(decision === 'REJECTED' && !observation.trim()) || approve.isPending || reject.isPending}
                >
                  {approve.isPending || reject.isPending ? 'Procesando…' : `Confirmar ${decision === 'APPROVED' ? 'aprobación' : 'rechazo'}`}
                </button>
              </div>
            </div>
          )}

          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </>
      )}
    </section>
  )
}
