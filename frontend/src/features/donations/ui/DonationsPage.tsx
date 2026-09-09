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
import { DonationStatusBadge } from './DonationStatusBadge'
import { donationMethodLabel, donationMethods, formatDonationAmount, formatDonationDate } from './donationPresentation'

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
  const list = useDonationsList(filters)
  const donations = list.data?.data ?? []
  const mayRead = hasCapability(user?.role, 'don.donations.read')
  const mayCreate = hasCapability(user?.role, 'don.donations.create')
  const mayEdit = hasCapability(user?.role, 'don.donations.update')
  const mayCancel = hasCapability(user?.role, 'don.donations.cancel')
  const mayDelete = hasCapability(user?.role, 'don.donations.delete')
  const hasActiveFilters = Boolean(filters.search || filters.status || filters.method || filters.dateFrom || filters.dateTo)
  const updateFilters = (change: Partial<DonationListFilters>) => setFilters(current => ({ ...current, ...change, page: 1 }))
  const clearFilters = () => setFilters(initialFilters)

  if (!mayRead) return <ErrorState title="Acceso restringido" message="No tiene permiso para consultar donaciones." />

  return <section className="space-y-6"><PageHeader context="Gestión financiera" title="Donaciones" description="Registre, consulte y gestione donaciones recibidas." actions={mayCreate ? <Button type="button" onClick={() => setCreating(true)}>Registrar donación</Button> : undefined} /><DonationFilters filters={filters} onChange={updateFilters} onClear={clearFilters} hasActiveFilters={hasActiveFilters} />{list.isPending ? <LoadingState label="Cargando donaciones..." /> : null}{list.isError ? <ErrorState title="No fue posible cargar las donaciones" message={getErrorMessage(list.error, 'Intente nuevamente.')} action={<Button type="button" variant="outline" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}{!list.isPending && !list.isError && donations.length === 0 ? <EmptyState title={hasActiveFilters ? 'No hay resultados para los filtros seleccionados' : 'No existen donaciones registradas'} description={hasActiveFilters ? 'Ajuste o limpie los filtros para continuar.' : 'Registre una donación para iniciar el historial.'} action={hasActiveFilters ? <Button type="button" variant="outline" onClick={clearFilters}>Limpiar filtros</Button> : undefined} /> : null}{donations.length ? <><DonationList donations={donations} mayEdit={mayEdit} mayCancel={mayCancel} mayDelete={mayDelete} onOpen={setSelectedId} onEdit={setEditing} onCancel={setCancelling} onDelete={setDeleting} /><Pagination page={list.data!.page} total={list.data!.total} limit={list.data!.limit} onChange={page => setFilters(current => ({ ...current, page }))} /></> : null}{creating ? <Modal title="Registrar donación" onClose={() => setCreating(false)}><DonationForm onClose={() => setCreating(false)} /></Modal> : null}{editing ? <Modal title="Editar donación" onClose={() => setEditing(null)}><DonationForm donation={editing} onClose={() => setEditing(null)} /></Modal> : null}{selectedId !== null ? <DonationDetailModal id={selectedId} onClose={() => setSelectedId(null)} onEdit={donation => { setSelectedId(null); setEditing(donation) }} onCancel={donation => { setSelectedId(null); setCancelling(donation) }} onDelete={donation => { setSelectedId(null); setDeleting(donation) }} /> : null}{cancelling ? <CancelDonationDialog id={cancelling.id} onClose={() => setCancelling(null)} /> : null}{deleting ? <DeleteDonationDialog id={deleting.id} onClose={() => setDeleting(null)} /> : null}</section>
}

function DonationFilters({ filters, onChange, onClear, hasActiveFilters }: { filters: DonationListFilters; onChange: (change: Partial<DonationListFilters>) => void; onClear: () => void; hasActiveFilters: boolean }) {
  return <form className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={event => event.preventDefault()}><label className="grid gap-1 text-sm font-medium" htmlFor="donation-search">Buscar<input id="donation-search" value={filters.search ?? ''} placeholder="Nombre, identificación o referencia" onChange={event => onChange({ search: event.target.value || undefined })} /></label><label className="grid gap-1 text-sm font-medium" htmlFor="donation-status">Estado<select id="donation-status" value={filters.status ?? ''} onChange={event => onChange({ status: event.target.value ? event.target.value as DonationStatus : undefined })}><option value="">Todos</option><option value="CONFIRMED">Confirmada</option><option value="CANCELLED">Cancelada</option></select></label><label className="grid gap-1 text-sm font-medium" htmlFor="donation-method-filter">Método<select id="donation-method-filter" value={filters.method ?? ''} onChange={event => onChange({ method: event.target.value ? event.target.value as DonationMethod : undefined })}><option value="">Todos</option>{donationMethods.map(method => <option key={method} value={method}>{donationMethodLabel(method)}</option>)}</select></label><label className="grid gap-1 text-sm font-medium" htmlFor="donation-date-from">Desde<input id="donation-date-from" type="date" value={filters.dateFrom ?? ''} onChange={event => onChange({ dateFrom: event.target.value || undefined })} /></label><label className="grid gap-1 text-sm font-medium" htmlFor="donation-date-to">Hasta<input id="donation-date-to" type="date" value={filters.dateTo ?? ''} onChange={event => onChange({ dateTo: event.target.value || undefined })} /></label><div className="flex items-end"><Button type="button" variant="outline" disabled={!hasActiveFilters} onClick={onClear}>Limpiar filtros</Button></div></form>
}

