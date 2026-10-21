import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { Button } from '@/shared/ui/button'
import { useAffiliateRequestsList } from '../hooks/useAffiliateRequestsQueries'
import type { AffiliateRequestStatus } from '../model/affiliateRequests.types'
import { AffiliateRequestsFilters } from './AffiliateRequestsFilters'
import { AffiliateRequestDetail } from './AffiliateRequestDetail'
import { AffiliateRequestsTable } from './AffiliateRequestsTable'

const limit = 20

export function AffiliateRequestsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [email, setEmail] = useState('')
  const [identification, setIdentification] = useState('')
  const [status, setStatus] = useState<AffiliateRequestStatus | ''>('')
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const listQuery = useAffiliateRequestsList({ search, email, identification, status: status || undefined, page, limit })
  const requests = listQuery.data?.data ?? []
  const total = listQuery.data?.total ?? 0
  const hasFilters = Boolean(search.trim() || email || identification.trim() || status)

  const updateFilter = (update: () => void) => {
    setPage(1)
    update()
  }
  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setEmailDraft('')
    setEmail('')
    setIdentification('')
    setStatus('')
  }

  return (
    <section className="space-y-8">
      <PageHeader context="Administración · Afiliaciones" title="Solicitudes de afiliación" description="Revise, filtre y gestione las solicitudes recibidas." />
      <section aria-labelledby="affiliate-request-filters-heading">
        <AffiliateRequestsFilters
          search={search}
          email={emailDraft}
          appliedEmail={email}
          identification={identification}
          status={status}
          onSearchChange={(value) => updateFilter(() => setSearch(value))}
          onEmailChange={(value) => {
            setEmailDraft(value)
            if (!value) updateFilter(() => setEmail(''))
          }}
          onEmailApply={(value) => updateFilter(() => setEmail(value.trim()))}
          onIdentificationChange={(value) => updateFilter(() => setIdentification(value))}
          onStatusChange={(value) => updateFilter(() => setStatus(value))}
          onClear={clearFilters}
        />
      </section>
      {listQuery.isPending ? (
        <LoadingState label="Cargando solicitudes de afiliación..." />
      ) : listQuery.isError ? (
        <ErrorState message={getErrorMessage(listQuery.error, 'No fue posible cargar las solicitudes de afiliación.')} action={<Button type="button" variant="outline" onClick={() => void listQuery.refetch()}>Reintentar</Button>} />
      ) : requests.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No hay resultados para estos filtros' : 'No hay solicitudes de afiliación'}
          description={hasFilters ? 'Pruebe con otros criterios o limpie los filtros.' : 'Aún no se han recibido solicitudes de afiliación.'}
          action={hasFilters ? <Button type="button" variant="outline" onClick={clearFilters}>Limpiar filtros</Button> : undefined}
        />
      ) : (
        <section className="space-y-4" aria-labelledby="affiliate-request-results-heading">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 id="affiliate-request-results-heading" className="text-heading-2 font-bold text-text-primary">Resultados</h2>
              <p className="text-body-small text-text-secondary" aria-live="polite">{total} {total === 1 ? 'solicitud encontrada' : 'solicitudes encontradas'}</p>
            </div>
            <p className="text-caption text-text-secondary">Seleccione una solicitud para revisar sus datos.</p>
          </div>
          <AffiliateRequestsTable requests={requests} onView={setSelectedRequestId} />
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </section>
      )}
      {selectedRequestId !== null && <AffiliateRequestDetail key={selectedRequestId} requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} />}
    </section>
  )
}
