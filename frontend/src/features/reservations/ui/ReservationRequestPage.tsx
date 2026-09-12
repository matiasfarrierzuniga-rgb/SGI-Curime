import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, MapPin, UsersRound } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { useCreateReservation, useReservableResources, useReservationAvailability } from '../hooks/useReservations'
import type { ReservableResource } from '../model/reservations.types'

type Values = { resourceId: string; startAt: string; endAt: string; purpose: string; estimatedAttendees: string; notes: string }
type Confirmation = { resourceName: string; startAt: string; endAt: string }
type Availability = 'idle' | 'available' | 'unavailable' | 'error'

const blank: Values = { resourceId: '', startAt: '', endAt: '', purpose: '', estimatedAttendees: '', notes: '' }
const localCostaRica = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
function toUtc(value: string) { if (!localCostaRica.test(value)) return null; const date = new Date(`${value}:00-06:00`); return Number.isNaN(date.getTime()) ? null : date }
function formatLocalDate(value: string) { return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Costa_Rica' }).format(toUtc(value)!) }

const schema = z.object({
  resourceId: z.string().min(1, 'Seleccione un espacio.'),
  startAt: z.string().min(1, 'Indique la fecha y hora de inicio.'),
  endAt: z.string().min(1, 'Indique la fecha y hora de finalización.'),
  purpose: z.string().trim().min(1, 'Indique el motivo de la reserva.').max(1000, 'El motivo no puede superar 1000 caracteres.'),
  estimatedAttendees: z.string(),
  notes: z.string().max(5000, 'Las notas no pueden superar 5000 caracteres.'),
}).superRefine((value, ctx) => {
  const start = toUtc(value.startAt); const end = toUtc(value.endAt)
  if (!start || !end) return
  if (end <= start) ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'La hora de finalización debe ser posterior a la de inicio.' })
  else if (start < new Date()) ctx.addIssue({ code: 'custom', path: ['startAt'], message: 'La fecha y hora deben estar en el futuro.' })
  else if (end.getTime() - start.getTime() < 3600000) ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'La reserva debe durar al menos una hora.' })
  else if (end.getTime() - start.getTime() > 43200000) ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'La reserva no puede durar más de doce horas.' })
  if (value.estimatedAttendees && (!Number.isInteger(Number(value.estimatedAttendees)) || Number(value.estimatedAttendees) <= 0)) ctx.addIssue({ code: 'custom', path: ['estimatedAttendees'], message: 'Indique una cantidad válida de personas.' })
})

