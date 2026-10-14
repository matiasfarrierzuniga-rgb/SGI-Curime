import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/ui/button'
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
    <div className="max-w-full overflow-x-auto rounded-surface border border-border-default bg-surface-card focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus" tabIndex={0} aria-label="Tabla de afiliados, desplazable horizontalmente">
      <table className="min-w-225 w-full border-collapse text-left text-body-small">
        <caption className="sr-only">Listado de afiliados</caption>
        <thead className="bg-surface-muted text-caption uppercase tracking-[0.08em] text-text-secondary">
          <tr>
            <th scope="col" className="px-4 py-3 font-bold">Nombre</th>
            <th scope="col" className="px-4 py-3 font-bold">Identificación</th>
            <th scope="col" className="px-4 py-3 font-bold">Contacto</th>
            <th scope="col" className="px-4 py-3 font-bold">Tipo de afiliado</th>
            <th scope="col" className="whitespace-nowrap px-4 py-3 font-bold">Fecha de afiliación</th>
            <th scope="col" className="px-4 py-3 font-bold">Estado</th>
            <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
          {affiliates.map((affiliate) => (
            <tr key={affiliate.id} className="transition-colors hover:bg-surface-muted/60 focus-within:bg-surface-muted/80">
              <td className="px-4 py-3.5 font-semibold text-text-primary">{affiliate.fullName}</td>
              <td className="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums">{affiliate.identification}</td>
              <td className="px-4 py-3.5">
                {affiliate.email || affiliate.phone ? (
                  <div className="space-y-0.5">
                    {affiliate.email && <div className="max-w-56 truncate" title={affiliate.email}>{affiliate.email}</div>}
                    {affiliate.phone && <div className="text-caption text-text-secondary">{affiliate.phone}</div>}
                  </div>
                ) : 'Sin contacto'}
              </td>
              <td className="px-4 py-3.5">{affiliate.affiliateType ?? 'Sin especificar'}</td>
              <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">{formatDate(affiliate.affiliationDate)}</td>
              <td className="px-4 py-3.5">
                <StatusBadge variant={affiliate.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {affiliateStatusLabel[affiliate.status]}
                </StatusBadge>
              </td>
              <td className="px-4 py-2.5 text-right"><Button variant="ghost" size="sm" type="button" onClick={() => onOpen(affiliate.id)}>Ver detalle</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
