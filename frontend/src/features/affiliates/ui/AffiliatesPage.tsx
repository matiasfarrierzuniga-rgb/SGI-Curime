import { useState } from 'react'
import { SlidersHorizontal, UsersRound } from 'lucide-react'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
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
    <section className="min-w-0 space-y-3 sm:space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <nav aria-label="Ubicación actual" className="flex items-center gap-2 text-caption font-medium text-text-secondary">
            <span>Gestión administrativa</span>
            <span aria-hidden="true">›</span>
            <span className="text-text-primary">Afiliados</span>
          </nav>
          <div className="mt-2 flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-accent/20 text-brand-brown sm:size-12">
              <UsersRound className="size-5 sm:size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-heading-2 font-normal leading-tight tracking-[-0.02em] text-text-primary">Afiliados</h1>
              <p className="mt-0.5 max-w-2xl text-body-small text-text-secondary">Consulte, filtre y gestione el registro administrativo de afiliados.</p>
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="affiliate-filters-heading" className="rounded-surface border border-border-default bg-surface-card p-3 shadow-surface sm:p-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 shrink-0 text-brand-brown" aria-hidden="true" />
            <h2 id="affiliate-filters-heading" className="font-heading text-heading-3 font-normal text-text-primary">Filtros</h2>
          </div>
          <div>
            <p className="mt-0.5 text-body-small text-text-secondary">Refine los resultados por datos de contacto, identificación o estado.</p>
          </div>
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

      <section aria-labelledby="affiliate-results-heading" className="min-w-0 rounded-surface border border-border-default bg-surface-card shadow-surface">
        <div className="flex flex-col gap-2 border-b border-border-subtle px-3 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-4">
          <div>
            <h2 id="affiliate-results-heading" className="font-heading text-heading-3 font-normal text-text-primary">Resultados</h2>
            <p className="mt-0.5 text-body-small text-text-secondary">Revise datos de contacto, afiliación y estado antes de abrir un expediente.</p>
          </div>
          {!listQuery.isPending && !listQuery.isError ? (
            <p className="shrink-0 text-body-small font-semibold tabular-nums text-text-secondary">{total} {total === 1 ? 'afiliado' : 'afiliados'}</p>
          ) : null}
        </div>
        <div className="p-3 sm:p-4">
          {listQuery.isPending ? (
            <LoadingState label="Cargando afiliados..." />
          ) : listQuery.isError ? (
            <ErrorState message={getErrorMessage(listQuery.error, 'No fue posible cargar los afiliados.')} action={<Button variant="outline" type="button" onClick={() => void listQuery.refetch()}>Reintentar</Button>} />
          ) : affiliates.length === 0 ? (
            <EmptyState title="No hay afiliados" description="No hay afiliados que coincidan con los filtros aplicados." action={search || status ? <Button variant="outline" type="button" onClick={clearFilters}>Limpiar filtros</Button> : undefined} />
          ) : (
            <div className="min-w-0 space-y-4">
              <AffiliatesTable affiliates={affiliates} onOpen={setSelectedId} />
              <Pagination page={page} total={total} limit={limit} onChange={setPage} />
            </div>
          )}
        </div>
      </section>
      {selectedId !== null && <AffiliateDetailsModal id={selectedId} onClose={() => setSelectedId(null)} onEdit={(affiliate) => { setSelectedId(null); setEditingAffiliate(affiliate) }} />}
      {editingAffiliate && <EditAffiliateModal affiliate={editingAffiliate} onClose={() => setEditingAffiliate(null)} />}
    </section>
  )
}
