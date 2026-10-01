import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/Modal'
import { Textarea } from '@/shared/ui/textarea'
import { Button } from '@/shared/ui/button'
import { useVentureMutations } from '../hooks/useVentures'
import type { Venture, VentureInput } from '../model/ventures.types'

type FormState = Required<VentureInput>

const emptyForm: FormState = { name: '', incorporatedAt: '', description: '', offerDescription: '', businessPhone: '', businessEmail: '', websiteUrl: '', socialUrl: '', locationText: '' }

function initialForm(venture?: Venture): FormState {
  if (!venture) return emptyForm
  return {
    name: venture.name,
    incorporatedAt: venture.incorporatedAt.slice(0, 10),
    description: venture.description ?? '',
    offerDescription: venture.offerDescription ?? '',
    businessPhone: venture.businessPhone ?? '',
    businessEmail: venture.businessEmail ?? '',
    websiteUrl: venture.websiteUrl ?? '',
    socialUrl: venture.socialUrl ?? '',
    locationText: venture.locationText ?? '',
  }
}

function optional(value: string) { return value.trim() || undefined }
function isUrl(value: string) { try { new URL(value); return true } catch { return false } }

function errors(form: FormState) {
  return {
    name: !form.name.trim() ? 'Ingrese nombre del emprendimiento.' : '',
    incorporatedAt: !form.incorporatedAt ? 'Indique fecha de incorporación.' : '',
    businessEmail: form.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail.trim()) ? 'Ingrese correo electrónico válido.' : '',
    websiteUrl: form.websiteUrl && !isUrl(form.websiteUrl.trim()) ? 'Ingrese URL válida.' : '',
    socialUrl: form.socialUrl && !isUrl(form.socialUrl.trim()) ? 'Ingrese URL válida.' : '',
  }
}

function payload(form: FormState, editing: boolean): VentureInput {
  const values: VentureInput = {
    name: form.name.trim() || undefined,
    incorporatedAt: form.incorporatedAt ? new Date(`${form.incorporatedAt}T00:00:00`).toISOString() : undefined,
    description: optional(form.description),
    offerDescription: optional(form.offerDescription),
    businessPhone: optional(form.businessPhone),
    businessEmail: optional(form.businessEmail)?.toLowerCase(),
    websiteUrl: optional(form.websiteUrl),
    socialUrl: optional(form.socialUrl),
    locationText: optional(form.locationText),
  }
  return editing ? values : values
}

export function VentureForm({ venture, onClose, onSuccess }: { venture?: Venture; onClose: () => void; onSuccess: (updated: boolean) => void }) {
  const [form, setForm] = useState(() => initialForm(venture))
  const [submitted, setSubmitted] = useState(false)
  const [requestError, setRequestError] = useState('')
  const { create, update } = useVentureMutations()
  const mutation = venture ? update : create
  const fieldErrors = errors(form)
  const invalid = Object.values(fieldErrors).some(Boolean)
  const change = (field: keyof FormState, value: string) => setForm(current => ({ ...current, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (invalid || mutation.isPending) return
    setRequestError('')
    try {
      const input = payload(form, Boolean(venture))
      if (venture) await update.mutateAsync({ id: venture.id, input })
      else await create.mutateAsync(input as Required<Pick<VentureInput, 'name' | 'incorporatedAt'>> & VentureInput)
      onSuccess(Boolean(venture))
      onClose()
    } catch (reason) { setRequestError(getErrorMessage(reason, 'No fue posible guardar emprendimiento.')) }
  }
  const showError = (field: keyof ReturnType<typeof errors>) => submitted ? fieldErrors[field] : ''

  return <Modal title={venture ? 'Editar emprendimiento' : 'Registrar emprendimiento'} onClose={onClose} busy={mutation.isPending}>
    <form className="grid gap-5" onSubmit={submit} noValidate>
      {requestError ? <ErrorState title="No fue posible guardar" message={requestError} /> : null}
      <fieldset disabled={mutation.isPending} className="grid gap-5">
        <legend className="sr-only">Datos del emprendimiento</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField id="venture-name" label="Nombre" required error={showError('name')} className="md:col-span-2"><Input required autoComplete="organization" maxLength={200} value={form.name} onChange={event => change('name', event.target.value)} /></FormField>
          <FormField id="venture-incorporated-at" label="Fecha de incorporación" required error={showError('incorporatedAt')}><Input required type="date" value={form.incorporatedAt} onChange={event => change('incorporatedAt', event.target.value)} /></FormField>
          <FormField id="venture-phone" label="Teléfono comercial"><Input type="tel" autoComplete="tel" maxLength={50} value={form.businessPhone} onChange={event => change('businessPhone', event.target.value)} /></FormField>
          <FormField id="venture-email" label="Correo comercial" error={showError('businessEmail')}><Input type="email" autoComplete="email" value={form.businessEmail} onChange={event => change('businessEmail', event.target.value)} /></FormField>
          <FormField id="venture-location" label="Ubicación" description="Máximo 500 caracteres."><Input maxLength={500} value={form.locationText} onChange={event => change('locationText', event.target.value)} /></FormField>
          <FormField id="venture-website" label="Sitio web" error={showError('websiteUrl')}><Input type="url" inputMode="url" placeholder="https://" value={form.websiteUrl} onChange={event => change('websiteUrl', event.target.value)} /></FormField>
          <FormField id="venture-social" label="Red social" error={showError('socialUrl')}><Input type="url" inputMode="url" placeholder="https://" value={form.socialUrl} onChange={event => change('socialUrl', event.target.value)} /></FormField>
          <FormField id="venture-description" label="Descripción" className="md:col-span-2"><Textarea maxLength={5000} value={form.description} onChange={event => change('description', event.target.value)} /></FormField>
          <FormField id="venture-offer" label="Oferta comercial" description="Máximo 5000 caracteres." className="md:col-span-2"><Textarea maxLength={5000} value={form.offerDescription} onChange={event => change('offerDescription', event.target.value)} /></FormField>
        </div>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando…' : venture ? 'Guardar cambios' : 'Registrar emprendimiento'}</Button></div>
    </form>
  </Modal>
}
