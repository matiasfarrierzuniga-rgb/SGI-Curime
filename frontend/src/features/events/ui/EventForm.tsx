import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Modal } from '@/shared/ui/Modal'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { useEventMutations } from '../hooks/useEventsQueries'
import type { AdminEvent, EventPayload, EventStatus } from '../model/events.types'

type FormState = { title: string; summary: string; description: string; startAt: string; endAt: string; location: string; status: EventStatus }

function toLocal(value: string | null) { return value ? value.slice(0, 16) : '' }
function initialForm(event?: AdminEvent): FormState {
  return event ? { title: event.title, summary: event.summary, description: event.description ?? '', startAt: toLocal(event.startAt), endAt: toLocal(event.endAt), location: event.location ?? '', status: event.status } : { title: '', summary: '', description: '', startAt: '', endAt: '', location: '', status: 'SCHEDULED' }
}
function toPayload(form: FormState): EventPayload {
  return { title: form.title.trim(), summary: form.summary.trim(), description: form.description.trim() || undefined, startAt: form.startAt, endAt: form.endAt || undefined, location: form.location.trim() || undefined, status: form.status }
}

export function EventForm({ event, onClose }: { event?: AdminEvent; onClose: () => void }) {
  const [form, setForm] = useState(() => initialForm(event))
  const [error, setError] = useState('')
  const { create, update } = useEventMutations()
  const mutation = event ? update : create
  const fieldError = !form.title.trim() ? 'Ingrese un título.' : !form.summary.trim() ? 'Ingrese un resumen.' : !form.startAt ? 'Indique fecha y hora de inicio.' : form.endAt && form.endAt <= form.startAt ? 'La fecha final debe ser posterior a la inicial.' : ''

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
    <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); void submit() }}>
      {error ? <ErrorState title="No fue posible guardar el evento" message={error} /> : null}
      <fieldset disabled={mutation.isPending} className="grid gap-5">
        <legend className="sr-only">Datos del evento</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2"><Label htmlFor="event-title">Título</Label><Input id="event-title" required maxLength={200} aria-describedby={!form.title.trim() ? 'event-title-error' : undefined} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />{!form.title.trim() ? <span id="event-title-error" className="text-sm text-destructive" role="alert">Ingrese un título.</span> : null}</div>
          <div className="grid gap-2 md:col-span-2"><Label htmlFor="event-summary">Resumen</Label><Input id="event-summary" required maxLength={500} aria-describedby={!form.summary.trim() ? 'event-summary-error' : undefined} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />{!form.summary.trim() ? <span id="event-summary-error" className="text-sm text-destructive" role="alert">Ingrese un resumen.</span> : null}</div>
          <div className="grid gap-2 md:col-span-2"><Label htmlFor="event-description">Descripción pública</Label><Textarea id="event-description" maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid gap-2"><Label htmlFor="event-start-at">Fecha y hora de inicio</Label><Input id="event-start-at" required type="datetime-local" aria-describedby={!form.startAt ? 'event-start-at-error' : undefined} value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />{!form.startAt ? <span id="event-start-at-error" className="text-sm text-destructive" role="alert">Indique fecha y hora de inicio.</span> : null}</div>
          <div className="grid gap-2"><Label htmlFor="event-end-at">Fecha y hora de finalización</Label><Input id="event-end-at" type="datetime-local" aria-describedby={form.endAt && form.endAt <= form.startAt ? 'event-end-at-error' : undefined} value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />{form.endAt && form.endAt <= form.startAt ? <span id="event-end-at-error" className="text-sm text-destructive" role="alert">La fecha final debe ser posterior a la inicial.</span> : null}</div>
          <div className="grid gap-2"><Label htmlFor="event-location">Lugar público</Label><Input id="event-location" maxLength={200} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="grid gap-2"><Label htmlFor="event-status">Estado del evento</Label><Select id="event-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}><option value="SCHEDULED">Programado</option><option value="CANCELLED">Cancelado</option><option value="COMPLETED">Finalizado</option></Select></div>
        </div>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><button className="min-h-11 rounded-control border border-border px-4 font-semibold" type="button" onClick={onClose} disabled={mutation.isPending}>Cancelar</button><button className="min-h-11 rounded-control bg-interaction-primary-default px-4 font-semibold text-primary-foreground disabled:opacity-50" disabled={mutation.isPending || Boolean(fieldError)}>{mutation.isPending ? 'Guardando…' : 'Guardar evento'}</button></div>
    </form>
  </Modal>
}
