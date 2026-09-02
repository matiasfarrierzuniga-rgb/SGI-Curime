import type { AffiliateStatus } from '../model/affiliates.types'

type AffiliateFiltersProps = {
  search: string
  status: AffiliateStatus | ''
  onSearchChange: (value: string) => void
  onStatusChange: (value: AffiliateStatus | '') => void
  onClear: () => void
}

export function AffiliateFilters({ search, status, onSearchChange, onStatusChange, onClear }: AffiliateFiltersProps) {
  const hasFilters = Boolean(search || status)

  return (
    <form className="flex flex-col gap-4 rounded-surface border border-border-default bg-surface-card p-4 sm:flex-row sm:items-end" onSubmit={(event) => event.preventDefault()}>
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-text-primary">
        Búsqueda
        <input
          className="min-h-10 rounded-control border border-border-default bg-surface-base px-3 text-text-primary"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Nombre, identificación o correo"
        />
      </label>
      <label className="flex min-w-40 flex-col gap-1 text-sm font-medium text-text-primary">
        Estado
        <select
          className="min-h-10 rounded-control border border-border-default bg-surface-base px-3 text-text-primary"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as AffiliateStatus | '')}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </label>
      <button className="min-h-10 rounded-control border border-border-default px-4 text-sm font-semibold text-text-primary disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={onClear} disabled={!hasFilters}>
        Limpiar filtros
      </button>
    </form>
  )
}
