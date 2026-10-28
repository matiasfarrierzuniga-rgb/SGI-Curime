import { ChevronRight } from 'lucide-react'
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

const avatarTones = [
  'bg-brand-primary/15 text-brand-primary',
  'bg-brand-accent/25 text-brand-brown',
  'bg-status-info-surface text-status-info',
  'bg-status-success-surface text-status-success',
] as const

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase()
}

function avatarTone(fullName: string) {
  const value = Array.from(fullName).reduce((total, character) => total + character.charCodeAt(0), 0)
  return avatarTones[value % avatarTones.length]
}

function AffiliateAvatar({ fullName }: { fullName: string }) {
  return <span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-full text-caption font-bold ${avatarTone(fullName)}`}>{initials(fullName)}</span>
}

export function AffiliatesTable({ affiliates, onOpen }: AffiliatesTableProps) {
  return (
    <>
      <div className="hidden max-w-full overflow-x-auto rounded-control border border-border-default bg-surface-card focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus md:block" tabIndex={0} aria-label="Tabla de afiliados, desplazable horizontalmente">
        <table className="min-w-[68rem] w-full border-collapse text-left text-body-small">
          <caption className="sr-only">Listado de afiliados</caption>
          <thead className="bg-surface-muted text-caption uppercase tracking-[0.08em] text-text-secondary">
            <tr>
              <th scope="col" className="min-w-56 px-3 py-2.5 font-bold">Nombre</th>
              <th scope="col" className="whitespace-nowrap px-3 py-2.5 font-bold">Identificación</th>
              <th scope="col" className="min-w-52 px-3 py-2.5 font-bold">Contacto</th>
              <th scope="col" className="min-w-36 px-3 py-2.5 font-bold">Tipo de afiliado</th>
              <th scope="col" className="whitespace-nowrap px-3 py-2.5 font-bold">Fecha de afiliación</th>
              <th scope="col" className="px-3 py-2.5 font-bold">Estado</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
            {affiliates.map((affiliate) => (
              <tr key={affiliate.id} className="align-middle transition-colors hover:bg-surface-muted/60 focus-within:bg-surface-muted/80">
                <td className="px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <AffiliateAvatar fullName={affiliate.fullName} />
                    <span className="min-w-0 font-semibold text-text-primary">{affiliate.fullName}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium tabular-nums">{affiliate.identification}</td>
                <td className="px-3 py-2.5">
                  {affiliate.email || affiliate.phone ? (
                    <div className="space-y-0.5">
                      {affiliate.email && <div className="max-w-52 truncate" title={affiliate.email}>{affiliate.email}</div>}
                      {affiliate.phone && <div className="text-caption text-text-secondary">{affiliate.phone}</div>}
                    </div>
                  ) : <span className="text-text-secondary">Sin contacto</span>}
                </td>
                <td className="px-3 py-2.5">{affiliate.affiliateType ?? 'Sin especificar'}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatDate(affiliate.affiliationDate)}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge variant={affiliate.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {affiliateStatusLabel[affiliate.status]}
                  </StatusBadge>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right"><Button variant="outline" size="sm" type="button" onClick={() => onOpen(affiliate.id)}>Ver detalle</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2 md:hidden" aria-label="Listado de afiliados">
        {affiliates.map((affiliate) => (
          <li key={affiliate.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-control border border-border-default bg-surface-card p-3 text-left transition-colors hover:bg-surface-muted/60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
              onClick={() => onOpen(affiliate.id)}
              aria-label={`Ver detalle de ${affiliate.fullName}, ${affiliateStatusLabel[affiliate.status]}`}
            >
              <AffiliateAvatar fullName={affiliate.fullName} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-small font-semibold text-text-primary">{affiliate.fullName}</span>
                <span className="mt-0.5 block text-caption tabular-nums text-text-secondary">{affiliate.identification}</span>
                <span className="mt-0.5 block text-caption text-text-secondary">{formatDate(affiliate.affiliationDate)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge variant={affiliate.status === 'ACTIVE' ? 'success' : 'neutral'}>{affiliateStatusLabel[affiliate.status]}</StatusBadge>
                <ChevronRight className="size-4 text-text-secondary" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
