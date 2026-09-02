import type { AffiliateRequestStatus } from '../model/affiliateRequests.types'

function isApplicableEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

type AffiliateRequestsFiltersProps = {
  search: string
  email: string
  identification: string
  status: AffiliateRequestStatus | ''
  onSearchChange: (value: string) => void
  onEmailChange: (value: string) => void
  onEmailApply: (value: string) => void
  onIdentificationChange: (value: string) => void
  onStatusChange: (value: AffiliateRequestStatus | '') => void
  onClear: () => void
}

export function AffiliateRequestsFilters({
  search,
  email,
  identification,
  status,
  onSearchChange,
  onEmailChange,
  onEmailApply,
  onIdentificationChange,
  onStatusChange,
  onClear,
}: AffiliateRequestsFiltersProps) {
  const hasFilterInput = Boolean(search || email || identification || status)

  return (
    <form className="grid gap-4 rounded-surface border border-border-default bg-surface-card p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end" onSubmit={(event) => event.preventDefault()}>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-text-primary">
        Búsqueda
        <input className="min-h-10 rounded-control border border-border-default bg-surface-base px-3 text-text-primary" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Nombre, identificación o correo" />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-text-primary">
        Correo electrónico
        <input className="min-h-10 rounded-control border border-border-default bg-surface-base px-3 text-text-primary" type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} onBlur={(event) => {
          if (isApplicableEmail(event.currentTarget.value)) onEmailApply(event.currentTarget.value)
        }} placeholder="correo@ejemplo.cr" />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-text-primary">
        Identificación
        <input className="min-h-10 rounded-control border border-border-default bg-surface-base px-3 text-text-primary" type="text" value={identification} onChange={(event) => onIdentificationChange(event.target.value)} placeholder="Número de identificación" />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-text-primary">
        Estado
        <select className="min-h-10 rounded-control border border-border-default bg-surface-base px-3 text-text-primary" value={status} onChange={(event) => onStatusChange(event.target.value as AffiliateRequestStatus | '')}>
          <option value="">Todas</option>
          <option value="PENDING">Pendiente</option>
          <option value="APPROVED">Aprobada</option>
          <option value="REJECTED">Rechazada</option>
        </select>
      </label>
      <button className="min-h-10 rounded-control border border-border-default px-4 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={onClear} disabled={!hasFilterInput}>
        Limpiar filtros
      </button>
    </form>
  )
}
