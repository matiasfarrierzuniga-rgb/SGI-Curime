import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Modal } from '@/shared/ui/Modal'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { useEventMutations } from '../hooks/useEventsQueries'
import type { AdminEvent, EventPayload, EventStatus } from '../model/events.types'

type FormState = { title: string; summary: string; description: string; startAt: string; endAt: string; location: string; status: EventStatus }
type FieldName = keyof FormState

function toLocal(value: string | null) { return value ? value.slice(0, 16) : '' }
function initialForm(event?: AdminEvent): FormState {
  return event ? { title: event.title, summary: event.summary, description: event.description ?? '', startAt: toLocal(event.startAt), endAt: toLocal(event.endAt), location: event.location ?? '', status: event.status } : { title: '', summary: '', description: '', startAt: '', endAt: '', location: '', status: 'SCHEDULED' }
}
function toPayload(form: FormState): EventPayload {
  return { title: form.title.trim(), summary: form.summary.trim(), description: form.description.trim() || undefined, startAt: form.startAt, endAt: form.endAt || undefined, location: form.location.trim() || undefined, status: form.status }
}
function errorsFor(form: FormState) {
  return { title: !form.title.trim() ? 'Ingrese un título.' : form.title.length > 200 ? 'El título no puede superar 200 caracteres.' : '', summary: !form.summary.trim() ? 'Ingrese un resumen.' : form.summary.length > 500 ? 'El resumen no puede superar 500 caracteres.' : '', description: form.description.length > 5000 ? 'La descripción no puede superar 5000 caracteres.' : '', startAt: !form.startAt ? 'Indique fecha y hora de inicio.' : '', endAt: form.endAt && form.endAt <= form.startAt ? 'La fecha final debe ser posterior a la inicial.' : '', location: form.location.length > 200 ? 'El lugar no puede superar 200 caracteres.' : '' }
}

export function EventForm({ event, onClose }: { event?: AdminEvent; onClose: () => void }) {
  const [form, setForm] = useState(() => initialForm(event))
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const { create, update } = useEventMutations()
  const mutation = event ? update : create
  const fieldErrors = errorsFor(form)
  const invalid = Object.values(fieldErrors).some(Boolean)
  const showError = (field: keyof typeof fieldErrors) => (submitted || touched[field]) ? fieldErrors[field] : ''
  const updateField = <Field extends FieldName>(field: Field, value: FormState[Field]) => setForm(current => ({ ...current, [field]: value }))

  const submit = async () => {
    setSubmitted(true)
    if (mutation.isPending || invalid) return
    setError('')
    try {
      const payload = toPayload(form)
      if (event) await update.mutateAsync({ id: event.id, payload })
      else await create.mutateAsync(payload)
      onClose()
    } catch (reason) { setError(getErrorMessage(reason, 'No fue posible guardar el evento.')) }
  }
  const fieldProps = (field: FieldName) => ({ onBlur: () => setTouched(current => ({ ...current, [field]: true })) })

  return <Modal title={event ? 'Editar evento' : 'Crear evento'} onClose={onClose} busy={mutation.isPending}>
    <form className="grid gap-6" noValidate onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <div className="border-b border-border pb-4"><p className="text-body-small text-foreground-muted">Los campos marcados con * son obligatorios. La fecha y hora se conservan exactamente como se ingresan.</p></div>
      {error ? <ErrorState title="No fue posible guardar el evento" message={error} /> : null}
      <fieldset disabled={mutation.isPending} className="grid gap-6">
        <legend className="sr-only">Datos del evento</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2"><Label htmlFor="event-title">Título</Label><Input id="event-title" required maxLength={200} aria-invalid={Boolean(showError('title'))} aria-describedby={showError('title') ? 'event-title-error' : undefined} value={form.title} onChange={(e) => updateField('title', e.target.value)} {...fieldProps('title')} />{showError('title') ? <span id="event-title-error" className="text-sm text-destructive" role="alert">{showError('title')}</span> : null}</div>
          <div className="grid gap-2 md:col-span-2"><Label htmlFor="event-summary">Resumen</Label><Input id="event-summary" required maxLength={500} aria-invalid={Boolean(showError('summary'))} aria-describedby={showError('summary') ? 'event-summary-error' : undefined} value={form.summary} onChange={(e) => updateField('summary', e.target.value)} {...fieldProps('summary')} />{showError('summary') ? <span id="event-summary-error" className="text-sm text-destructive" role="alert">{showError('summary')}</span> : null}</div>
          <div className="grid gap-2 md:col-span-2"><Label htmlFor="event-description">Descripción pública</Label><Textarea id="event-description" maxLength={5000} aria-invalid={Boolean(showError('description'))} aria-describedby={showError('description') ? 'event-description-error' : undefined} value={form.description} onChange={(e) => updateField('description', e.target.value)} {...fieldProps('description')} />{showError('description') ? <span id="event-description-error" className="text-sm text-destructive" role="alert">{showError('description')}</span> : null}</div>
          <div className="grid gap-2"><Label htmlFor="event-start-at">Fecha y hora de inicio</Label><Input id="event-start-at" required type="datetime-local" aria-invalid={Boolean(showError('startAt'))} aria-describedby={showError('startAt') ? 'event-start-at-error' : undefined} value={form.startAt} onChange={(e) => updateField('startAt', e.target.value)} {...fieldProps('startAt')} />{showError('startAt') ? <span id="event-start-at-error" className="text-sm text-destructive" role="alert">{showError('startAt')}</span> : null}</div>
          <div className="grid gap-2"><Label htmlFor="event-end-at">Fecha y hora de finalización</Label><Input id="event-end-at" type="datetime-local" min={form.startAt || undefined} aria-invalid={Boolean(showError('endAt'))} aria-describedby={showError('endAt') ? 'event-end-at-error' : undefined} value={form.endAt} onChange={(e) => updateField('endAt', e.target.value)} {...fieldProps('endAt')} />{showError('endAt') ? <span id="event-end-at-error" className="text-sm text-destructive" role="alert">{showError('endAt')}</span> : null}</div>
          <div className="grid gap-2"><Label htmlFor="event-location">Lugar público</Label><Input id="event-location" maxLength={200} aria-invalid={Boolean(showError('location'))} aria-describedby={showError('location') ? 'event-location-error' : undefined} value={form.location} onChange={(e) => updateField('location', e.target.value)} {...fieldProps('location')} />{showError('location') ? <span id="event-location-error" className="text-sm text-destructive" role="alert">{showError('location')}</span> : null}</div>
          <div className="grid gap-2"><Label htmlFor="event-status">Estado del evento</Label><Select id="event-status" value={form.status} onChange={(e) => updateField('status', e.target.value as EventStatus)}><option value="SCHEDULED">Programado</option><option value="CANCELLED">Cancelado</option><option value="COMPLETED">Finalizado</option></Select></div>
        </div>
      </fieldset>
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end"><Button variant="outline" type="button" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button><Button type="submit" loading={mutation.isPending} disabled={mutation.isPending || invalid}>{mutation.isPending ? 'Guardando…' : 'Guardar evento'}</Button></div>
    </form>
  </Modal>
}
