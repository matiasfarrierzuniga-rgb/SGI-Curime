import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/Modal'
import { Textarea } from '@/shared/ui/textarea'
import { useOpportunityMutations } from '../hooks/useOpportunities'
import type { VolunteerOpportunity, VolunteerOpportunityInput } from '../model/opportunities.types'

type FormState = { title: string; description: string; location: string; capacity: string; applicationDeadline: string }
const emptyForm: FormState = { title: '', description: '', location: '', capacity: '', applicationDeadline: '' }
const optional = (value: string) => value.trim() || undefined

function initialForm(opportunity?: VolunteerOpportunity): FormState {
  if (!opportunity) return emptyForm
  return { title: opportunity.title, description: opportunity.description ?? '', location: opportunity.location ?? '', capacity: opportunity.capacity?.toString() ?? '', applicationDeadline: opportunity.applicationDeadline?.slice(0, 10) ?? '' }
}

function fieldErrors(form: FormState) {
  const capacity = form.capacity.trim()
  return {
    title: !form.title.trim() ? 'Ingrese título de oportunidad.' : '',
    capacity: capacity && !/^\d+$/.test(capacity) ? 'Ingrese capacidad como número entero.' : '',
  }
}

function payload(form: FormState): VolunteerOpportunityInput {
  return {
    title: form.title.trim() || undefined,
    description: optional(form.description),
    location: optional(form.location),
    capacity: form.capacity.trim() ? Number(form.capacity) : undefined,
    applicationDeadline: form.applicationDeadline ? new Date(`${form.applicationDeadline}T00:00:00`).toISOString() : undefined,
  }
}

export function OpportunityForm({ opportunity, onClose, onSuccess }: { opportunity?: VolunteerOpportunity; onClose: () => void; onSuccess: (updated: boolean) => void }) {
  const [form, setForm] = useState(() => initialForm(opportunity))
  const [submitted, setSubmitted] = useState(false)
  const [requestError, setRequestError] = useState('')
  const { create, update } = useOpportunityMutations()
  const mutation = opportunity ? update : create
  const errors = fieldErrors(form)
  const invalid = Object.values(errors).some(Boolean)
  const isDirty = Object.entries(form).some(([field, value]) => value !== initialForm(opportunity)[field as keyof FormState])
  const change = (field: keyof FormState, value: string) => setForm(current => ({ ...current, [field]: value }))
  const showError = (field: keyof typeof errors) => submitted ? errors[field] : ''

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (invalid || mutation.isPending || (opportunity && !isDirty)) return
    setRequestError('')
    try {
      const input = payload(form)
      if (opportunity) await update.mutateAsync({ id: opportunity.id, input })
      else await create.mutateAsync(input as Required<Pick<VolunteerOpportunityInput, 'title'>> & VolunteerOpportunityInput)
      onSuccess(Boolean(opportunity)); onClose()
    } catch (reason) { setRequestError(getErrorMessage(reason, 'No fue posible guardar oportunidad.')) }
  }

  return <Modal title={opportunity ? 'Editar oportunidad' : 'Registrar oportunidad'} onClose={onClose} busy={mutation.isPending}>
    <form className="grid gap-5" onSubmit={submit} noValidate>
      {requestError ? <ErrorState title="No fue posible guardar" message={requestError} /> : null}
      <fieldset disabled={mutation.isPending} className="grid gap-5"><legend className="sr-only">Datos de oportunidad de voluntariado</legend><div className="grid gap-5 md:grid-cols-2">
        <FormField id="opportunity-title" label="Título" required error={showError('title')} className="md:col-span-2"><Input required autoFocus maxLength={200} value={form.title} onChange={event => change('title', event.target.value)} /></FormField>
        <FormField id="opportunity-location" label="Ubicación"><Input maxLength={500} value={form.location} onChange={event => change('location', event.target.value)} /></FormField>
        <FormField id="opportunity-capacity" label="Capacidad" description="Solo números enteros." error={showError('capacity')}><Input type="number" step="1" inputMode="numeric" value={form.capacity} onChange={event => change('capacity', event.target.value)} /></FormField>
        <FormField id="opportunity-deadline" label="Fecha límite de postulación" className="md:col-span-2"><Input type="date" value={form.applicationDeadline} onChange={event => change('applicationDeadline', event.target.value)} /></FormField>
        <FormField id="opportunity-description" label="Descripción" className="md:col-span-2"><Textarea maxLength={5000} value={form.description} onChange={event => change('description', event.target.value)} /></FormField>
      </div></fieldset>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button><Button type="submit" disabled={mutation.isPending || Boolean(opportunity && !isDirty)}>{mutation.isPending ? 'Guardando…' : opportunity ? 'Guardar cambios' : 'Registrar oportunidad'}</Button></div>
    </form>
  </Modal>
}
