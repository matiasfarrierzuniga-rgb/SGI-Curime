import { useId } from 'react'
import type { AffiliateRequestStatus } from '../model/affiliateRequests.types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
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
    <form className="rounded-surface border border-border-default bg-surface-card p-4 shadow-sm sm:p-5" onSubmit={(event) => { event.preventDefault(); applyEmail() }}>
      <div className="mb-4 flex flex-col gap-1 border-b border-border-subtle pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 id="affiliate-request-filters-heading" className="text-heading-3 font-semibold text-text-primary">Filtrar solicitudes</h2>
          <p className="text-body-small text-text-secondary">Los cambios en búsqueda, identificación y estado se aplican de inmediato.</p>
        </div>
        <p className="text-caption text-text-secondary">Presione Enter para aplicar correo.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={searchId} className="text-label font-semibold text-text-primary">Búsqueda</label>
        <Input id={searchId} className="bg-surface-base text-text-primary" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Nombre, identificación o correo" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={emailId} className="text-label font-semibold text-text-primary">Correo electrónico</label>
        <Input id={emailId} className="bg-surface-base text-text-primary" type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} onBlur={applyEmail} aria-describedby="email-filter-feedback" aria-invalid={emailIsInvalid} placeholder="correo@ejemplo.cr" />
        <span id="email-filter-feedback" className={emailIsInvalid ? 'text-caption font-medium text-danger' : 'text-caption text-text-secondary'} role={emailIsInvalid ? 'alert' : undefined}>
          {emailIsInvalid ? 'Ingrese un correo válido para aplicarlo.' : emailIsApplied ? `Aplicado: ${appliedEmail}` : 'Se aplica al salir del campo o al presionar Enter.'}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={identificationId} className="text-label font-semibold text-text-primary">Identificación</label>
        <Input id={identificationId} className="bg-surface-base text-text-primary" type="text" value={identification} onChange={(event) => onIdentificationChange(event.target.value)} placeholder="Número de identificación" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={statusId} className="text-label font-semibold text-text-primary">Estado</label>
        <Select id={statusId} className="bg-surface-base text-text-primary" value={status} onChange={(event) => onStatusChange(event.target.value as AffiliateRequestStatus | '')}>
          <option value="">Todas</option>
          <option value="PENDING">Pendiente</option>
          <option value="APPROVED">Aprobada</option>
          <option value="REJECTED">Rechazada</option>
        </Select>
      </div>
      <Button variant="outline" className="w-full self-end sm:w-auto" type="button" onClick={onClear} disabled={!hasFilterInput}>
        Limpiar filtros
      </Button>
      </div>
      {activeFilters.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3" aria-live="polite"><span className="text-caption font-semibold uppercase tracking-wide text-text-secondary">Filtros aplicados</span>{activeFilters.map((filter) => <span key={filter} className="rounded-full bg-surface-muted px-2.5 py-1 text-caption font-medium text-text-primary">{filter}</span>)}</div>}
    </form>
  )
}
