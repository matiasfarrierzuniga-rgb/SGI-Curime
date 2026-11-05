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
import { isAdmin } from '@/shared/security/roles'
import { useAffiliatesList } from '../hooks/useAffiliatesQueries'
import type { Affiliate, AffiliateStatus } from '../model/affiliates.types'
import { AffiliateFilters } from './AffiliateFilters'
import { AffiliateDetailsModal } from './AffiliateDetailsModal'
import { EditAffiliateModal } from './EditAffiliateModal'
import { AffiliatesTable } from './AffiliatesTable'

const limit = 20

export function AffiliatesPage() {
  const { user } = useAuth()
  const canUpdateAffiliate = hasCapability(user?.permissionCodes, 'padron.affiliate.update')
  const canManageAffiliateLifecycle = isAdmin(user?.role)
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
    <AdministrativeListLayout
      header={<PageHeader className="gap-4 pb-5" context="Gestión administrativa" title="Afiliados" description="Consulte y filtre el registro administrativo de afiliados." />}
      filters={<AffiliateFilters
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
        />}
    >
      {listQuery.isPending ? (
        <LoadingState label="Cargando afiliados..." />
      ) : listQuery.isError ? (
        <ErrorState message={getErrorMessage(listQuery.error, 'No fue posible cargar los afiliados.')} action={<Button variant="outline" type="button" onClick={() => void listQuery.refetch()}>Reintentar</Button>} />
      ) : affiliates.length === 0 ? (
        <EmptyState title="No hay afiliados" description="No hay afiliados que coincidan con los filtros aplicados." action={search || status ? <Button variant="outline" type="button" onClick={clearFilters}>Limpiar filtros</Button> : undefined} />
      ) : (
        <AdministrativeListResults count={`${total} ${total === 1 ? 'afiliado' : 'afiliados'}`} actions="Abra un expediente para revisar el detalle.">
          <AffiliatesTable affiliates={affiliates} onOpen={setSelectedId} />
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </AdministrativeListResults>
      )}
      {selectedId !== null && <AffiliateDetailsModal id={selectedId} canUpdate={canUpdateAffiliate} canManageLifecycle={canManageAffiliateLifecycle} onClose={() => setSelectedId(null)} onEdit={(affiliate) => { setSelectedId(null); setEditingAffiliate(affiliate) }} />}
      {editingAffiliate && <EditAffiliateModal affiliate={editingAffiliate} onClose={() => setEditingAffiliate(null)} />}
    </AdministrativeListLayout>
  )
}
