import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Button } from '@/shared/ui/button'
import { useReservableResources, useReservationMutations, useReservationsList } from '../hooks/useReservations'
import type { ReservationFilters, ReservationStatus } from '../model/reservations.types'
import { ReservationActions } from './ReservationActions'
import { ReservationDetailsModal } from './ReservationDetailsModal'
import { formatReservationDate, reservationStatusLabel, reservationStatusVariant } from './reservationPresentation'

type ActiveDialog = { type: 'approve' | 'reject' | 'cancel'; id: number } | null
type RejectValues = { rejectionReason: string }
const rejectSchema = z.object({ rejectionReason: z.string().trim().min(3, 'El motivo debe tener al menos 3 caracteres.').max(1000, 'El motivo no puede superar 1000 caracteres.') })
const initialFilters: ReservationFilters = { page: 1, limit: 20 }
const statuses: ReservationStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CONFIRMED', 'COMPLETED']

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

  const updateFilter = (update: Omit<ReservationFilters, 'page' | 'limit'>) => setFilters(current => ({ ...current, ...update, page: 1 }))
  const openAction = (type: NonNullable<ActiveDialog>['type'], id: number) => { setActionError(''); if (type !== 'reject') rejectForm.reset({ rejectionReason: '' }); setDialog({ type, id }) }
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
    } catch (error) { setActionError(getErrorMessage(error, 'No fue posible actualizar la reserva.')) }
    finally { setSubmitting(false) }
  }

  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title="Reservas" description="Revise las solicitudes y actualice su estado." />
    <form className="grid gap-4 rounded-xl border border-border bg-surface p-4 md:grid-cols-5" onSubmit={event => event.preventDefault()}>
      <FilterSelect label="Estado" value={filters.status ?? ''} onChange={value => updateFilter({ status: value ? value as ReservationStatus : undefined })}><option value="">Todos los estados</option>{statuses.map(status => <option key={status} value={status}>{reservationStatusLabel(status)}</option>)}</FilterSelect>
      <FilterSelect label="Recurso" value={filters.resourceId?.toString() ?? ''} onChange={value => updateFilter({ resourceId: value ? Number(value) : undefined })}><option value="">Todos los recursos</option>{resources.data?.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</FilterSelect>
      <FilterInput label="Desde" type="date" value={filters.from ?? ''} onChange={value => updateFilter({ from: value || undefined })} />
      <FilterInput label="Hasta" type="date" value={filters.to ?? ''} onChange={value => updateFilter({ to: value || undefined })} />
      <div className="flex items-end"><Button variant="outline" type="button" onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button></div>
    </form>
    {list.isPending ? <LoadingState label="Cargando reservas..." /> : null}
    {list.isError ? <ErrorState title="No fue posible cargar las reservas" message={getErrorMessage(list.error)} action={<Button variant="outline" type="button" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}
    {list.data && list.data.data.length === 0 ? <EmptyState title="No hay reservas para estos filtros" description="Ajuste o limpie los filtros para consultar otras reservas." /> : null}
    {list.data && list.data.data.length > 0 ? <>
      <div className="overflow-x-auto rounded-xl border border-border" tabIndex={0} aria-label="Listado de reservas">
        <table className="min-w-[940px] w-full text-left text-sm"><thead className="bg-surface-muted text-foreground-muted"><tr><th className="p-3">ID</th><th className="p-3">Recurso</th><th className="p-3">Solicitante</th><th className="p-3">Inicio</th><th className="p-3">Fin</th><th className="p-3">Propósito</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead><tbody>{list.data.data.map(reservation => <tr key={reservation.id} className="border-t border-border align-top"><td className="p-3 font-semibold">#{reservation.id}</td><td className="p-3">{reservation.resource.name}</td><td className="p-3">{reservation.requester.fullName}</td><td className="p-3 whitespace-nowrap">{formatReservationDate(reservation.startAt)}</td><td className="p-3 whitespace-nowrap">{formatReservationDate(reservation.endAt)}</td><td className="max-w-56 p-3">{reservation.purpose}</td><td className="p-3"><StatusBadge variant={reservationStatusVariant(reservation.status)}>{reservationStatusLabel(reservation.status)}</StatusBadge></td><td className="p-3"><div className="flex min-w-64 flex-wrap gap-2"><Button size="sm" variant="outline" type="button" onClick={() => setSelectedId(reservation.id)}>Ver detalle</Button><ReservationActions status={reservation.status} role={user?.role} disabled={busy} onApprove={() => openAction('approve', reservation.id)} onReject={() => openAction('reject', reservation.id)} onCancel={() => openAction('cancel', reservation.id)} /></div></td></tr>)}</tbody></table>
      </div>
      <Pagination page={list.data.page} total={list.data.total} limit={list.data.limit} onChange={page => setFilters(current => ({ ...current, page }))} />
    </> : null}
    {selectedId !== null ? <ReservationDetailsModal id={selectedId} role={user?.role} busy={busy} onClose={() => setSelectedId(null)} onApprove={id => openAction('approve', id)} onReject={id => openAction('reject', id)} onCancel={id => openAction('cancel', id)} /> : null}
    {dialog?.type === 'reject' ? <Modal title="Rechazar reserva" onClose={closeAction} busy={busy}><form className="space-y-4" noValidate onSubmit={event => { event.preventDefault(); void runAction() }} aria-busy={busy}><label className="grid gap-2" htmlFor="rejection-reason">Motivo del rechazo<textarea id="rejection-reason" maxLength={1000} aria-invalid={Boolean(rejectForm.formState.errors.rejectionReason)} aria-describedby={rejectForm.formState.errors.rejectionReason ? 'rejection-reason-error' : undefined} {...rejectForm.register('rejectionReason')} /></label>{rejectForm.formState.errors.rejectionReason ? <p id="rejection-reason-error" role="alert">{rejectForm.formState.errors.rejectionReason.message}</p> : null}{actionError ? <p role="alert">{actionError}</p> : null}<div className="flex flex-wrap justify-end gap-2"><Button variant="outline" type="button" disabled={busy} onClick={closeAction}>Cancelar</Button><Button variant="destructive" type="submit" disabled={busy}>{busy ? 'Procesando...' : 'Rechazar reserva'}</Button></div></form></Modal> : null}
    {dialog?.type === 'approve' ? <ConfirmDialog title="Aprobar reserva" message="Confirme la aprobación de esta reserva. Se verificará nuevamente la disponibilidad. Aprobar no registra un pago." confirmLabel="Aprobar" busy={busy} error={actionError} onConfirm={() => void runAction()} onClose={closeAction} /> : null}
    {dialog?.type === 'cancel' ? <ConfirmDialog title="Cancelar reserva" message="Confirme la cancelación de esta reserva. Esta acción no puede deshacerse." confirmLabel="Cancelar reserva" danger busy={busy} error={actionError} onConfirm={() => void runAction()} onClose={closeAction} /> : null}
  </section>
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = `reservation-filter-${label.toLowerCase()}`
  return <label className="grid gap-1 text-sm font-semibold" htmlFor={id}>{label}<select id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</select></label>
}

function FilterInput({ label, type, value, onChange }: { label: string; type: 'date'; value: string; onChange: (value: string) => void }) {
  const id = `reservation-filter-${label.toLowerCase()}`
  return <label className="grid gap-1 text-sm font-semibold" htmlFor={id}>{label}<input id={id} type={type} value={value} onChange={event => onChange(event.target.value)} /></label>
}