export function ReservationRequestPage() {
  const resources = useReservableResources()
  const create = useCreateReservation()
  const [availability, setAvailability] = useState<Availability>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const submitLock = useRef(false)
  const form = useForm<Values>({ defaultValues: blank, resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange', shouldFocusError: true })
  const values = form.watch()
  const selectedResource = resources.data?.find(resource => resource.id === Number(values.resourceId))
  const validInput = Boolean(values.resourceId && toUtc(values.startAt) && toUtc(values.endAt) && !form.formState.errors.startAt && !form.formState.errors.endAt)
  const availabilityQuery = useReservationAvailability(validInput ? { resourceId: Number(values.resourceId), startAt: toUtc(values.startAt)!.toISOString(), endAt: toUtc(values.endAt)!.toISOString() } : null)
  const resetAvailability = () => setAvailability('idle')

  async function checkAvailability() {
    const valid = await form.trigger(['resourceId', 'startAt', 'endAt'])
    if (!valid) return
    resetAvailability()
    try {
      const result = await availabilityQuery.refetch()
      if (result.isError) return setAvailability('error')
      setAvailability(result.data?.available ? 'available' : 'unavailable')
    } catch { setAvailability('error') }
  }

  async function submit(value: Values) {
    if (availability !== 'available' || submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    try {
      await create.mutateAsync({ resourceId: Number(value.resourceId), startAt: toUtc(value.startAt)!.toISOString(), endAt: toUtc(value.endAt)!.toISOString(), purpose: value.purpose.trim(), ...(value.estimatedAttendees ? { estimatedAttendees: Number(value.estimatedAttendees) } : {}), ...(value.notes.trim() ? { notes: value.notes.trim() } : {}) })
      setConfirmation({ resourceName: selectedResource?.name ?? 'Espacio seleccionado', startAt: value.startAt, endAt: value.endAt })
      form.reset(blank)
      setAvailability('idle')
    } catch (error) {
      if ((error as { response?: { status?: number } }).response?.status === 409) {
        setAvailability('unavailable')
        toast.error('Ese espacio ya no está disponible en el horario elegido. Consulte nuevamente.')
      } else toast.error(getErrorMessage(error, 'No fue posible enviar la solicitud. Sus datos siguen en el formulario para que pueda intentarlo de nuevo.'))
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  if (resources.isPending) return <LoadingState label="Cargando espacios disponibles..." />
  if (resources.isError) return <ErrorState title="No fue posible cargar los espacios" message={getErrorMessage(resources.error)} action={<Button variant="outline" type="button" onClick={() => void resources.refetch()}>Reintentar</Button>} />

  if (confirmation) return <section className="mx-auto max-w-2xl space-y-6" aria-labelledby="reservation-confirmation-title">
    <Card className="border-success/40 bg-success-bg"><CardContent className="space-y-5 p-6 sm:p-8">
      <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
      <div><h1 id="reservation-confirmation-title" className="text-heading-2 font-bold text-foreground">Solicitud enviada</h1><p className="mt-2 text-body-large text-foreground">Su solicitud fue enviada y será revisada por la Asociación.</p></div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2"><Summary label="Espacio" value={confirmation.resourceName} /><Summary label="Fecha y hora" value={`${formatLocalDate(confirmation.startAt)} a ${formatLocalDate(confirmation.endAt)}`} /></dl>
      <p className="text-sm text-foreground-muted">La aprobación de la reserva no significa que un pago esté realizado. La Asociación le indicará si corresponde algún costo y cómo pagarlo.</p>
      <Button type="button" size="lg" onClick={() => setConfirmation(null)}>Solicitar otra reserva</Button>
    </CardContent></Card>
  </section>

  const field = (name: keyof Values) => ({ 'aria-invalid': Boolean(form.formState.errors[name]), 'aria-describedby': form.formState.errors[name] ? `${name}-error` : undefined })
  return <section className="space-y-6">
    <PageHeader context="Servicios" title="Solicitar una reserva" description="Elija el espacio y el horario. Luego confirme que esté disponible antes de enviar la solicitud." />
    <form className="mx-auto grid max-w-3xl gap-6 rounded-xl border border-border bg-surface p-4 sm:p-6" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={submitting}>
      <fieldset disabled={submitting} className="contents">
        <FormField label="Espacio" id="reservation-resource" errorId="resourceId-error" error={form.formState.errors.resourceId?.message}>
          <select id="reservation-resource" className="min-h-11" {...field('resourceId')} {...form.register('resourceId', { onChange: resetAvailability })}><option value="">Seleccione un espacio</option>{resources.data.map(resource => <option key={resource.id} value={resource.id}>{resource.name}{resource.location ? ` · ${resource.location}` : ''}</option>)}</select>
        </FormField>
        {selectedResource ? <ResourceSummary resource={selectedResource} /> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Fecha y hora de inicio" id="reservation-start" errorId="startAt-error" error={form.formState.errors.startAt?.message}><input id="reservation-start" className="min-h-11" type="datetime-local" {...field('startAt')} {...form.register('startAt', { onChange: resetAvailability })} /></FormField>
          <FormField label="Fecha y hora de finalización" id="reservation-end" errorId="endAt-error" error={form.formState.errors.endAt?.message}><input id="reservation-end" className="min-h-11" type="datetime-local" {...field('endAt')} {...form.register('endAt', { onChange: resetAvailability })} /></FormField>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <Button variant="outline" type="button" size="lg" onClick={() => void checkAvailability()} disabled={availabilityQuery.isFetching}>{availabilityQuery.isFetching ? 'Consultando disponibilidad…' : 'Consultar disponibilidad'}</Button>
          <p className={`mt-3 text-sm font-semibold ${availability === 'available' ? 'text-success' : availability === 'unavailable' || availability === 'error' ? 'text-danger' : 'text-foreground-muted'}`} aria-live="polite" role="status">{availability === 'available' ? 'Disponible en este horario.' : availability === 'unavailable' ? 'No disponible en este horario. Elija otra fecha u hora.' : availability === 'error' ? 'No fue posible consultar la disponibilidad. Inténtelo nuevamente.' : 'Debe consultar la disponibilidad antes de enviar.'}</p>
        </div>
        <FormField label="Motivo" id="reservation-purpose" errorId="purpose-error" error={form.formState.errors.purpose?.message}><textarea id="reservation-purpose" className="min-h-28" maxLength={1000} {...field('purpose')} {...form.register('purpose')} /></FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Cantidad de personas (opcional)" id="reservation-attendees" errorId="estimatedAttendees-error" error={form.formState.errors.estimatedAttendees?.message}><input id="reservation-attendees" className="min-h-11" type="number" min="1" inputMode="numeric" {...field('estimatedAttendees')} {...form.register('estimatedAttendees')} /></FormField>
          <FormField label="Notas adicionales (opcional)" id="reservation-notes" errorId="notes-error" error={form.formState.errors.notes?.message}><textarea id="reservation-notes" className="min-h-24" maxLength={5000} {...field('notes')} {...form.register('notes')} /></FormField>
        </div>
        <div className="rounded-lg border border-info/30 bg-info-bg p-4 text-sm text-foreground"><p className="font-semibold">Costo y aprobación</p><p className="mt-1">La Asociación le informará si este espacio tiene algún costo. Aprobar la solicitud no significa que el pago esté realizado.</p></div>
        <Button className="w-full sm:w-fit" size="lg" type="submit" disabled={submitting || availability !== 'available'}>{submitting ? 'Enviando solicitud…' : 'Enviar solicitud'}</Button>
      </fieldset>
    </form>
  </section>
}

function FormField({ label, id, errorId, error, children }: { label: string; id: string; errorId: string; error?: string; children: ReactNode }) {
  return <div className="grid gap-2"><label className="font-semibold text-foreground" htmlFor={id}>{label}</label>{children}{error ? <p id={errorId} role="alert" className="field-error">{error}</p> : null}</div>
}

function ResourceSummary({ resource }: { resource: ReservableResource }) {
  return <Card className="bg-brand-ivory"><CardContent className="space-y-2 p-4"><p className="font-bold text-brand-ink">Está reservando: {resource.name}</p>{resource.description ? <p className="text-sm text-foreground-muted">{resource.description}</p> : null}<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground-muted">{resource.location ? <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{resource.location}</span> : null}{resource.capacity ? <span className="inline-flex items-center gap-1"><UsersRound className="size-4" aria-hidden="true" />Capacidad: {resource.capacity} personas</span> : null}</div></CardContent></Card>
}

function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="font-semibold text-foreground-muted">{label}</dt><dd className="mt-1 text-foreground">{value}</dd></div> }
