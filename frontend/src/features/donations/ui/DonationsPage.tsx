import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { useDonationsList } from '../hooks/donations.queries'
import type { Donation, DonationListFilters, DonationMethod, DonationStatus } from '../model/donations.types'
import { CancelDonationDialog } from './CancelDonationDialog'
import { DeleteDonationDialog } from './DeleteDonationDialog'
import { DonationDetailModal } from './DonationDetailModal'
import { DonationForm } from './DonationForm'
import { donationMethodLabel, donationMethods, formatDonationAmount, formatDonationDate } from './donationPresentation'
import { DonationStatusBadge } from './DonationStatusBadge'
import { toLocalEndOfDayIso } from './donationDateTime'

const limit = 20
const initialFilters: DonationListFilters = { page: 1, limit }

export function DonationsPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<DonationListFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Donation | null>(null)
  const [cancelling, setCancelling] = useState<Donation | null>(null)
  const [deleting, setDeleting] = useState<Donation | null>(null)
  const list = useDonationsList({
    ...filters,
    dateTo: filters.dateTo ? toLocalEndOfDayIso(filters.dateTo) : undefined,
  })
  const donations = list.data?.data ?? []
  const mayRead = hasCapability(user?.permissionCodes, 'don.donations.read')
  const mayCreate = hasCapability(user?.permissionCodes, 'don.donations.create')
  const mayEdit = hasCapability(user?.permissionCodes, 'don.donations.update')
  const mayCancel = hasCapability(user?.permissionCodes, 'don.donations.cancel')
  const mayDelete = hasCapability(user?.permissionCodes, 'don.donations.delete')
  const hasActiveFilters = Boolean(filters.search || filters.status || filters.method || filters.dateFrom || filters.dateTo)

  const updateFilters = (change: Partial<DonationListFilters>) =>
    setFilters(current => ({ ...current, ...change, page: 1 }))

  if (!mayRead) {
    return <ErrorState title="Acceso restringido" message="No tiene permiso para consultar donaciones." />
  }

  return (
    <section className="space-y-6">
      <PageHeader
        context="Gestión financiera"
        title="Donaciones"
        description="Registre, consulte y gestione donaciones recibidas con trazabilidad financiera."
        actions={mayCreate ? <Button type="button" onClick={() => setCreating(true)}>Registrar donación</Button> : undefined}
      />

      <DonationFilters
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onChange={updateFilters}
        onClear={() => setFilters(initialFilters)}
      />

      {list.isPending ? <LoadingState label="Cargando donaciones..." /> : null}
      {list.isError ? (
        <ErrorState
          title="No fue posible cargar las donaciones"
          message={getErrorMessage(list.error, 'Intente nuevamente.')}
          action={<Button type="button" variant="outline" onClick={() => void list.refetch()}>Reintentar</Button>}
        />
      ) : null}
      {!list.isPending && !list.isError && donations.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No hay resultados para los filtros seleccionados' : 'No existen donaciones registradas'}
          description={hasActiveFilters ? 'Ajuste o limpie los filtros para continuar.' : 'Registre una donación para iniciar el historial.'}
          action={hasActiveFilters ? <Button type="button" variant="outline" onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button> : undefined}
        />
      ) : null}
      {donations.length ? (
        <>
          <DonationList
            donations={donations}
            mayEdit={mayEdit}
            mayCancel={mayCancel}
            mayDelete={mayDelete}
            onOpen={setSelectedId}
            onEdit={setEditing}
            onCancel={setCancelling}
            onDelete={setDeleting}
          />
          <Pagination page={list.data!.page} total={list.data!.total} limit={list.data!.limit} onChange={page => setFilters(current => ({ ...current, page }))} />
        </>
      ) : null}

      {creating ? <Modal title="Registrar donación" onClose={() => setCreating(false)}><DonationForm onClose={() => setCreating(false)} /></Modal> : null}
      {editing ? <Modal title="Editar donación" onClose={() => setEditing(null)}><DonationForm donation={editing} onClose={() => setEditing(null)} /></Modal> : null}
      {selectedId !== null ? <DonationDetailModal id={selectedId} onClose={() => setSelectedId(null)} onEdit={donation => { setSelectedId(null); setEditing(donation) }} onCancel={donation => { setSelectedId(null); setCancelling(donation) }} onDelete={donation => { setSelectedId(null); setDeleting(donation) }} /> : null}
      {cancelling ? <CancelDonationDialog id={cancelling.id} onClose={() => setCancelling(null)} /> : null}
      {deleting ? <DeleteDonationDialog id={deleting.id} onClose={() => setDeleting(null)} /> : null}
    </section>
  )
}

