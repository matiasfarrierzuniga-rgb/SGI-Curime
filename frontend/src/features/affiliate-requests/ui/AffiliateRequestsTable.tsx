import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/ui/button'
import type { AffiliateRequest, AffiliateRequestStatus } from '../model/affiliateRequests.types'

type AffiliateRequestsTableProps = {
  requests: AffiliateRequest[]
  onView: (id: number) => void
}

const statusPresentation: Record<AffiliateRequestStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'danger' },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))
}

function formatPhone(phoneCountryCode: string | null, phoneNationalNumber: string | null, phone: string | null) {
  if (phoneNationalNumber?.trim()) return [phoneCountryCode?.trim(), phoneNationalNumber.trim()].filter(Boolean).join(' ')
  return phone
}

export function AffiliateRequestsTable({ requests, onView }: AffiliateRequestsTableProps) {
  return (
    <div className="overflow-x-auto rounded-surface border border-border-default bg-surface-card" tabIndex={0} aria-label="Tabla de solicitudes de afiliación, desplazable horizontalmente">
      <table className="min-w-[48rem] w-full text-left text-body-small">
        <caption className="sr-only">Listado de solicitudes de afiliación</caption>
        <thead className="bg-surface-muted text-caption uppercase tracking-wide text-text-secondary">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Persona solicitante</th>
            <th scope="col" className="px-4 py-3 font-semibold">Identificación</th>
            <th scope="col" className="px-4 py-3 font-semibold">Contacto</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Recibida</th>
            <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
            <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
          {requests.map((request) => {
            const status = statusPresentation[request.status]
            const phone = formatPhone(request.phoneCountryCode, request.phoneNationalNumber, request.phone)

            return (
              <tr key={request.id} className="transition-colors hover:bg-surface-muted/60 focus-within:bg-surface-muted/80">
                <td className="px-4 py-3.5 font-semibold text-text-primary">{request.fullName}</td>
                <td className="px-4 py-3.5 tabular-nums text-text-secondary">{request.identification}</td>
                <td className="px-4 py-3.5 text-text-secondary">
                  {request.email || phone ? <div className="space-y-0.5 break-words"><p>{request.email}</p><p>{phone}</p></div> : 'Sin contacto'}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-text-secondary">{formatDate(request.createdAt)}</td>
                <td className="px-4 py-3.5"><StatusBadge variant={status.variant}>{status.label}</StatusBadge></td>
                <td className="px-4 py-3.5 text-right"><Button size="sm" variant="outline" type="button" aria-label={`Ver solicitud de ${request.fullName}`} onClick={() => onView(request.id)}>Ver</Button></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
