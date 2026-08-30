import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useAffiliateRequestDetail } from '../hooks/useAffiliateRequestsQueries'
import type { AffiliateRequestStatus } from '../model/affiliateRequests.types'

const statusPresentation: Record<AffiliateRequestStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'danger' },
}

function valueOrFallback(value: string | null | undefined) {
  return value?.trim() || 'No especificado'
}

function formatBirthDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))
}

function formatTimestamp(value: string | null) {
  return value ? new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value)) : 'No especificado'
}

function formatPhone(phoneCountryCode: string | null, phoneNationalNumber: string | null, phone: string | null) {
  if (phoneNationalNumber?.trim()) return [phoneCountryCode?.trim(), phoneNationalNumber.trim()].filter(Boolean).join(' ')
  return phone
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</dt><dd className="mt-1 break-words text-text-primary">{valueOrFallback(value)}</dd></div>
}

export function AffiliateRequestDetail({ requestId, onClose }: { requestId: number; onClose: () => void }) {
  const detailQuery = useAffiliateRequestDetail(requestId)
  const request = detailQuery.data

  return (
    <Modal title="Detalle de solicitud de afiliación" onClose={onClose}>
      <div className="max-h-[70vh] overflow-y-auto px-1 pb-1">
        {detailQuery.isPending ? (
          <LoadingState label="Cargando detalle de solicitud..." />
        ) : detailQuery.isError ? (
          <ErrorState title="No fue posible cargar la solicitud" message={getErrorMessage(detailQuery.error, 'Intente nuevamente.')} action={<button className="min-h-10 rounded-control border border-border-default px-4 font-semibold" type="button" onClick={() => void detailQuery.refetch()}>Reintentar</button>} />
        ) : request ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4">
              <div><p className="text-sm text-text-secondary">Solicitud #{request.id}</p><p className="font-heading text-heading-3 text-text-primary">{request.fullName}</p></div>
              <StatusBadge variant={statusPresentation[request.status].variant}>{statusPresentation[request.status].label}</StatusBadge>
            </div>
            <section aria-labelledby="identity-heading"><h3 id="identity-heading" className="font-heading text-heading-4 text-text-primary">Identidad</h3><dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Identificación" value={request.identification} /><DetailField label="Tipo de identificación" value={request.identificationType} /><DetailField label="Fecha de nacimiento" value={formatBirthDate(request.birthDate)} /><DetailField label="Género" value={request.gender} /></dl></section>
            <section aria-labelledby="contact-heading"><h3 id="contact-heading" className="font-heading text-heading-4 text-text-primary">Contacto</h3><dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Correo electrónico" value={request.email} /><DetailField label="Teléfono" value={formatPhone(request.phoneCountryCode, request.phoneNationalNumber, request.phone)} /><DetailField label="Dirección" value={request.address} /></dl></section>
            <section aria-labelledby="employment-heading"><h3 id="employment-heading" className="font-heading text-heading-4 text-text-primary">Información laboral</h3><dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Ocupación" value={request.occupation} /><DetailField label="Lugar de trabajo" value={request.workplace} /></dl></section>
            <section aria-labelledby="request-heading"><h3 id="request-heading" className="font-heading text-heading-4 text-text-primary">Solicitud</h3><dl className="mt-3 grid gap-4"><DetailField label="Motivo de afiliación" value={request.affiliationReason} /></dl></section>
            <section aria-labelledby="review-heading"><h3 id="review-heading" className="font-heading text-heading-4 text-text-primary">Revisión</h3><dl className="mt-3 grid gap-4 sm:grid-cols-2"><DetailField label="Revisada el" value={formatTimestamp(request.reviewedAt)} /><DetailField label="Revisada por" value={request.reviewedBy ? `${request.reviewedBy.fullName} (${request.reviewedBy.email})` : null} />{request.status === 'REJECTED' && <DetailField label="Motivo de rechazo" value={request.rejectionReason} />}</dl></section>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
