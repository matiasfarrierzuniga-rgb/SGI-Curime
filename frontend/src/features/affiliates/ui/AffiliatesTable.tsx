import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/ui/button'
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
import { affiliateStatusLabel } from '../model/affiliateStatus'
import type { Affiliate } from '../model/affiliates.types'

type AffiliatesTableProps = {
  affiliates: Affiliate[]
  onOpen: (id: number) => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))
}

export function AffiliatesTable({ affiliates, onOpen }: AffiliatesTableProps) {
  return (
    <DataTable className="min-w-[56.25rem]" scrollLabel="En pantallas estrechas, desplaza horizontalmente para ver más columnas de afiliados">
      <caption className="sr-only">Listado de afiliados</caption>
      <DataTableHeader>
        <DataTableRow className="hover:bg-surface-muted">
          <DataTableHead>Nombre</DataTableHead>
          <DataTableHead>Identificación</DataTableHead>
          <DataTableHead>Contacto</DataTableHead>
          <DataTableHead>Tipo de afiliado</DataTableHead>
          <DataTableHead className="whitespace-nowrap">Fecha de afiliación</DataTableHead>
          <DataTableHead>Estado</DataTableHead>
          <DataTableHead className="text-right"><span className="sr-only">Acciones</span></DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
          {affiliates.map((affiliate) => (
            <DataTableRow key={affiliate.id} className="focus-within:bg-surface-muted/80">
              <DataTableCell className="font-semibold text-text-primary">{affiliate.fullName}</DataTableCell>
              <DataTableCell className="whitespace-nowrap font-medium tabular-nums">{affiliate.identification}</DataTableCell>
              <DataTableCell>
                {affiliate.email || affiliate.phone ? (
                  <div className="space-y-0.5">
                    {affiliate.email && <div className="max-w-56 truncate" title={affiliate.email}>{affiliate.email}</div>}
                    {affiliate.phone && <div className="text-caption text-text-secondary">{affiliate.phone}</div>}
                  </div>
                ) : 'Sin contacto'}
              </DataTableCell>
              <DataTableCell>{affiliate.affiliateType ?? 'Sin especificar'}</DataTableCell>
              <DataTableCell className="whitespace-nowrap tabular-nums">{formatDate(affiliate.affiliationDate)}</DataTableCell>
              <DataTableCell>
                <StatusBadge variant={affiliate.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {affiliateStatusLabel[affiliate.status]}
                </StatusBadge>
              </DataTableCell>
              <DataTableCell className="text-right"><Button variant="ghost" size="sm" type="button" onClick={() => onOpen(affiliate.id)}>Ver detalle</Button></DataTableCell>
            </DataTableRow>
          ))}
      </DataTableBody>
    </DataTable>
  )
}
