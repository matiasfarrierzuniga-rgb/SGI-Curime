import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Modal } from '@/shared/ui/Modal'
import { useEventMutations } from '../hooks/useEventsQueries'
import type { AdminEvent, EventPayload, EventStatus } from '../model/events.types'

type FormState = { title: string; summary: string; description: string; startAt: string; endAt: string; location: string; status: EventStatus }

function toLocal(value: string | null) { return value ? value.slice(0, 16) : '' }
function initialForm(event?: AdminEvent): FormState {
  return event ? { title: event.title, summary: event.summary, description: event.description ?? '', startAt: toLocal(event.startAt), endAt: toLocal(event.endAt), location: event.location ?? '', status: event.status } : { title: '', summary: '', description: '', startAt: '', endAt: '', location: '', status: 'SCHEDULED' }
}
function toPayload(form: FormState): EventPayload {
  return { title: form.title.trim(), summary: form.summary.trim(), description: form.description.trim() || undefined, startAt: new Date(form.startAt).toISOString(), endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined, location: form.location.trim() || undefined, status: form.status }
}

export function EventForm({ event, onClose }: { event?: AdminEvent; onClose: () => void }) {
  const [form, setForm] = useState(() => initialForm(event))
  const [error, setError] = useState('')
  const { create, update } = useEventMutations()
  const mutation = event ? update : create
  const fieldError = !form.title.trim() ? 'Ingrese un título.' : !form.summary.trim() ? 'Ingrese un resumen.' : !form.startAt ? 'Indique fecha y hora de inicio.' : form.endAt && new Date(form.endAt) <= new Date(form.startAt) ? 'La fecha final debe ser posterior a la inicial.' : ''

  const submit = async () => {
    if (mutation.isPending || fieldError) return
    setError('')
    try {
      const payload = toPayload(form)
      if (event) await update.mutateAsync({ id: event.id, payload })
      else await create.mutateAsync(payload)
      onClose()
    } catch (reason) { setError(getErrorMessage(reason, 'No fue posible guardar el evento.')) }
  }

  return <Modal title={event ? 'Editar evento' : 'Crear evento'} onClose={onClose} busy={mutation.isPending}>
    <form className="form-grid" onSubmit={(e) => { e.preventDefault(); void submit() }}>
      {error ? <ErrorState title="No fue posible guardar el evento" message={error} /> : null}
      <fieldset disabled={mutation.isPending} className="contents">
        <label htmlFor="event-title">Título</label><input id="event-title" required maxLength={200} aria-describedby={!form.title.trim() ? 'event-title-error' : undefined} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />{!form.title.trim() ? <span id="event-title-error" className="field-error" role="alert">Ingrese un título.</span> : null}
        <label htmlFor="event-summary">Resumen</label><input id="event-summary" required maxLength={500} aria-describedby={!form.summary.trim() ? 'event-summary-error' : undefined} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />{!form.summary.trim() ? <span id="event-summary-error" className="field-error" role="alert">Ingrese un resumen.</span> : null}
        <label htmlFor="event-description">Descripción pública</label><textarea id="event-description" maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label htmlFor="event-start-at">Fecha y hora de inicio</label><input id="event-start-at" required type="datetime-local" aria-describedby={!form.startAt ? 'event-start-at-error' : undefined} value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />{!form.startAt ? <span id="event-start-at-error" className="field-error" role="alert">Indique fecha y hora de inicio.</span> : null}
        <label htmlFor="event-end-at">Fecha y hora de finalización</label><input id="event-end-at" type="datetime-local" aria-describedby={form.endAt && new Date(form.endAt) <= new Date(form.startAt) ? 'event-end-at-error' : undefined} value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />{form.endAt && new Date(form.endAt) <= new Date(form.startAt) ? <span id="event-end-at-error" className="field-error" role="alert">La fecha final debe ser posterior a la inicial.</span> : null}
        <label htmlFor="event-location">Lugar público</label><input id="event-location" maxLength={200} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <label htmlFor="event-status">Estado del evento</label><select id="event-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}><option value="SCHEDULED">Programado</option><option value="CANCELLED">Cancelado</option><option value="COMPLETED">Finalizado</option></select>
      </fieldset>
      <div className="actions"><button type="button" onClick={onClose} disabled={mutation.isPending}>Cancelar</button><button className="primary" disabled={mutation.isPending || Boolean(fieldError)}>{mutation.isPending ? 'Guardando…' : 'Guardar evento'}</button></div>
    </form>
  </Modal>
}
