import { Button } from '@/shared/ui/button'
import { FormField } from '@/shared/ui/FormField'
import { SearchFilterBar, SearchInput } from '@/shared/ui/SearchFilterBar'
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
    <SearchFilterBar className="border-y border-border-default py-4" controlsClassName="md:grid-cols-[minmax(0,1fr)_12rem]" label="Buscar y filtrar afiliados" role="search" onSubmit={(event) => event.preventDefault()} actions={
      <Button className="w-full md:w-auto" variant="outline" type="button" onClick={onClear} disabled={!hasFilters}>
        Limpiar filtros
      </Button>
    }>
      <FormField id="affiliate-search" label="Búsqueda" description="La búsqueda se aplica mientras escribe." className="min-w-0">
        <SearchInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Nombre, identificación o correo"
        />
      </FormField>
      <FormField id="affiliate-status" label="Estado" className="min-w-0">
        <Select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as AffiliateStatus | '')}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </Select>
      </FormField>
    </SearchFilterBar>
  )
}
