import { StatusBadge } from '@/shared/ui/StatusBadge'
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
    <div className="overflow-x-auto rounded-surface border border-border-default" tabIndex={0} aria-label="Tabla de afiliados, desplazable horizontalmente">
      <table className="min-w-225 w-full text-left text-sm">
        <thead className="bg-surface-muted text-text-secondary">
          <tr>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Identificación</th>
            <th className="px-4 py-3 font-semibold">Contacto</th>
            <th className="px-4 py-3 font-semibold">Tipo de afiliado</th>
            <th className="px-4 py-3 font-semibold">Fecha de afiliación</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
            <th className="px-4 py-3 font-semibold"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
          {affiliates.map((affiliate) => (
            <tr key={affiliate.id}>
              <td className="px-4 py-3 font-medium">{affiliate.fullName}</td>
              <td className="px-4 py-3">{affiliate.identification}</td>
              <td className="px-4 py-3">{affiliate.email ?? affiliate.phone ?? 'Sin contacto'}</td>
              <td className="px-4 py-3">{affiliate.affiliateType ?? 'Sin especificar'}</td>
              <td className="px-4 py-3">{formatDate(affiliate.affiliationDate)}</td>
              <td className="px-4 py-3">
                <StatusBadge variant={affiliate.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {affiliateStatusLabel[affiliate.status]}
                </StatusBadge>
              </td>
              <td className="px-4 py-3"><button className="min-h-10 rounded-control px-3 font-semibold text-brand-primary" type="button" onClick={() => onOpen(affiliate.id)}>Ver detalle</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
