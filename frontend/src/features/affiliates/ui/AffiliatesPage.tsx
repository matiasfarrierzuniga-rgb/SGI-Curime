import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
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
    <section className="space-y-6">
      <PageHeader context="Gestión administrativa" title="Afiliados" description="Consulte y filtre el registro administrativo de afiliados." />
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
      {listQuery.isPending ? (
        <LoadingState label="Cargando afiliados..." />
      ) : listQuery.isError ? (
        <ErrorState message={getErrorMessage(listQuery.error, 'No fue posible cargar los afiliados.')} action={<button className="min-h-10 rounded-control border border-border-default px-4 font-semibold" type="button" onClick={() => void listQuery.refetch()}>Reintentar</button>} />
      ) : affiliates.length === 0 ? (
        <EmptyState title="No hay afiliados" description="No hay afiliados que coincidan con los filtros aplicados." action={search || status ? <button className="min-h-10 rounded-control border border-border-default px-4 font-semibold" type="button" onClick={clearFilters}>Limpiar filtros</button> : undefined} />
      ) : (
        <>
          <AffiliatesTable affiliates={affiliates} onOpen={setSelectedId} />
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </>
      )}
      {selectedId !== null && <AffiliateDetailsModal id={selectedId} onClose={() => setSelectedId(null)} onEdit={(affiliate) => { setSelectedId(null); setEditingAffiliate(affiliate) }} />}
      {editingAffiliate && <EditAffiliateModal affiliate={editingAffiliate} onClose={() => setEditingAffiliate(null)} />}
    </section>
  )
}
