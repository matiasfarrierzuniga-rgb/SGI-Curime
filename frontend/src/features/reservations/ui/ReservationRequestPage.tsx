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
import { DateRangePicker } from '@/shared/ui/date-picker/DatePicker'
import { useCreateReservation, useReservableResources, useReservationAvailability } from '../hooks/useReservations'
import type { ReservableResource } from '../model/reservations.types'
import { formatReservationTariff, getReservationTariff, reservationActivities, reservationApplicantCategories } from '../model/reservationTariffs'

type Values = { resourceId: string; startAt: string; endAt: string; activity: string; applicantCategory: string; purpose: string; estimatedAttendees: string; notes: string }
type Confirmation = { resourceName: string; startAt: string; endAt: string }
type Availability = 'idle' | 'checking' | 'available' | 'unavailable' | 'error'

const blank: Values = { resourceId: '', startAt: '', endAt: '', activity: '', applicantCategory: '', purpose: '', estimatedAttendees: '', notes: '' }
const approvedReservableSpaceNames = new Set(['Salón Comunal', 'Play de los niños'])
const localCostaRica = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
function toUtc(value: string) { if (!localCostaRica.test(value)) return null; const date = new Date(`${value}:00-06:00`); return Number.isNaN(date.getTime()) ? null : date }
function formatLocalDate(value: string) { return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Costa_Rica' }).format(toUtc(value)!) }
function datePart(value: string) { return localCostaRica.test(value) ? value.slice(0, 10) : '' }
function timePart(value: string, fallback: string) { return localCostaRica.test(value) ? value.slice(11, 16) : fallback }
function withDate(value: string, current: string, fallbackTime: string) { return value ? `${value}T${timePart(current, fallbackTime)}` : '' }
function withTime(value: string, current: string, fallbackTime: string) { return value ? `${datePart(current) || new Date().toISOString().slice(0, 10)}T${value}` : current ? `${datePart(current)}T${fallbackTime}` : '' }

const schema = z.object({
  resourceId: z.string().min(1, 'Seleccione un espacio.'),
  startAt: z.string().min(1, 'Indique la fecha y hora de inicio.'),
  endAt: z.string().min(1, 'Indique la fecha y hora de finalización.'),
  activity: z.string().min(1, 'Seleccione el tipo de actividad.'),
  applicantCategory: z.string().min(1, 'Seleccione la categoría de quien solicita.'),
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
  if (value.activity && value.applicantCategory && getReservationTariff(value.activity, value.applicantCategory) === null) ctx.addIssue({ code: 'custom', path: ['activity'], message: 'No hay tarifa definida para esta combinación. Elija otra actividad o categoría.' })
})

export function ReservationRequestPage() {
  const resources = useReservableResources()
  const create = useCreateReservation()
  const [availability, setAvailability] = useState<Availability>('idle')
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const submitLock = useRef(false)
  const reviewedValues = useRef<Values | null>(null)
  const form = useForm<Values>({ defaultValues: blank, resolver: zodResolver(schema), mode: 'onTouched', reValidateMode: 'onChange', shouldFocusError: true })
  const values = form.watch()
  const reservableSpaces = resources.data?.filter(resource => approvedReservableSpaceNames.has(resource.name)) ?? []
  const selectedResource = reservableSpaces.find(resource => resource.id === Number(values.resourceId))
  const selectedTariff = getReservationTariff(values.activity, values.applicantCategory)
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
    reviewedValues.current = form.getValues()
    setReviewing(true)
  }

  async function submit(value: Values) {
    if (!reviewing || availability !== 'available' || submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    try {
      await create.mutateAsync({ resourceId: Number(value.resourceId), startAt: toUtc(value.startAt)!.toISOString(), endAt: toUtc(value.endAt)!.toISOString(), activity: value.activity, applicantCategory: value.applicantCategory, purpose: value.purpose.trim(), ...(value.estimatedAttendees ? { estimatedAttendees: Number(value.estimatedAttendees) } : {}), ...(value.notes.trim() ? { notes: value.notes.trim() } : {}) })
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

  return <section className="public-container max-w-4xl space-y-6 py-8 md:py-12">
    <PageHeader context="Servicios" title="Solicitar una reserva" description="Elija el espacio y horario. Verifique disponibilidad, revise datos y envíe su solicitud para revisión." />
    <ReservationProcessStepper completedSteps={completedSteps} reviewing={reviewing} completed={Boolean(confirmation)} />
    {confirmation ? <ReservationSubmitted confirmation={confirmation} onNewRequest={() => { form.reset(blank); setAvailability('idle'); setConfirmation(null); setReviewing(false); reviewedValues.current = null }} /> : reviewing ? <ReservationReview values={values} resource={selectedResource} tariff={selectedTariff} availability={availability} submitting={submitting} onEdit={() => { reviewedValues.current = null; setReviewing(false) }} onSubmit={() => { if (reviewedValues.current) void submit(reviewedValues.current) }} /> : <form noValidate onSubmit={event => { event.preventDefault(); void openReview() }} aria-busy={submitting}>
      <Card className="gap-0">
        <CardHeader className="border-b pb-4"><CardTitle>Complete su solicitud</CardTitle><p className="text-sm text-muted-foreground">Podrá revisar toda la información antes de enviar.</p></CardHeader>
        <fieldset disabled={submitting}>
          <CardContent className="space-y-9 pt-7 sm:space-y-10">
            <FormSection className="gap-5" title="1. Espacio" description="Seleccione el lugar que desea solicitar.">
              <FormField id="reservation-resource" label="Espacio" error={form.formState.errors.resourceId?.message} required>
                <Select {...form.register('resourceId', { onChange: invalidateAvailability })}><option value="">Seleccione un espacio</option>{reservableSpaces.map(resource => <option key={resource.id} value={resource.id}>{resource.name}{resource.location ? ` · ${resource.location}` : ''}</option>)}</Select>
              </FormField>
              {selectedResource ? <ResourceSummary resource={selectedResource} /> : null}
            </FormSection>
              <FormSection className="gap-5" title="2. Fecha y horario" description="Elija un período continuo y luego defina las horas. La disponibilidad se valida con el servidor.">
               <div className="grid gap-5 rounded-surface border border-border-subtle bg-brand-ivory/40 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:items-start"><div><DateRangePicker startId="reservation-start-date" endId="reservation-end-date" startLabel="Período de reserva" endLabel="fin" startValue={datePart(values.startAt)} endValue={datePart(values.endAt)} min={new Date().toISOString().slice(0, 10)} onStartChange={value => { form.setValue('startAt', withDate(value, values.startAt, '08:00'), { shouldValidate: true, shouldTouch: true }); invalidateAvailability() }} onEndChange={value => { form.setValue('endAt', withDate(value, values.endAt, '09:00'), { shouldValidate: true, shouldTouch: true }); invalidateAvailability() }} /></div><aside className="rounded-control border border-border-subtle bg-surface p-3"><p className="text-caption font-bold uppercase tracking-wide text-primary">Disponibilidad</p><p className="mt-1 text-body-small text-text-secondary">Seleccione rango y horario; el servidor confirma el resultado definitivo.</p><div className="mt-3"><AvailabilityStatus status={availability} onCheck={() => void checkAvailability()} disabled={availability === 'checking' || availabilityQuery.isFetching} /></div></aside></div>
                <div className="grid gap-5 sm:grid-cols-2">
                 <FormField id="reservation-start-time" label="Hora de inicio" error={form.formState.errors.startAt?.message} required><Input id="reservation-start-time" type="time" value={timePart(values.startAt, '')} onChange={event => { form.setValue('startAt', withTime(event.target.value, values.startAt, '08:00'), { shouldValidate: true, shouldTouch: true }); invalidateAvailability() }} disabled={!datePart(values.startAt)} /></FormField>
                 <FormField id="reservation-end-time" label="Hora de finalización" error={form.formState.errors.endAt?.message} required><Input id="reservation-end-time" type="time" value={timePart(values.endAt, '')} onChange={event => { form.setValue('endAt', withTime(event.target.value, values.endAt, '09:00'), { shouldValidate: true, shouldTouch: true }); invalidateAvailability() }} disabled={!datePart(values.endAt)} /></FormField>
               </div>
            </FormSection>
            <FormSection className="gap-5 rounded-surface border border-border bg-subtle/50 p-4 sm:p-5" title="Datos de la solicitud" description="Indique la actividad, su categoría y el uso previsto.">
              <div className="grid gap-5 sm:grid-cols-2"><FormField id="reservation-activity" label="Actividad" error={form.formState.errors.activity?.message} required><Select {...form.register("activity")}><option value="">Seleccione una actividad</option>{reservationActivities.map(activity => <option key={activity.value} value={activity.value}>{activity.label}</option>)}</Select></FormField><FormField id="reservation-applicant-category" label="Categoría de solicitante" error={form.formState.errors.applicantCategory?.message} required><Select {...form.register("applicantCategory")}><option value="">Seleccione una categoría</option>{reservationApplicantCategories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}</Select></FormField></div>{values.activity && values.applicantCategory ? <p className={selectedTariff === null ? "text-sm text-destructive" : "text-sm font-semibold text-foreground"} role={selectedTariff === null ? "alert" : "status"}>{selectedTariff === null ? "No hay tarifa definida para esta combinación; no se puede enviar la solicitud." : "Tarifa de la solicitud: " + formatReservationTariff(selectedTariff)}</p> : null}<FormField id="reservation-purpose" label="Motivo" error={form.formState.errors.purpose?.message} required><Textarea maxLength={1000} {...form.register('purpose')} /></FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id="reservation-attendees" label="Cantidad de personas (opcional)" error={form.formState.errors.estimatedAttendees?.message}><Input type="number" min="1" inputMode="numeric" {...form.register('estimatedAttendees')} /></FormField>
                <FormField id="reservation-notes" label="Notas adicionales (opcional)" error={form.formState.errors.notes?.message}><Textarea className="min-h-24" maxLength={5000} {...form.register('notes')} /></FormField>
              </div>
            </FormSection>

          </CardContent>
          <CardFooter className="mt-7 flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm text-muted-foreground"><p className="font-semibold text-foreground">Paso 3: revise antes de enviar</p><p id="review-requirement" className="mt-1">Confirme disponibilidad para habilitar la revisión. La solicitud queda pendiente de revisión; no reserva ni aprueba el espacio.</p></div><Button className="w-full sm:w-auto" size="lg" type="submit" disabled={availability !== 'available' || selectedTariff === null} aria-describedby="review-requirement">Revisar solicitud</Button></CardFooter>
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
  return <div className={`rounded-control border px-4 py-3.5 ${tone}`} role="status" aria-live="polite"><div className="grid min-w-0 gap-3"><p className="min-w-0 font-medium">{copy}</p><Button className="w-full" variant="outline" type="button" onClick={onCheck} disabled={disabled} loading={status === 'checking'}>{status === 'checking' ? 'Consultando disponibilidad' : 'Consultar disponibilidad'}</Button></div></div>
}

function ReservationReview({ values, resource, tariff, availability, submitting, onEdit, onSubmit }: { values: Values; resource?: ReservableResource; tariff: number | null; availability: Availability; submitting: boolean; onEdit: () => void; onSubmit: () => void }) {
  return <form noValidate onSubmit={onSubmit} aria-busy={submitting}><Card className="gap-0"><CardHeader className="border-b pb-4"><CardTitle><h2>3. Revise su solicitud</h2></CardTitle><p className="text-sm text-muted-foreground">Verifique datos. Enviar es una acción final y crea una solicitud pendiente de revisión.</p></CardHeader><CardContent className="space-y-6 pt-6"><AvailabilityStatus status={availability} onCheck={() => undefined} disabled /><dl className="grid gap-5 text-sm sm:grid-cols-2"><Summary label="Espacio" value={resource?.name ?? 'Espacio seleccionado'} /><Summary label="Fecha y hora" value={`${formatLocalDate(values.startAt)} a ${formatLocalDate(values.endAt)}`} /><Summary label="Actividad" value={reservationActivities.find(item => item.value === values.activity)?.label ?? values.activity} /><Summary label="Categoría" value={reservationApplicantCategories.find(item => item.value === values.applicantCategory)?.label ?? values.applicantCategory} /><Summary label="Tarifa" value={tariff === null ? "No definida" : formatReservationTariff(tariff)} /><Summary label="Motivo" value={values.purpose} /><Summary label="Personas estimadas" value={values.estimatedAttendees || 'No indicado'} />{values.notes.trim() ? <Summary label="Notas adicionales" value={values.notes} /> : null}</dl></CardContent><CardFooter className="mt-6 flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"><Button variant="outline" type="button" onClick={onEdit} disabled={submitting}>Volver a editar</Button><Button className="w-full sm:w-auto" size="lg" type="submit" loading={submitting} disabled={availability !== 'available' || tariff === null}>{submitting ? 'Enviando solicitud' : 'Enviar solicitud'}</Button></CardFooter></Card></form>
}

function ReservationSubmitted({ confirmation, onNewRequest }: { confirmation: Confirmation; onNewRequest: () => void }) {
  return <Card className="border-success/40 bg-success-bg"><CardContent className="space-y-5 p-6 sm:p-8"><CheckCircle2 className="size-10 text-success" aria-hidden="true" /><div><h2 className="text-heading-2 font-bold text-foreground">Solicitud recibida</h2><p className="mt-2 text-body-large text-foreground">Su solicitud está pendiente de revisión por la Asociación.</p></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><Summary label="Espacio" value={confirmation.resourceName} /><Summary label="Fecha y hora" value={`${formatLocalDate(confirmation.startAt)} a ${formatLocalDate(confirmation.endAt)}`} /><Summary label="Estado" value="Pendiente de revisión" /></dl><p className="text-sm text-muted-foreground">Enviar una solicitud no aprueba ni confirma la reserva.</p><div className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={onNewRequest}>Solicitar otra reserva</Button><a className="inline-flex h-11 items-center justify-center rounded-control px-4 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" href="/servicios">Volver a servicios</a></div></CardContent></Card>
}

function ResourceSummary({ resource }: { resource: ReservableResource }) { return <Card className="bg-brand-ivory"><CardContent className="space-y-2 p-4"><p className="font-bold text-brand-ink">Está reservando: {resource.name}</p>{resource.description ? <p className="text-sm text-muted-foreground">{resource.description}</p> : null}<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">{resource.location ? <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{resource.location}</span> : null}{resource.capacity ? <span className="inline-flex items-center gap-1"><UsersRound className="size-4" aria-hidden="true" />Capacidad: {resource.capacity} personas</span> : null}</div>{resource.name === "Salón Comunal" ? <p className="text-sm text-muted-foreground">Incluye mobiliario (mesas y sillas), área de cocina y área de bar.</p> : null}</CardContent></Card> }
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-foreground">{value}</dd></div> }