function DonationFilters({ filters, onChange, onClear, hasActiveFilters }: { filters: DonationListFilters; onChange: (change: Partial<DonationListFilters>) => void; onClear: () => void; hasActiveFilters: boolean }) {
  const controlClassName = 'min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal text-text-primary shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-control-disabled'

  return (
    <section aria-labelledby="donation-filters-title" className="rounded-surface border border-border-default bg-surface-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2 text-text-primary"><SlidersHorizontal aria-hidden="true" className="size-4 text-primary" /><h2 id="donation-filters-title" className="text-label font-semibold">Filtrar historial</h2></div>
        {hasActiveFilters ? <p className="text-body-small text-text-secondary">Filtros activos</p> : null}
      </div>
      <form className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" onSubmit={event => event.preventDefault()}>
        <label className="grid gap-1 text-label font-semibold text-text-primary sm:col-span-2 xl:col-span-2" htmlFor="donation-search">Buscar<span className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" /><input className={`${controlClassName} w-full pl-10`} id="donation-search" value={filters.search ?? ''} placeholder="Nombre, identificación o referencia" onChange={event => onChange({ search: event.target.value || undefined })} /></span></label>
        <SelectFilter className={controlClassName} id="donation-status" label="Estado" value={filters.status ?? ''} onChange={value => onChange({ status: value ? value as DonationStatus : undefined })}><option value="">Todos</option><option value="CONFIRMED">Confirmada</option><option value="CANCELLED">Cancelada</option></SelectFilter>
        <SelectFilter className={controlClassName} id="donation-method-filter" label="Método" value={filters.method ?? ''} onChange={value => onChange({ method: value ? value as DonationMethod : undefined })}><option value="">Todos</option>{donationMethods.map(method => <option key={method} value={method}>{donationMethodLabel(method)}</option>)}</SelectFilter>
        <DateFilter className={controlClassName} id="donation-date-from" label="Desde" value={filters.dateFrom ?? ''} onChange={value => onChange({ dateFrom: value || undefined })} />
        <DateFilter className={controlClassName} id="donation-date-to" label="Hasta" value={filters.dateTo ?? ''} onChange={value => onChange({ dateTo: value || undefined })} />
        <div className="flex items-end xl:col-span-6"><Button type="button" variant="outline" disabled={!hasActiveFilters} onClick={onClear}>Limpiar filtros</Button></div>
      </form>
    </section>
  )
}

function SelectFilter({ id, label, value, onChange, children, className }: { id: string; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode; className: string }) {
  return <label className="grid gap-1 text-label font-semibold text-text-primary" htmlFor={id}>{label}<select className={className} id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</select></label>
}

function DateFilter({ id, label, value, onChange, className }: { id: string; label: string; value: string; onChange: (value: string) => void; className: string }) {
  return <label className="grid gap-1 text-label font-semibold text-text-primary" htmlFor={id}>{label}<input className={className} id={id} type="date" value={value} onChange={event => onChange(event.target.value)} /></label>
}

