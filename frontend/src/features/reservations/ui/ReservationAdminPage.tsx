import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, Clock3, MapPin, SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
import { DatePicker } from '@/shared/ui/date-picker/DatePicker'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/ui/button'
import { useReservableResources, useReservationMutations, useReservationsList } from '../hooks/useReservations'
import type { AdminReservation, ReservationFilters, ReservationStatus } from '../model/reservations.types'
import { ReservationActions } from './ReservationActions'
import { ReservationDetailsModal } from './ReservationDetailsModal'
import { formatReservationDate, reservationStatusLabel, reservationStatusVariant } from './reservationPresentation'

type ActiveDialog = { type: 'approve' | 'reject' | 'cancel'; id: number } | null
type RejectValues = { rejectionReason: string }

const rejectSchema = z.object({ rejectionReason: z.string().trim().min(3, 'El motivo debe tener al menos 3 caracteres.').max(1000, 'El motivo no puede superar 1000 caracteres.') })
const initialFilters: ReservationFilters = { page: 1, limit: 20 }
const statuses: ReservationStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CONFIRMED', 'COMPLETED']
const controlClassName = 'min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal text-text-primary shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'

export function ReservationAdminPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<ReservationFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialog, setDialog] = useState<ActiveDialog>(null)
  const [actionError, setActionError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const list = useReservationsList(filters)
  const resources = useReservableResources()
  const mutations = useReservationMutations()
  const rejectForm = useForm<RejectValues>({ resolver: zodResolver(rejectSchema), defaultValues: { rejectionReason: '' } })
  const busy = submitting || mutations.approve.isPending || mutations.reject.isPending || mutations.cancel.isPending
  const reservations = list.data?.data ?? []
  const hasActiveFilters = Boolean(filters.status || filters.resourceId || filters.from || filters.to)

  const updateFilter = (update: Omit<ReservationFilters, 'page' | 'limit'>) => setFilters(current => ({ ...current, ...update, page: 1 }))
  const openAction = (type: NonNullable<ActiveDialog>['type'], id: number) => {
    setActionError('')
    if (type !== 'reject') rejectForm.reset({ rejectionReason: '' })
    setDialog({ type, id })
  }
  const closeAction = () => { if (!busy) setDialog(null) }
  const runAction = async () => {
    if (!dialog || busy) return
    setActionError('')
    setSubmitting(true)
    try {
      if (dialog.type === 'approve') await mutations.approve.mutateAsync(dialog.id)
      if (dialog.type === 'cancel') await mutations.cancel.mutateAsync(dialog.id)
      if (dialog.type === 'reject') {
        const valid = await rejectForm.trigger()
        if (!valid) return
        await mutations.reject.mutateAsync({ id: dialog.id, rejectionReason: rejectForm.getValues('rejectionReason').trim() })
      }
      toast.success(dialog.type === 'approve' ? 'Reserva aprobada correctamente.' : dialog.type === 'reject' ? 'Reserva rechazada correctamente.' : 'Reserva cancelada correctamente.')
      setDialog(null)
    } catch (error) {
      setActionError(getErrorMessage(error, 'No fue posible actualizar la reserva.'))
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title="Reservas" description="Consulte solicitudes, revise disponibilidad registrada y gestione los cambios de estado autorizados." />

    {list.data ? <section aria-label="Resumen de reservas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Reservas encontradas" value={list.data.total} icon={<CalendarClock />} supportingText="Total según filtros aplicados." />
      <MetricCard label="Pendientes en esta página" value={reservations.filter(reservation => reservation.status === 'PENDING').length} icon={<Clock3 />} state="warning" stateLabel="Requieren revisión" />
      <MetricCard label="Recursos visibles" value={new Set(reservations.map(reservation => reservation.resourceId)).size} icon={<MapPin />} supportingText="En resultados de esta página." />
    </section> : null}

    <section aria-labelledby="reservation-filters-title" className="rounded-surface border border-border-default bg-surface-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2 text-text-primary"><SlidersHorizontal aria-hidden="true" className="size-4 text-primary" /><h2 id="reservation-filters-title" className="text-label font-semibold">Filtrar reservas</h2></div>
        {hasActiveFilters ? <p className="text-body-small text-text-secondary">Filtros activos</p> : null}
      </div>
      <form className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" onSubmit={event => event.preventDefault()}>
        <FilterSelect label="Estado" value={filters.status ?? ''} onChange={value => updateFilter({ status: value ? value as ReservationStatus : undefined })}><option value="">Todos los estados</option>{statuses.map(status => <option key={status} value={status}>{reservationStatusLabel(status)}</option>)}</FilterSelect>
        <FilterSelect label="Recurso" value={filters.resourceId?.toString() ?? ''} onChange={value => updateFilter({ resourceId: value ? Number(value) : undefined })}><option value="">Todos los recursos</option>{resources.data?.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</FilterSelect>
        <FilterInput label="Desde" value={filters.from ?? ''} onChange={value => updateFilter({ from: value || undefined })} />
        <FilterInput label="Hasta" value={filters.to ?? ''} onChange={value => updateFilter({ to: value || undefined })} />
        <div className="flex items-end"><Button variant="outline" type="button" disabled={!hasActiveFilters} onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button></div>
      </form>
    </section>

    {list.isPending ? <LoadingState label="Cargando reservas..." /> : null}
    {list.isError ? <ErrorState title="No fue posible cargar las reservas" message={getErrorMessage(list.error)} action={<Button variant="outline" type="button" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}
    {!list.isPending && !list.isError && reservations.length === 0 ? <EmptyState title={hasActiveFilters ? 'No hay reservas para estos filtros' : 'No hay reservas registradas'} description={hasActiveFilters ? 'Ajuste o limpie los filtros para consultar otras reservas.' : 'Las solicitudes de reserva aparecerán aquí cuando sean registradas.'} action={hasActiveFilters ? <Button variant="outline" type="button" onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button> : undefined} /> : null}
    {reservations.length ? <>
      <ReservationTable reservations={reservations} busy={busy} onDetail={setSelectedId} onAction={openAction} />
      <Pagination page={list.data!.page} total={list.data!.total} limit={list.data!.limit} onChange={page => setFilters(current => ({ ...current, page }))} />
    </> : null}

    {selectedId !== null ? <ReservationDetailsModal id={selectedId} permissionCodes={user?.permissionCodes} busy={busy} onClose={() => setSelectedId(null)} onApprove={id => openAction('approve', id)} onReject={id => openAction('reject', id)} onCancel={id => openAction('cancel', id)} /> : null}
    {dialog?.type === 'reject' ? <Modal title="Rechazar reserva" onClose={closeAction} busy={busy}><form className="space-y-4" noValidate onSubmit={event => { event.preventDefault(); void runAction() }} aria-busy={busy}><label className="grid gap-2 text-label font-semibold text-text-primary" htmlFor="rejection-reason">Motivo del rechazo<textarea id="rejection-reason" className="min-h-28 rounded-control border border-border-default bg-control p-3 font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" maxLength={1000} aria-invalid={Boolean(rejectForm.formState.errors.rejectionReason)} aria-describedby={rejectForm.formState.errors.rejectionReason ? 'rejection-reason-error' : undefined} {...rejectForm.register('rejectionReason')} /></label>{rejectForm.formState.errors.rejectionReason ? <p id="rejection-reason-error" role="alert" className="text-sm text-destructive">{rejectForm.formState.errors.rejectionReason.message}</p> : null}{actionError ? <p role="alert" className="text-sm text-destructive">{actionError}</p> : null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" type="button" disabled={busy} onClick={closeAction}>Cancelar</Button><Button variant="destructive" type="submit" disabled={busy}>{busy ? 'Procesando...' : 'Rechazar reserva'}</Button></div></form></Modal> : null}
    {dialog?.type === 'approve' ? <ConfirmDialog title="Aprobar reserva" message="Confirme la aprobación de esta reserva. Se verificará nuevamente la disponibilidad. Aprobar no registra un pago." confirmLabel="Aprobar" busy={busy} error={actionError} onConfirm={() => void runAction()} onClose={closeAction} /> : null}
    {dialog?.type === 'cancel' ? <ConfirmDialog title="Cancelar reserva" message="Confirme la cancelación de esta reserva. Esta acción no puede deshacerse." confirmLabel="Cancelar reserva" danger busy={busy} error={actionError} onConfirm={() => void runAction()} onClose={closeAction} /> : null}
  </section>
}

function ReservationTable({ reservations, busy, onDetail, onAction }: { reservations: AdminReservation[]; busy: boolean; onDetail: (id: number) => void; onAction: (type: NonNullable<ActiveDialog>['type'], id: number) => void }) {
  return <><div className="hidden md:block"><DataTable className="min-w-[960px]" scrollLabel="Listado de reservas. Desplácese horizontalmente para ver todas las columnas."><DataTableHeader><tr><DataTableHead>Reserva</DataTableHead><DataTableHead>Recurso</DataTableHead><DataTableHead>Solicitante</DataTableHead><DataTableHead>Horario</DataTableHead><DataTableHead>Propósito</DataTableHead><DataTableHead>Estado</DataTableHead><DataTableHead><span className="sr-only">Acciones</span></DataTableHead></tr></DataTableHeader><DataTableBody>{reservations.map(reservation => <DataTableRow key={reservation.id}><DataTableCell className="font-semibold">#{reservation.id}</DataTableCell><DataTableCell><p className="font-semibold">{reservation.resource.name}</p>{reservation.resource.location ? <p className="mt-1 text-body-small text-text-secondary">{reservation.resource.location}</p> : null}</DataTableCell><DataTableCell>{reservation.requester.fullName}</DataTableCell><DataTableCell className="whitespace-nowrap text-text-secondary"><p>{formatReservationDate(reservation.startAt)}</p><p className="mt-1">a {formatReservationDate(reservation.endAt)}</p></DataTableCell><DataTableCell className="max-w-56"><p className="line-clamp-2">{reservation.purpose}</p></DataTableCell><DataTableCell><StatusBadge variant={reservationStatusVariant(reservation.status)}>{reservationStatusLabel(reservation.status)}</StatusBadge></DataTableCell><DataTableCell><ReservationRowActions reservation={reservation} busy={busy} onDetail={onDetail} onAction={onAction} /></DataTableCell></DataTableRow>)}</DataTableBody></DataTable></div><div className="grid gap-3 md:hidden">{reservations.map(reservation => <article key={reservation.id} className="rounded-surface border border-border-default bg-surface-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-text-primary">{reservation.resource.name}</p><p className="mt-1 text-body-small text-text-secondary">Reserva #{reservation.id} · {reservation.requester.fullName}</p></div><StatusBadge variant={reservationStatusVariant(reservation.status)}>{reservationStatusLabel(reservation.status)}</StatusBadge></div><dl className="mt-4 grid gap-3 border-y border-border-subtle py-3 text-body-small"><Detail label="Horario" value={`${formatReservationDate(reservation.startAt)} a ${formatReservationDate(reservation.endAt)}`} /><Detail label="Propósito" value={reservation.purpose} /></dl><div className="mt-4"><ReservationRowActions reservation={reservation} busy={busy} onDetail={onDetail} onAction={onAction} /></div></article>)}</div></>
}

function ReservationRowActions({ reservation, busy, onDetail, onAction }: { reservation: AdminReservation; busy: boolean; onDetail: (id: number) => void; onAction: (type: NonNullable<ActiveDialog>['type'], id: number) => void }) {
  return <div className="flex min-w-48 flex-wrap gap-2"><Button size="sm" variant="outline" type="button" onClick={() => onDetail(reservation.id)}>Ver detalle</Button><ReservationActions status={reservation.status} disabled={busy} onApprove={() => onAction('approve', reservation.id)} onReject={() => onAction('reject', reservation.id)} onCancel={() => onAction('cancel', reservation.id)} /></div>
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = `reservation-filter-${label.toLowerCase()}`
  return <label className="grid gap-1 text-label font-semibold text-text-primary" htmlFor={id}>{label}<select className={controlClassName} id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</select></label>
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `reservation-filter-${label.toLowerCase()}`
  return <label className="grid gap-1 text-label font-semibold text-text-primary" htmlFor={id}>{label}<DatePicker id={id} value={value} onChange={onChange} /></label>
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-semibold text-text-secondary">{label}</dt><dd className="mt-1 text-text-primary">{value}</dd></div>
}
