import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { Button } from '@/shared/ui/button'
import { useAffiliatesList } from '../hooks/useAffiliatesQueries'
import type { Affiliate, AffiliateStatus } from '../model/affiliates.types'
import { AffiliateFilters } from './AffiliateFilters'
import { AffiliateDetailsModal } from './AffiliateDetailsModal'
import { EditAffiliateModal } from './EditAffiliateModal'
import { AffiliatesTable } from './AffiliatesTable'

const limit = 20

export function AffiliatesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AffiliateStatus | ''>('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null)
  const listQuery = useAffiliatesList({ search, status: status || undefined, page, limit })
  const affiliates = listQuery.data?.data ?? []
  const total = listQuery.data?.total ?? 0

  const resetPage = () => setPage(1)
  const clearFilters = () => {
    resetPage()
    setSearch('')
    setStatus('')
  }

  return (
    <section className="min-w-0 space-y-8">
      <PageHeader context="Gestión administrativa" title="Afiliados" description="Consulte y filtre el registro administrativo de afiliados." />
      <section aria-labelledby="affiliate-filters-heading" className="space-y-3">
        <div>
          <h2 id="affiliate-filters-heading" className="text-heading-3 font-semibold text-text-primary">Filtros</h2>
          <p className="mt-1 text-body-small text-text-secondary">Refine resultados por datos de contacto, identificación o estado.</p>
        </div>
        <AffiliateFilters
          search={search}
          status={status}
          onSearchChange={(value) => {
            resetPage()
            setSearch(value)
          }}
          onStatusChange={(value) => {
            resetPage()
            setStatus(value)
          }}
          onClear={clearFilters}
        />
      </section>
      {listQuery.isPending ? (
        <LoadingState label="Cargando afiliados..." />
      ) : listQuery.isError ? (
        <ErrorState message={getErrorMessage(listQuery.error, 'No fue posible cargar los afiliados.')} action={<Button variant="outline" type="button" onClick={() => void listQuery.refetch()}>Reintentar</Button>} />
      ) : affiliates.length === 0 ? (
        <EmptyState title="No hay afiliados" description="No hay afiliados que coincidan con los filtros aplicados." action={search || status ? <Button variant="outline" type="button" onClick={clearFilters}>Limpiar filtros</Button> : undefined} />
      ) : (
        <section aria-labelledby="affiliate-results-heading" className="min-w-0 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 id="affiliate-results-heading" className="text-heading-3 font-semibold text-text-primary">Resultados</h2>
              <p className="text-body-small text-text-secondary">Revise datos de contacto, afiliación y estado antes de abrir un expediente.</p>
            </div>
            <p className="text-body-small font-semibold tabular-nums text-text-secondary">{total} {total === 1 ? 'afiliado' : 'afiliados'}</p>
          </div>
          <AffiliatesTable affiliates={affiliates} onOpen={setSelectedId} />
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </section>
      )}
      {selectedId !== null && <AffiliateDetailsModal id={selectedId} onClose={() => setSelectedId(null)} onEdit={(affiliate) => { setSelectedId(null); setEditingAffiliate(affiliate) }} />}
      {editingAffiliate && <EditAffiliateModal affiliate={editingAffiliate} onClose={() => setEditingAffiliate(null)} />}
    </section>
  )
}
