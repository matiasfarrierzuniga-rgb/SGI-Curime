import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { AffiliateRequest, AffiliateRequestStatus } from '../model/affiliateRequests.types'

type AffiliateRequestsTableProps = {
  requests: AffiliateRequest[]
}

const statusPresentation: Record<AffiliateRequestStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'danger' },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))
}

export function AffiliateRequestsTable({ requests }: AffiliateRequestsTableProps) {
  return (
    <div className="overflow-x-auto rounded-surface border border-border-default" tabIndex={0} aria-label="Tabla de solicitudes de afiliación, desplazable horizontalmente">
      <table className="min-w-200 w-full text-left text-sm">
        <caption className="sr-only">Listado de solicitudes de afiliación</caption>
        <thead className="bg-surface-muted text-text-secondary">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Nombre</th>
            <th scope="col" className="px-4 py-3 font-semibold">Identificación</th>
            <th scope="col" className="px-4 py-3 font-semibold">Contacto</th>
            <th scope="col" className="px-4 py-3 font-semibold">Recibida</th>
            <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
          {requests.map((request) => {
            const status = statusPresentation[request.status]

            return (
              <tr key={request.id}>
                <td className="px-4 py-3 font-medium">{request.fullName}</td>
                <td className="px-4 py-3">{request.identification}</td>
                <td className="px-4 py-3">{request.email ?? request.phone ?? 'Sin contacto'}</td>
                <td className="px-4 py-3">{formatDate(request.createdAt)}</td>
                <td className="px-4 py-3"><StatusBadge variant={status.variant}>{status.label}</StatusBadge></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
