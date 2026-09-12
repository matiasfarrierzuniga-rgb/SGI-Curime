import { useEffect, useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { absenceJustificationsService } from '../api/absenceJustifications.api'
import type { AbsenceJustification } from '../model/absenceJustifications.types'

const statusLabels: Record<AbsenceJustification['status'], string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

export function AffiliateJustificationsPage() {
  const [items, setItems] = useState<AbsenceJustification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    absenceJustificationsService
      .listMine({ page: 1, limit: 100 })
      .then((response) => {
        if (!active) return
        setItems(response.data ?? [])
      })
      .catch((reason) => {
        if (!active) return
        setError(getErrorMessage(reason, 'No fue posible cargar tus justificaciones.'))
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="space-y-6">
      <PageHeader
        context="Afiliado"
        title="Mis justificaciones"
        description="Consulta el estado de cada solicitud y la observación del equipo administrativo."
      />

      {loading ? (
        <LoadingState label="Cargando tus justificaciones..." />
      ) : error ? (
        <ErrorState
          title="No fue posible cargar tu historial"
          message={error}
          action={
            <button
              type="button"
              className="min-h-10 rounded-control border border-border-default px-4 font-semibold"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No tienes justificaciones registradas"
          description="Cuando envíes una justificación de ausencia, aparecerá aquí con su estado final."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-sm">
          <div className="overflow-x-auto">
            <table aria-label="Historial de justificaciones" className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Asamblea</th>
                  <th className="px-4 py-3 font-semibold">Fecha de envío</th>
                  <th className="px-4 py-3 font-semibold">Motivo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Observación</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-border-default align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-text-primary">{item.assembly.title}</div>
                      <div className="text-xs text-text-secondary">{new Date(item.assembly.date).toLocaleDateString('es-CR', { dateStyle: 'medium' })}</div>
                    </td>
                    <td className="px-4 py-4 text-text-secondary">
                      {new Date(item.createdAt).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-md whitespace-pre-line text-text-secondary">{item.reason}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-brand-soft/20 px-2.5 py-1 text-xs font-semibold text-brand-deep">
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-md whitespace-pre-line text-text-secondary">
                        {item.decisionNote || item.rejectionReason || 'Sin observación registrada.'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
