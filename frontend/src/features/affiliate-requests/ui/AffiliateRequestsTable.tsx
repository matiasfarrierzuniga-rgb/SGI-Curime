import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/ui/button'
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
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
    <DataTable className="min-w-[48rem]" scrollLabel="En pantallas estrechas, desplaza horizontalmente para ver más columnas de solicitudes de afiliación">
      <caption className="sr-only">Listado de solicitudes de afiliación</caption>
      <DataTableHeader>
        <DataTableRow className="hover:bg-surface-muted">
          <DataTableHead>Persona solicitante</DataTableHead>
          <DataTableHead>Identificación</DataTableHead>
          <DataTableHead>Contacto</DataTableHead>
          <DataTableHead className="whitespace-nowrap">Recibida</DataTableHead>
          <DataTableHead>Estado</DataTableHead>
          <DataTableHead className="text-right"><span className="sr-only">Acciones</span></DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
          {requests.map((request) => {
            const status = statusPresentation[request.status]
            const phone = formatPhone(request.phoneCountryCode, request.phoneNationalNumber, request.phone)

            return (
              <DataTableRow key={request.id} className="focus-within:bg-surface-muted/80">
                <DataTableCell className="font-semibold text-text-primary">{request.fullName}</DataTableCell>
                <DataTableCell className="tabular-nums text-text-secondary">{request.identification}</DataTableCell>
                <DataTableCell className="text-text-secondary">
                  {request.email || phone ? <div className="space-y-0.5 break-words"><p>{request.email}</p><p>{phone}</p></div> : 'Sin contacto'}
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap text-text-secondary">{formatDate(request.createdAt)}</DataTableCell>
                <DataTableCell><StatusBadge variant={status.variant}>{status.label}</StatusBadge></DataTableCell>
                <DataTableCell className="text-right"><Button size="sm" variant="outline" type="button" aria-label={`Ver solicitud de ${request.fullName}`} onClick={() => onView(request.id)}>Ver</Button></DataTableCell>
              </DataTableRow>
            )
          })}
      </DataTableBody>
    </DataTable>
  )
}
