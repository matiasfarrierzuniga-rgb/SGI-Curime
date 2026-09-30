import { zodResolver } from '@hookform/resolvers/zod'
import { Check, CheckCircle2, MapPin, UsersRound } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { FormField } from '@/shared/ui/FormField'
import { FormSection } from '@/shared/ui/FormSection'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { useCreateReservation, useReservableResources, useReservationAvailability } from '../hooks/useReservations'
import type { ReservableResource } from '../model/reservations.types'

type Values = { resourceId: string; startAt: string; endAt: string; purpose: string; estimatedAttendees: string; notes: string }
type Confirmation = { resourceName: string; startAt: string; endAt: string }
type Availability = 'idle' | 'checking' | 'available' | 'unavailable' | 'error'

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
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const submitLock = useRef(false)
  const form = useForm<Values>({ defaultValues: blank, resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange', shouldFocusError: true })
  const values = form.watch()
  const selectedResource = resources.data?.find(resource => resource.id === Number(values.resourceId))
  const validAvailabilityInput = Boolean(values.resourceId && toUtc(values.startAt) && toUtc(values.endAt) && !form.formState.errors.startAt && !form.formState.errors.endAt)
  const availabilityQuery = useReservationAvailability(validAvailabilityInput ? { resourceId: Number(values.resourceId), startAt: toUtc(values.startAt)!.toISOString(), endAt: toUtc(values.endAt)!.toISOString() } : null)
  const invalidateAvailability = () => { setAvailability('idle'); setReviewing(false) }
  const completedSteps = confirmation || reviewing ? 2 : availability === 'available' ? 2 : values.startAt && values.endAt ? 1 : values.resourceId ? 1 : 0

  async function checkAvailability() {
    const valid = await form.trigger(['resourceId', 'startAt', 'endAt'])
    if (!valid) return
    setAvailability('checking')
    try {
      const result = await availabilityQuery.refetch()
      if (result.isError) return setAvailability('error')
      setAvailability(result.data?.available ? 'available' : 'unavailable')
    } catch { setAvailability('error') }
  }

  async function openReview() {
    const valid = await form.trigger()
    if (!valid) return
    if (availability !== 'available') return
    setReviewing(true)
  }

  async function submit(value: Values) {
    if (!reviewing || availability !== 'available' || submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    try {
      await create.mutateAsync({ resourceId: Number(value.resourceId), startAt: toUtc(value.startAt)!.toISOString(), endAt: toUtc(value.endAt)!.toISOString(), purpose: value.purpose.trim(), ...(value.estimatedAttendees ? { estimatedAttendees: Number(value.estimatedAttendees) } : {}), ...(value.notes.trim() ? { notes: value.notes.trim() } : {}) })
      setConfirmation({ resourceName: selectedResource?.name ?? 'Espacio seleccionado', startAt: value.startAt, endAt: value.endAt })
    } catch (error) {
      if ((error as { response?: { status?: number } }).response?.status === 409) {
        setAvailability('unavailable')
        setReviewing(false)
        toast.error('Ese espacio ya no está disponible en el horario elegido. Consulte nuevamente.')
      } else {
        setReviewing(false)
        toast.error(getErrorMessage(error, 'No fue posible enviar la solicitud. Sus datos siguen en el formulario para que pueda intentarlo de nuevo.'))
      }
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  if (resources.isPending) return <LoadingState label="Cargando espacios disponibles..." />
  if (resources.isError) return <ErrorState title="No fue posible cargar los espacios" message={getErrorMessage(resources.error)} action={<Button variant="outline" type="button" onClick={() => void resources.refetch()}>Reintentar</Button>} />

  return <section className="mx-auto max-w-3xl space-y-6">
    <PageHeader context="Servicios" title="Solicitar una reserva" description="Elija el espacio y horario. Verifique disponibilidad, revise datos y envíe su solicitud para revisión." />
    <ReservationProcessStepper completedSteps={completedSteps} reviewing={reviewing} completed={Boolean(confirmation)} />
    {confirmation ? <ReservationSubmitted confirmation={confirmation} onNewRequest={() => { form.reset(blank); setAvailability('idle'); setConfirmation(null); setReviewing(false) }} /> : reviewing ? <ReservationReview values={values} resource={selectedResource} availability={availability} submitting={submitting} onEdit={() => setReviewing(false)} onSubmit={form.handleSubmit(submit)} /> : <form noValidate onSubmit={event => { event.preventDefault(); void openReview() }} aria-busy={submitting}>
      <Card className="gap-0">
        <CardHeader className="border-b pb-4"><CardTitle>Complete su solicitud</CardTitle><p className="text-sm text-muted-foreground">Podrá revisar toda la información antes de enviar.</p></CardHeader>
        <fieldset disabled={submitting}>
          <CardContent className="space-y-9 pt-7 sm:space-y-10">
            <FormSection className="gap-5" title="1. Espacio" description="Seleccione el lugar que desea solicitar.">
              <FormField id="reservation-resource" label="Espacio" error={form.formState.errors.resourceId?.message} required>
                <Select {...form.register('resourceId', { onChange: invalidateAvailability })}><option value="">Seleccione un espacio</option>{resources.data.map(resource => <option key={resource.id} value={resource.id}>{resource.name}{resource.location ? ` · ${resource.location}` : ''}</option>)}</Select>
              </FormField>
              {selectedResource ? <ResourceSummary resource={selectedResource} /> : null}
            </FormSection>
            <FormSection className="gap-5" title="2. Fecha y horario" description="Indique cuándo necesita el espacio y consulte antes de continuar.">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id="reservation-start" label="Fecha y hora de inicio" error={form.formState.errors.startAt?.message} required><Input type="datetime-local" {...form.register('startAt', { onChange: invalidateAvailability })} /></FormField>
                <FormField id="reservation-end" label="Fecha y hora de finalización" error={form.formState.errors.endAt?.message} required><Input type="datetime-local" {...form.register('endAt', { onChange: invalidateAvailability })} /></FormField>
              </div>
              <AvailabilityStatus status={availability} onCheck={() => void checkAvailability()} disabled={availability === 'checking' || availabilityQuery.isFetching} />
            </FormSection>
            <FormSection className="gap-5 rounded-surface border border-border bg-subtle/50 p-4 sm:p-5" title="Datos de la solicitud" description="Explique el uso previsto y agregue detalles si son necesarios.">
              <FormField id="reservation-purpose" label="Motivo" error={form.formState.errors.purpose?.message} required><Textarea maxLength={1000} {...form.register('purpose')} /></FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id="reservation-attendees" label="Cantidad de personas (opcional)" error={form.formState.errors.estimatedAttendees?.message}><Input type="number" min="1" inputMode="numeric" {...form.register('estimatedAttendees')} /></FormField>
                <FormField id="reservation-notes" label="Notas adicionales (opcional)" error={form.formState.errors.notes?.message}><Textarea className="min-h-24" maxLength={5000} {...form.register('notes')} /></FormField>
              </div>
            </FormSection>
            {selectedResource ? <CostNotice resource={selectedResource} /> : null}
          </CardContent>
          <CardFooter className="mt-7 flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm text-muted-foreground"><p className="font-semibold text-foreground">Paso 3: revise antes de enviar</p><p id="review-requirement" className="mt-1">Confirme disponibilidad para habilitar la revisión. La solicitud queda pendiente de revisión; no reserva ni aprueba el espacio.</p></div><Button className="w-full sm:w-auto" size="lg" type="submit" disabled={availability !== 'available'} aria-describedby="review-requirement">Revisar solicitud</Button></CardFooter>
        </fieldset>
      </Card>
    </form>}
  </section>
}

function ReservationProcessStepper({ completedSteps, reviewing, completed }: { completedSteps: number; reviewing: boolean; completed: boolean }) {
  const steps = ['Elegir espacio', 'Fecha y horario', 'Revisar y enviar']
  return <ol className="grid gap-2 sm:grid-cols-3" aria-label="Progreso de la solicitud">{steps.map((step, index) => {
    const complete = completed || index < completedSteps
    const current = !completed && (reviewing ? index === 2 : index === completedSteps)
    return <li key={step} className={`flex min-h-12 items-center gap-3 rounded-control border px-3 py-2.5 text-sm ${complete ? 'border-success/30 bg-success-bg text-foreground' : current ? 'border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/15' : 'border-border bg-surface text-muted-foreground'}`} aria-current={current ? 'step' : undefined}><span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete ? 'bg-success text-white' : current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{complete ? <Check className="size-4" aria-hidden="true" /> : index + 1}</span><span className="font-semibold">{step}</span></li>
  })}</ol>
}

function AvailabilityStatus({ status, onCheck, disabled }: { status: Availability; onCheck: () => void; disabled: boolean }) {
  const copy = { idle: 'Aún no ha consultado la disponibilidad.', checking: 'Consultando disponibilidad…', available: 'Disponible en este horario. Puede revisar su solicitud.', unavailable: 'No disponible en este horario. Elija otra fecha u hora.', error: 'No fue posible consultar la disponibilidad. Inténtelo nuevamente.' }[status]
  const tone = status === 'available' ? 'border-success/35 bg-success-bg text-success' : status === 'unavailable' ? 'border-destructive/25 bg-destructive/5 text-destructive' : status === 'error' ? 'border-destructive/25 bg-transparent text-destructive' : status === 'checking' ? 'border-border bg-muted/50 text-muted-foreground' : 'border-dashed border-border bg-transparent text-muted-foreground'
  return <div className={`rounded-control border px-4 py-3.5 ${tone}`} role="status" aria-live="polite"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="font-medium">{copy}</p><Button variant="outline" type="button" onClick={onCheck} disabled={disabled} loading={status === 'checking'}>{status === 'checking' ? 'Consultando disponibilidad' : 'Consultar disponibilidad'}</Button></div></div>
}

function ReservationReview({ values, resource, availability, submitting, onEdit, onSubmit }: { values: Values; resource?: ReservableResource; availability: Availability; submitting: boolean; onEdit: () => void; onSubmit: () => void }) {
  return <form noValidate onSubmit={onSubmit} aria-busy={submitting}><Card className="gap-0"><CardHeader className="border-b pb-4"><CardTitle><h2>3. Revise su solicitud</h2></CardTitle><p className="text-sm text-muted-foreground">Verifique datos. Enviar es una acción final y crea una solicitud pendiente de revisión.</p></CardHeader><CardContent className="space-y-6 pt-6"><AvailabilityStatus status={availability} onCheck={() => undefined} disabled /><dl className="grid gap-5 text-sm sm:grid-cols-2"><Summary label="Espacio" value={resource?.name ?? 'Espacio seleccionado'} /><Summary label="Fecha y hora" value={`${formatLocalDate(values.startAt)} a ${formatLocalDate(values.endAt)}`} /><Summary label="Motivo" value={values.purpose} /><Summary label="Personas estimadas" value={values.estimatedAttendees || 'No indicado'} />{values.notes.trim() ? <Summary label="Notas adicionales" value={values.notes} /> : null}</dl>{resource ? <CostNotice resource={resource} /> : null}</CardContent><CardFooter className="mt-6 flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"><Button variant="outline" type="button" onClick={onEdit} disabled={submitting}>Volver a editar</Button><Button className="w-full sm:w-auto" size="lg" type="submit" loading={submitting} disabled={availability !== 'available'}>{submitting ? 'Enviando solicitud' : 'Enviar solicitud'}</Button></CardFooter></Card></form>
}

function ReservationSubmitted({ confirmation, onNewRequest }: { confirmation: Confirmation; onNewRequest: () => void }) {
  return <Card className="border-success/40 bg-success-bg"><CardContent className="space-y-5 p-6 sm:p-8"><CheckCircle2 className="size-10 text-success" aria-hidden="true" /><div><h2 className="text-heading-2 font-bold text-foreground">Solicitud recibida</h2><p className="mt-2 text-body-large text-foreground">Su solicitud está pendiente de revisión por la Asociación.</p></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><Summary label="Espacio" value={confirmation.resourceName} /><Summary label="Fecha y hora" value={`${formatLocalDate(confirmation.startAt)} a ${formatLocalDate(confirmation.endAt)}`} /><Summary label="Estado" value="Pendiente de revisión" /></dl><p className="text-sm text-muted-foreground">Enviar una solicitud no aprueba ni confirma la reserva.</p><div className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={onNewRequest}>Solicitar otra reserva</Button><a className="inline-flex h-11 items-center justify-center rounded-control px-4 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" href="/servicios">Volver a servicios</a></div></CardContent></Card>
}

function ResourceSummary({ resource }: { resource: ReservableResource }) { return <Card className="bg-brand-ivory"><CardContent className="space-y-2 p-4"><p className="font-bold text-brand-ink">Está reservando: {resource.name}</p>{resource.description ? <p className="text-sm text-muted-foreground">{resource.description}</p> : null}<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">{resource.location ? <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{resource.location}</span> : null}{resource.capacity ? <span className="inline-flex items-center gap-1"><UsersRound className="size-4" aria-hidden="true" />Capacidad: {resource.capacity} personas</span> : null}<span>{resource.pricingType === 'FREE' ? 'Sin costo' : resource.price ? `Costo fijo: ${resource.price} ${resource.currency}` : 'Costo fijo sin monto informado'}</span></div></CardContent></Card> }
function CostNotice({ resource }: { resource: ReservableResource }) { return <div className="rounded-control border border-info/30 bg-info-bg p-4 text-sm text-foreground"><p className="font-semibold">Costo y revisión</p><p className="mt-1">{resource.pricingType === 'FREE' ? 'Este espacio no tiene costo.' : resource.price ? `Costo fijo: ${resource.price} ${resource.currency}.` : 'Este espacio tiene costo fijo; el monto no fue informado.'} Una solicitud pendiente no significa que un pago esté realizado.</p></div> }
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-foreground">{value}</dd></div> }
