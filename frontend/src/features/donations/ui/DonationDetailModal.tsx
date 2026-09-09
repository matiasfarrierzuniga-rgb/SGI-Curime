import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { useDonationDetail } from '../hooks/donations.queries'
import type { Donation } from '../model/donations.types'
import { DonationStatusBadge } from './DonationStatusBadge'
import { donationMethodLabel, formatDonationAmount, formatDonationDate } from './donationPresentation'

export function DonationDetailModal({ id, onClose, onEdit, onCancel, onDelete }: { id: number; onClose: () => void; onEdit: (donation: Donation) => void; onCancel: (donation: Donation) => void; onDelete: (donation: Donation) => void }) {
  const { user } = useAuth()
  const detail = useDonationDetail(id)
  const donation = detail.data
  const confirmed = donation?.status === 'CONFIRMED'
  const mayEdit = confirmed && hasCapability(user?.role, 'don.donations.update')
  const mayCancel = confirmed && hasCapability(user?.role, 'don.donations.cancel')
  const mayDelete = confirmed && !donation?.reversalMovementId && hasCapability(user?.role, 'don.donations.delete')
  return <Modal title="Detalle de donación" onClose={onClose}>
    {detail.isPending ? <LoadingState label="Cargando donación..." /> : null}
    {detail.isError ? <ErrorState title="No fue posible cargar la donación" message={getErrorMessage(detail.error, 'Intente nuevamente.')} action={<Button type="button" variant="outline" onClick={() => void detail.refetch()}>Reintentar</Button>} /> : null}
    {donation ? <div className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-foreground-muted">Donante</p><p className="font-semibold">{donation.donorName || 'Anónima'}</p>{donation.donorIdentification ? <p className="text-sm text-foreground-muted">{donation.donorIdentification}</p> : null}</div><DonationStatusBadge status={donation.status} /></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><Detail label="Monto" value={formatDonationAmount(donation.amount, donation.currency)} /><Detail label="Moneda" value={donation.currency} /><Detail label="Método" value={donationMethodLabel(donation.method)} /><Detail label="Fecha recibida" value={formatDonationDate(donation.receivedAt)} /><Detail label="Referencia" value={donation.reference || 'Sin referencia'} /><Detail label="Registrado por" value={donation.recordedBy?.fullName ?? `Usuario #${donation.recordedById}`} /><Detail label="Fecha de creación" value={formatDonationDate(donation.createdAt)} /><Detail label="Última actualización" value={formatDonationDate(donation.updatedAt)} /></dl>{donation.description ? <section><h3 className="font-semibold">Descripción</h3><p className="mt-1 whitespace-pre-wrap text-sm">{donation.description}</p></section> : null}{donation.status === 'CANCELLED' ? <section className="space-y-2 rounded-xl border border-warning/30 bg-warning/10 p-4"><h3 className="font-semibold">Cancelación</h3><Detail label="Cancelada por" value={donation.cancelledBy?.fullName ?? (donation.cancelledById ? `Usuario #${donation.cancelledById}` : 'Sin registro')} /><Detail label="Fecha de cancelación" value={formatDonationDate(donation.cancelledAt)} /><Detail label="Motivo" value={donation.cancellationReason || 'Sin motivo registrado'} /><Detail label="Movimiento original" value={donation.originalMovementId ? `#${donation.originalMovementId}` : 'Sin registro'} /><Detail label="Movimiento de reversión" value={donation.reversalMovementId ? `#${donation.reversalMovementId}` : 'Sin registro'} /></section> : null}<div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>{mayEdit ? <Button type="button" variant="outline" onClick={() => onEdit(donation)}>Editar</Button> : null}{mayCancel ? <Button type="button" variant="destructive" onClick={() => onCancel(donation)}>Cancelar</Button> : null}{mayDelete ? <Button type="button" variant="destructive" onClick={() => onDelete(donation)}>Eliminar</Button> : null}</div></div> : null}
  </Modal>
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-foreground-muted">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>
}