function DonationList({ donations, mayEdit, mayCancel, mayDelete, onOpen, onEdit, onCancel, onDelete }: { donations: Donation[]; mayEdit: boolean; mayCancel: boolean; mayDelete: boolean; onOpen: (id: number) => void; onEdit: (donation: Donation) => void; onCancel: (donation: Donation) => void; onDelete: (donation: Donation) => void }) {
  return <><div className="hidden overflow-x-auto rounded-xl border border-border md:block" tabIndex={0} aria-label="Listado de donaciones"><table className="min-w-[860px] w-full text-left text-sm"><thead className="bg-surface-muted text-foreground-muted"><tr><th className="p-3">Fecha</th><th className="p-3">Donante</th><th className="p-3">Monto</th><th className="p-3">Método</th><th className="p-3">Estado</th><th className="p-3">Referencia</th><th className="p-3">Acciones</th></tr></thead><tbody>{donations.map(donation => <tr key={donation.id} className="border-t border-border align-top"><td className="p-3 whitespace-nowrap">{formatDonationDate(donation.receivedAt)}</td><td className="p-3">{donation.donorName || 'Anónima'}</td><td className="p-3 whitespace-nowrap font-semibold">{formatDonationAmount(donation.amount, donation.currency)}</td><td className="p-3">{donationMethodLabel(donation.method)}</td><td className="p-3"><DonationStatusBadge status={donation.status} /></td><td className="p-3">{donation.reference || 'Sin referencia'}</td><td className="p-3"><DonationActions donation={donation} mayEdit={mayEdit} mayCancel={mayCancel} mayDelete={mayDelete} onOpen={onOpen} onEdit={onEdit} onCancel={onCancel} onDelete={onDelete} /></td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{donations.map(donation => <article key={donation.id} className="rounded-xl border border-border bg-surface p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{donation.donorName || 'Anónima'}</p><p className="text-sm text-foreground-muted">{formatDonationDate(donation.receivedAt)}</p></div><DonationStatusBadge status={donation.status} /></div><p className="mt-3 font-semibold">{formatDonationAmount(donation.amount, donation.currency)}</p><p className="text-sm text-foreground-muted">{donationMethodLabel(donation.method)} · {donation.reference || 'Sin referencia'}</p><div className="mt-3"><DonationActions donation={donation} mayEdit={mayEdit} mayCancel={mayCancel} mayDelete={mayDelete} onOpen={onOpen} onEdit={onEdit} onCancel={onCancel} onDelete={onDelete} /></div></article>)}</div></>
}

function DonationActions({ donation, mayEdit, mayCancel, mayDelete, onOpen, onEdit, onCancel, onDelete }: { donation: Donation; mayEdit: boolean; mayCancel: boolean; mayDelete: boolean; onOpen: (id: number) => void; onEdit: (donation: Donation) => void; onCancel: (donation: Donation) => void; onDelete: (donation: Donation) => void }) {
  const confirmed = donation.status === 'CONFIRMED'
  return <div className="flex flex-wrap gap-2"><Button size="sm" type="button" variant="outline" onClick={() => onOpen(donation.id)}>Ver</Button>{confirmed && mayEdit ? <Button size="sm" type="button" variant="outline" onClick={() => onEdit(donation)}>Editar</Button> : null}{confirmed && mayCancel ? <Button size="sm" type="button" variant="outline" onClick={() => onCancel(donation)}>Cancelar</Button> : null}{confirmed && !donation.reversalMovementId && mayDelete ? <Button size="sm" type="button" variant="destructive" onClick={() => onDelete(donation)}>Eliminar</Button> : null}</div>
}
