import { Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
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
    <form className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_auto] md:items-end" onSubmit={(event) => event.preventDefault()}>
      <div className="min-w-0">
        <label htmlFor="affiliate-search" className="flex min-w-0 flex-col gap-1.5 text-label font-semibold text-text-primary">
          Búsqueda
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <Input
              id="affiliate-search"
              className="!pl-11"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Nombre, identificación o correo"
              aria-describedby="affiliate-search-hint"
            />
          </span>
        </label>
        <span id="affiliate-search-hint" className="sr-only">La búsqueda se aplica mientras escribe.</span>
      </div>
      <label className="flex min-w-0 flex-col gap-1.5 text-label font-semibold text-text-primary">
        Estado
        <Select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as AffiliateStatus | '')}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </Select>
      </label>
      <Button className="w-full md:w-auto" variant="outline" type="button" onClick={onClear} disabled={!hasFilters}>
        Limpiar filtros
      </Button>
    </form>
  )
}
