import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useReservationDetail } from '../hooks/useReservations'
import { ReservationActions } from './ReservationActions'
import { formatReservationDate, reservationStatusLabel, reservationStatusVariant } from './reservationPresentation'

type ReservationDetailsModalProps = {
  id: number
  role: string | null | undefined
  busy: boolean
  onClose: () => void
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onCancel: (id: number) => void
}

export function ReservationDetailsModal({ id, role, busy, onClose, onApprove, onReject, onCancel }: ReservationDetailsModalProps) {
  const detail = useReservationDetail(id)
  const status = (detail.error as { response?: { status?: number } } | null)?.response?.status
  return <Modal title={`Reserva #${id}`} onClose={onClose} busy={busy}>
    {detail.isPending ? <LoadingState label="Cargando detalle de reserva..." /> : null}
    {detail.isError ? <ErrorState title={status === 404 ? 'Reserva no encontrada' : 'No fue posible cargar la reserva'} message={getErrorMessage(detail.error)} action={<button type="button" onClick={() => void detail.refetch()}>Reintentar</button>} /> : null}
    {detail.data ? <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><StatusBadge variant={reservationStatusVariant(detail.data.status)}>{reservationStatusLabel(detail.data.status)}</StatusBadge><span className="text-sm text-foreground-muted">Creada: {formatReservationDate(detail.data.createdAt)}</span></div>
      <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <Detail label="Recurso" value={[detail.data.resource.name, detail.data.resource.location].filter(Boolean).join(' · ')} />
        <Detail label="Solicitante" value={`${detail.data.requester.fullName} · ${detail.data.requester.email}`} />
        <Detail label="Inicio" value={formatReservationDate(detail.data.startAt)} />
        <Detail label="Fin" value={formatReservationDate(detail.data.endAt)} />
        <Detail label="Propósito" value={detail.data.purpose} />
        <Detail label="Asistentes estimados" value={detail.data.estimatedAttendees?.toString() ?? 'Sin registro'} />
        <Detail label="Notas" value={detail.data.notes ?? 'Sin notas'} />
        <Detail label="Evento" value={detail.data.event ? detail.data.event.title : 'Sin evento asociado'} />
        <Detail label="Aprobador" value={detail.data.approvedBy ? `${detail.data.approvedBy.fullName} · ${detail.data.approvedBy.email}` : 'Sin aprobación'} />
        <Detail label="Aprobada" value={formatReservationDate(detail.data.approvedAt)} />
        <Detail label="Motivo de rechazo" value={detail.data.rejectionReason ?? 'Sin rechazo'} />
        <Detail label="Cancelada" value={formatReservationDate(detail.data.cancelledAt)} />
      </dl>
      <ReservationActions status={detail.data.status} role={role} disabled={busy} onApprove={() => onApprove(detail.data.id)} onReject={() => onReject(detail.data.id)} onCancel={() => onCancel(detail.data.id)} />
    </div> : null}
  </Modal>
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-semibold text-foreground-muted">{label}</dt><dd className="mt-1 text-foreground">{value}</dd></div>
}
