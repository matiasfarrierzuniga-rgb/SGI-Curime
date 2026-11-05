import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { AdministrativeListLayout, AdministrativeListResults } from '@/shared/ui/AdministrativeListLayout'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { Button } from '@/shared/ui/button'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { useAffiliateRequestsList } from '../hooks/useAffiliateRequestsQueries'
import type { AffiliateRequestStatus } from '../model/affiliateRequests.types'
import { AffiliateRequestsFilters } from './AffiliateRequestsFilters'
import { AffiliateRequestDetail } from './AffiliateRequestDetail'
import { AffiliateRequestsTable } from './AffiliateRequestsTable'

const limit = 20

export function AffiliateRequestsPage() {
  const { user } = useAuth()
  const canApprove = hasCapability(user?.permissionCodes, 'padron.application.approve')
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
    <AdministrativeListLayout
      header={<PageHeader className="gap-4 pb-5" context="Administración · Afiliaciones" title="Solicitudes de afiliación" description="Revise, filtre y gestione las solicitudes recibidas." />}
      filters={<AffiliateRequestsFilters
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
        />}
    >
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
        <AdministrativeListResults count={`${total} ${total === 1 ? 'solicitud encontrada' : 'solicitudes encontradas'}`} actions="Seleccione una solicitud para revisar sus datos.">
          <AffiliateRequestsTable requests={requests} onView={setSelectedRequestId} />
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </AdministrativeListResults>
      )}
      {selectedRequestId !== null && <AffiliateRequestDetail key={selectedRequestId} requestId={selectedRequestId} canApprove={canApprove} onClose={() => setSelectedRequestId(null)} />}
    </AdministrativeListLayout>
  )
}