function DonationList({ donations, mayEdit, mayCancel, mayDelete, onOpen, onEdit, onCancel, onDelete }: { donations: Donation[]; mayEdit: boolean; mayCancel: boolean; mayDelete: boolean; onOpen: (id: number) => void; onEdit: (donation: Donation) => void; onCancel: (donation: Donation) => void; onDelete: (donation: Donation) => void }) {
  return <><div className="hidden overflow-x-auto rounded-surface border border-border-default bg-surface-card shadow-sm md:block" tabIndex={0} aria-label="Listado de donaciones"><table className="min-w-[860px] w-full text-left text-body-small"><thead className="bg-surface-muted text-text-secondary"><tr><th className="p-4 font-semibold">Fecha</th><th className="p-4 font-semibold">Donante</th><th className="p-4 font-semibold">Monto</th><th className="p-4 font-semibold">Método</th><th className="p-4 font-semibold">Estado</th><th className="p-4 font-semibold">Referencia</th><th className="p-4 font-semibold"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{donations.map(donation => <tr key={donation.id} className="border-t border-border-subtle align-top transition-colors hover:bg-surface-muted/60"><td className="p-4 whitespace-nowrap text-text-secondary">{formatDonationDate(donation.receivedAt)}</td><td className="p-4 font-semibold text-text-primary">{donation.donorName || 'Anónima'}</td><td className="p-4 whitespace-nowrap font-bold text-text-primary">{formatDonationAmount(donation.amount, donation.currency)}</td><td className="p-4 text-text-secondary">{donationMethodLabel(donation.method)}</td><td className="p-4"><DonationStatusBadge status={donation.status} /></td><td className="max-w-48 break-words p-4 text-text-secondary">{donation.reference || 'Sin referencia'}</td><td className="p-4"><DonationActions donation={donation} mayEdit={mayEdit} mayCancel={mayCancel} mayDelete={mayDelete} onOpen={onOpen} onEdit={onEdit} onCancel={onCancel} onDelete={onDelete} /></td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{donations.map(donation => <article key={donation.id} className="rounded-surface border border-border-default bg-surface-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-text-primary">{donation.donorName || 'Anónima'}</p><p className="mt-1 text-body-small text-text-secondary">{formatDonationDate(donation.receivedAt)}</p></div><DonationStatusBadge status={donation.status} /></div><p className="mt-4 text-body-large font-bold text-text-primary">{formatDonationAmount(donation.amount, donation.currency)}</p><p className="mt-1 break-words text-body-small text-text-secondary">{donationMethodLabel(donation.method)} · {donation.reference || 'Sin referencia'}</p><div className="mt-4 border-t border-border-subtle pt-3"><DonationActions donation={donation} mayEdit={mayEdit} mayCancel={mayCancel} mayDelete={mayDelete} onOpen={onOpen} onEdit={onEdit} onCancel={onCancel} onDelete={onDelete} /></div></article>)}</div></>
}

function DonationActions({ donation, mayEdit, mayCancel, mayDelete, onOpen, onEdit, onCancel, onDelete }: { donation: Donation; mayEdit: boolean; mayCancel: boolean; mayDelete: boolean; onOpen: (id: number) => void; onEdit: (donation: Donation) => void; onCancel: (donation: Donation) => void; onDelete: (donation: Donation) => void }) {
  const confirmed = donation.status === 'CONFIRMED'
  return <div className="flex flex-wrap gap-2"><Button size="sm" type="button" variant="outline" onClick={() => onOpen(donation.id)}>Ver</Button>{confirmed && mayEdit ? <Button size="sm" type="button" variant="outline" onClick={() => onEdit(donation)}>Editar</Button> : null}{confirmed && mayCancel ? <Button size="sm" type="button" variant="outline" onClick={() => onCancel(donation)}>Cancelar</Button> : null}{confirmed && !donation.reversalMovementId && mayDelete ? <Button size="sm" type="button" variant="destructive" onClick={() => onDelete(donation)}>Eliminar</Button> : null}</div>
}
