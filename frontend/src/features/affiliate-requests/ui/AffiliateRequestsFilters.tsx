import { useId } from 'react'
import type { AffiliateRequestStatus } from '../model/affiliateRequests.types'
import { Button } from '@/shared/ui/button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { SearchFilterBar, SearchInput } from '@/shared/ui/SearchFilterBar'
import { Select } from '@/shared/ui/select'

function isApplicableEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

const statusLabels: Record<AffiliateRequestStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

type AffiliateRequestsFiltersProps = {
  search: string
  email: string
  appliedEmail: string
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
  appliedEmail,
  identification,
  status,
  onSearchChange,
  onEmailChange,
  onEmailApply,
  onIdentificationChange,
  onStatusChange,
  onClear,
}: AffiliateRequestsFiltersProps) {
  const searchId = useId()
  const emailId = useId()
  const identificationId = useId()
  const statusId = useId()
  const normalizedEmail = email.trim()
  const emailIsInvalid = Boolean(normalizedEmail && !isApplicableEmail(email))
  const emailIsApplied = Boolean(appliedEmail && appliedEmail === normalizedEmail)
  const hasFilterInput = Boolean(search || email || identification || status)
  const activeFilters = [
    search && `Búsqueda: ${search}`,
    appliedEmail && `Correo: ${appliedEmail}`,
    identification && `Identificación: ${identification}`,
    status && `Estado: ${statusLabels[status]}`,
  ].filter((filter): filter is string => Boolean(filter))

  const applyEmail = () => {
    if (isApplicableEmail(email)) onEmailApply(email)
  }

  return (
    <section className="rounded-surface border border-border-default bg-surface-card p-4 shadow-sm sm:p-5" aria-labelledby="affiliate-request-filters-heading">
      <div className="mb-4 flex flex-col gap-1 border-b border-border-subtle pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 id="affiliate-request-filters-heading" className="text-heading-3 font-semibold text-text-primary">Filtrar solicitudes</h2>
          <p className="text-body-small text-text-secondary">Los cambios en búsqueda, identificación y estado se aplican de inmediato.</p>
        </div>
        <p className="text-caption text-text-secondary">Presione Enter para aplicar correo.</p>
      </div>
      <SearchFilterBar label="Filtrar solicitudes de afiliación" role="search" controlsClassName="lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); applyEmail() }} actions={
        <Button variant="outline" className="w-full md:w-auto" type="button" onClick={onClear} disabled={!hasFilterInput}>
          Limpiar filtros
        </Button>
      }>
      <FormField id={searchId} label="Búsqueda" className="min-w-0">
        <SearchInput value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Nombre, identificación o correo" />
      </FormField>
      <FormField id={emailId} label="Correo electrónico" description={emailIsApplied ? `Aplicado: ${appliedEmail}` : 'Se aplica al salir del campo o al presionar Enter.'} error={emailIsInvalid ? 'Ingrese un correo válido para aplicarlo.' : undefined} className="min-w-0">
        <Input type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} onBlur={applyEmail} placeholder="correo@ejemplo.cr" />
      </FormField>
      <FormField id={identificationId} label="Identificación" className="min-w-0">
        <Input type="text" value={identification} onChange={(event) => onIdentificationChange(event.target.value)} placeholder="Número de identificación" />
      </FormField>
      <FormField id={statusId} label="Estado" className="min-w-0">
        <Select value={status} onChange={(event) => onStatusChange(event.target.value as AffiliateRequestStatus | '')}>
          <option value="">Todas</option>
          <option value="PENDING">Pendiente</option>
          <option value="APPROVED">Aprobada</option>
          <option value="REJECTED">Rechazada</option>
        </Select>
      </FormField>
      </SearchFilterBar>
      {activeFilters.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3" aria-live="polite"><span className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Filtros aplicados</span>{activeFilters.map((filter) => <span key={filter} className="rounded-full bg-surface-muted px-2.5 py-1 text-caption font-medium text-text-primary">{filter}</span>)}</div>}
    </section>
  )
}
