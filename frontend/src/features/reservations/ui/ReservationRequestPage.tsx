import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useCreateReservation, useReservableResources, useReservationAvailability } from '../hooks/useReservations'

type Values = { resourceId: string; startAt: string; endAt: string; purpose: string; estimatedAttendees: string; notes: string }
const blank: Values = { resourceId: '', startAt: '', endAt: '', purpose: '', estimatedAttendees: '', notes: '' }
const localCostaRica = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
function toUtc(value: string) { if (!localCostaRica.test(value)) return null; const date = new Date(`${value}:00-06:00`); return Number.isNaN(date.getTime()) ? null : date }
const schema = z.object({ resourceId: z.string().min(1, 'Seleccione un recurso.'), startAt: z.string().min(1, 'Indique hora de inicio.'), endAt: z.string().min(1, 'Indique hora de finalización.'), purpose: z.string().trim().min(1, 'Indique el motivo.').max(1000), estimatedAttendees: z.string(), notes: z.string().max(5000) }).superRefine((value, ctx) => {
  const start = toUtc(value.startAt); const end = toUtc(value.endAt)
  if (!start || !end) return
  if (end <= start) ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'La hora final debe ser posterior a la inicial.' })
  else if (start < new Date()) ctx.addIssue({ code: 'custom', path: ['startAt'], message: 'La reserva no puede iniciar en el pasado.' })
  else if (end.getTime() - start.getTime() < 3600000) ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'La duración mínima es una hora.' })
  else if (end.getTime() - start.getTime() > 43200000) ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'La duración máxima es doce horas.' })
  if (value.estimatedAttendees && (!Number.isInteger(Number(value.estimatedAttendees)) || Number(value.estimatedAttendees) <= 0)) ctx.addIssue({ code: 'custom', path: ['estimatedAttendees'], message: 'Indique un número entero positivo.' })
})

export function ReservationRequestPage() {
  const resources = useReservableResources(); const create = useCreateReservation(); const [availability, setAvailability] = useState<'idle' | 'available' | 'unavailable' | 'error'>('idle')
  const form = useForm<Values>({ defaultValues: blank, resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange', shouldFocusError: true })
  const values = form.watch(); const validInput = Boolean(values.resourceId && toUtc(values.startAt) && toUtc(values.endAt) && !form.formState.errors.startAt && !form.formState.errors.endAt)
  const availabilityQuery = useReservationAvailability(validInput ? { resourceId: Number(values.resourceId), startAt: toUtc(values.startAt)!.toISOString(), endAt: toUtc(values.endAt)!.toISOString() } : null)
  const resetAvailability = () => setAvailability('idle')
  async function checkAvailability() { const valid = await form.trigger(['resourceId', 'startAt', 'endAt']); if (!valid) return; resetAvailability(); try { const result = await availabilityQuery.refetch(); if (result.isError) { setAvailability('error'); return } setAvailability(result.data?.available ? 'available' : 'unavailable') } catch { setAvailability('error') } }
  async function submit(value: Values) { if (availability !== 'available' || create.isPending) return; try { await create.mutateAsync({ resourceId: Number(value.resourceId), startAt: toUtc(value.startAt)!.toISOString(), endAt: toUtc(value.endAt)!.toISOString(), purpose: value.purpose.trim(), ...(value.estimatedAttendees ? { estimatedAttendees: Number(value.estimatedAttendees) } : {}), ...(value.notes.trim() ? { notes: value.notes.trim() } : {}) }); form.reset(blank); setAvailability('idle'); toast.success('Solicitud de reserva enviada correctamente.') } catch (error) { if ((error as { response?: { status?: number } }).response?.status === 409) { setAvailability('unavailable'); toast.error('El recurso ya no está disponible. Consulte nuevamente la disponibilidad.') } else toast.error(getErrorMessage(error, 'No fue posible enviar la solicitud de reserva.')) } }
  if (resources.isPending) return <LoadingState label="Cargando recursos reservables..." />
  if (resources.isError) return <ErrorState title="No fue posible cargar recursos" message={getErrorMessage(resources.error)} />
  const field = (name: keyof Values) => ({ 'aria-invalid': Boolean(form.formState.errors[name]), 'aria-describedby': form.formState.errors[name] ? `${name}-error` : undefined })
  return <section className="space-y-6"><PageHeader context="Operación" title="Nueva reserva" description="Las horas se registran en hora de Costa Rica (UTC-06:00). La solicitud quedará pendiente de revisión." /><form className="form-grid max-w-3xl" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={create.isPending}><fieldset disabled={create.isPending} className="contents">
    <label htmlFor="reservation-resource">Recurso reservable</label><select id="reservation-resource" {...field('resourceId')} {...form.register('resourceId', { onChange: resetAvailability })}><option value="">Seleccione un recurso</option>{resources.data.map(resource => <option key={resource.id} value={resource.id}>{resource.name}{resource.location ? ` · ${resource.location}` : ''}</option>)}</select>{form.formState.errors.resourceId && <span id="resourceId-error" role="alert" className="field-error">{form.formState.errors.resourceId.message}</span>}
    <label htmlFor="reservation-start">Inicio</label><input id="reservation-start" type="datetime-local" {...field('startAt')} {...form.register('startAt', { onChange: resetAvailability })}/>{form.formState.errors.startAt && <span id="startAt-error" role="alert" className="field-error">{form.formState.errors.startAt.message}</span>}
    <label htmlFor="reservation-end">Finalización</label><input id="reservation-end" type="datetime-local" {...field('endAt')} {...form.register('endAt', { onChange: resetAvailability })}/>{form.formState.errors.endAt && <span id="endAt-error" role="alert" className="field-error">{form.formState.errors.endAt.message}</span>}
    <button type="button" onClick={() => void checkAvailability()} disabled={availabilityQuery.isFetching}> {availabilityQuery.isFetching ? 'Consultando disponibilidad…' : 'Consultar disponibilidad'} </button><p aria-live="polite" role="status">{availability === 'available' ? 'Disponible.' : availability === 'unavailable' ? 'No disponible para este horario.' : availability === 'error' ? 'No fue posible consultar disponibilidad.' : 'Consulte disponibilidad antes de enviar.'}</p>
    <label htmlFor="reservation-purpose">Motivo de la reserva</label><textarea id="reservation-purpose" maxLength={1000} {...field('purpose')} {...form.register('purpose')}/>{form.formState.errors.purpose && <span id="purpose-error" role="alert" className="field-error">{form.formState.errors.purpose.message}</span>}
    <label htmlFor="reservation-attendees">Asistentes estimados (opcional)</label><input id="reservation-attendees" type="number" min="1" {...field('estimatedAttendees')} {...form.register('estimatedAttendees')}/>{form.formState.errors.estimatedAttendees && <span id="estimatedAttendees-error" role="alert" className="field-error">{form.formState.errors.estimatedAttendees.message}</span>}
    <label htmlFor="reservation-notes">Notas (opcional)</label><textarea id="reservation-notes" maxLength={5000} {...field('notes')} {...form.register('notes')}/>{form.formState.errors.notes && <span id="notes-error" role="alert" className="field-error">{form.formState.errors.notes.message}</span>}
    <button className="primary" disabled={create.isPending || availability !== 'available'}>{create.isPending ? 'Enviando…' : 'Enviar solicitud'}</button>
  </fieldset></form></section>
}
