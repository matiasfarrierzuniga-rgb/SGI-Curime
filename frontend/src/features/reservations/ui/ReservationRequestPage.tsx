import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, MapPin, UsersRound } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
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
        <Field invalid={Boolean(form.formState.errors.resourceId)}>
          <FieldLabel htmlFor="reservation-resource">Espacio</FieldLabel>
          <Select id="reservation-resource" {...field('resourceId')} {...form.register('resourceId', { onChange: resetAvailability })}><option value="">Seleccione un espacio</option>{resources.data.map(resource => <option key={resource.id} value={resource.id}>{resource.name}{resource.location ? ` · ${resource.location}` : ''}</option>)}</Select>
          {form.formState.errors.resourceId ? <FieldError id="resourceId-error" role="alert" match>{form.formState.errors.resourceId.message}</FieldError> : null}
        </Field>
        {selectedResource ? <ResourceSummary resource={selectedResource} /> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field invalid={Boolean(form.formState.errors.startAt)}><FieldLabel htmlFor="reservation-start">Fecha y hora de inicio</FieldLabel><Input id="reservation-start" type="datetime-local" {...field('startAt')} {...form.register('startAt', { onChange: resetAvailability })} />{form.formState.errors.startAt ? <FieldError id="startAt-error" role="alert" match>{form.formState.errors.startAt.message}</FieldError> : null}</Field>
          <Field invalid={Boolean(form.formState.errors.endAt)}><FieldLabel htmlFor="reservation-end">Fecha y hora de finalización</FieldLabel><Input id="reservation-end" type="datetime-local" {...field('endAt')} {...form.register('endAt', { onChange: resetAvailability })} />{form.formState.errors.endAt ? <FieldError id="endAt-error" role="alert" match>{form.formState.errors.endAt.message}</FieldError> : null}</Field>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <Button variant="outline" type="button" size="lg" onClick={() => void checkAvailability()} disabled={availabilityQuery.isFetching}>{availabilityQuery.isFetching ? 'Consultando disponibilidad…' : 'Consultar disponibilidad'}</Button>
          <p className={`mt-3 text-sm font-semibold ${availability === 'available' ? 'text-success' : availability === 'unavailable' || availability === 'error' ? 'text-danger' : 'text-foreground-muted'}`} aria-live="polite" role="status">{availability === 'available' ? 'Disponible en este horario.' : availability === 'unavailable' ? 'No disponible en este horario. Elija otra fecha u hora.' : availability === 'error' ? 'No fue posible consultar la disponibilidad. Inténtelo nuevamente.' : 'Debe consultar la disponibilidad antes de enviar.'}</p>
        </div>
        <Field invalid={Boolean(form.formState.errors.purpose)}><FieldLabel htmlFor="reservation-purpose">Motivo</FieldLabel><Textarea id="reservation-purpose" maxLength={1000} {...field('purpose')} {...form.register('purpose')} />{form.formState.errors.purpose ? <FieldError id="purpose-error" role="alert" match>{form.formState.errors.purpose.message}</FieldError> : null}</Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field invalid={Boolean(form.formState.errors.estimatedAttendees)}><FieldLabel htmlFor="reservation-attendees">Cantidad de personas (opcional)</FieldLabel><Input id="reservation-attendees" type="number" min="1" inputMode="numeric" {...field('estimatedAttendees')} {...form.register('estimatedAttendees')} />{form.formState.errors.estimatedAttendees ? <FieldError id="estimatedAttendees-error" role="alert" match>{form.formState.errors.estimatedAttendees.message}</FieldError> : null}</Field>
          <Field invalid={Boolean(form.formState.errors.notes)}><FieldLabel htmlFor="reservation-notes">Notas adicionales (opcional)</FieldLabel><Textarea id="reservation-notes" className="min-h-24" maxLength={5000} {...field('notes')} {...form.register('notes')} />{form.formState.errors.notes ? <FieldError id="notes-error" role="alert" match>{form.formState.errors.notes.message}</FieldError> : null}</Field>
        </div>
        <div className="rounded-lg border border-info/30 bg-info-bg p-4 text-sm text-foreground"><p className="font-semibold">Costo y aprobación</p><p className="mt-1">La Asociación le informará si este espacio tiene algún costo. Aprobar la solicitud no significa que el pago esté realizado.</p></div>
        <Button className="w-full sm:w-fit" size="lg" type="submit" disabled={submitting || availability !== 'available'}>{submitting ? 'Enviando solicitud…' : 'Enviar solicitud'}</Button>
      </fieldset>
    </form>
  </section>
}

function ResourceSummary({ resource }: { resource: ReservableResource }) {
  return <Card className="bg-brand-ivory"><CardContent className="space-y-2 p-4"><p className="font-bold text-brand-ink">Está reservando: {resource.name}</p>{resource.description ? <p className="text-sm text-foreground-muted">{resource.description}</p> : null}<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground-muted">{resource.location ? <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{resource.location}</span> : null}{resource.capacity ? <span className="inline-flex items-center gap-1"><UsersRound className="size-4" aria-hidden="true" />Capacidad: {resource.capacity} personas</span> : null}</div></CardContent></Card>
}

function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="font-semibold text-foreground-muted">{label}</dt><dd className="mt-1 text-foreground">{value}</dd></div> }
