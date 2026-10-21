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
type Step = 1 | 2 | 3 | 4

const steps = [
  { number: 1 as Step, label: 'Información básica' },
  { number: 2 as Step, label: 'Información comercial' },
  { number: 3 as Step, label: 'Descripción y oferta' },
  { number: 4 as Step, label: 'Revisión' },
]
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
function payload(form: FormState): VentureInput {
  return {
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
}

const stepFields: Record<Step, (keyof ReturnType<typeof errors>)[]> = {
  1: ['name', 'incorporatedAt'],
  2: ['businessEmail', 'websiteUrl', 'socialUrl'],
  3: [],
  4: ['name', 'incorporatedAt', 'businessEmail', 'websiteUrl', 'socialUrl'],
}

export function VentureForm({ venture, onClose, onSuccess }: { venture?: Venture; onClose: () => void; onSuccess: (updated: boolean) => void }) {
  const [form, setForm] = useState(() => initialForm(venture))
  const [step, setStep] = useState<Step>(1)
  const [furthestStep, setFurthestStep] = useState<Step>(1)
  const [attemptedSteps, setAttemptedSteps] = useState<Step[]>([])
  const [requestError, setRequestError] = useState('')
  const { create, update } = useVentureMutations()
  const mutation = venture ? update : create
  const fieldErrors = errors(form)
  const change = (field: keyof FormState, value: string) => setForm(current => ({ ...current, [field]: value }))
  const showError = (field: keyof ReturnType<typeof errors>) => attemptedSteps.some(attempted => stepFields[attempted].includes(field)) ? fieldErrors[field] : ''
  const stepInvalid = (target: Step) => stepFields[target].some(field => Boolean(fieldErrors[field]))

  const continueToNextStep = () => {
    setAttemptedSteps(current => current.includes(step) ? current : [...current, step])
    if (step === 4 || stepInvalid(step)) return
    const next = (step + 1) as Step
    setStep(next)
    setFurthestStep(current => Math.max(current, next) as Step)
  }
  const goToStep = (target: Step) => {
    if (target <= furthestStep) setStep(target)
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (step < 4) {
      continueToNextStep()
      return
    }
    setAttemptedSteps([1, 2, 3, 4])
    if (stepInvalid(4) || mutation.isPending) return
    setRequestError('')
    try {
      const input = payload(form)
      if (venture) await update.mutateAsync({ id: venture.id, input })
      else await create.mutateAsync(input as Required<Pick<VentureInput, 'name' | 'incorporatedAt'>> & VentureInput)
      onSuccess(Boolean(venture))
      onClose()
    } catch (reason) { setRequestError(getErrorMessage(reason, 'No fue posible guardar emprendimiento.')) }
  }

  return <Modal title={venture ? 'Editar emprendimiento' : 'Registrar emprendimiento'} onClose={onClose} busy={mutation.isPending}>
    <form className="grid gap-5" onSubmit={submit} noValidate>
      {requestError ? <ErrorState title="No fue posible guardar" message={requestError} /> : null}
      <nav aria-label="Progreso del registro" className="overflow-x-auto border-b border-border pb-4">
        <ol className="flex min-w-max items-center gap-2 sm:gap-3">{steps.map((item, index) => <li key={item.number} className="flex items-center gap-2">
          {index > 0 ? <span className="h-px w-4 bg-border sm:w-8" aria-hidden="true" /> : null}
          <button type="button" onClick={() => goToStep(item.number)} disabled={item.number > furthestStep || mutation.isPending} aria-current={step === item.number ? 'step' : undefined} className={`flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-body-small font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${step === item.number ? 'bg-brand-deep text-white' : item.number < step ? 'text-interaction-primary-default hover:bg-surface-subtle' : 'text-muted-foreground'} disabled:cursor-not-allowed disabled:opacity-60`}><span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-caption ${step === item.number ? 'bg-white/20 text-white' : 'bg-surface-subtle text-foreground'}`}>{item.number}</span><span>{item.label}</span></button>
        </li>)}</ol>
      </nav>
      <fieldset disabled={mutation.isPending} className="grid gap-5">
        <legend className="sr-only">Datos del emprendimiento</legend>
        {step === 1 ? <section aria-labelledby="venture-step-basic" className="grid gap-5"><div><p className="text-label font-semibold text-interaction-primary-default">Paso 1 de 4</p><h3 id="venture-step-basic" className="mt-1 text-heading-3 font-semibold text-text-primary">Información básica</h3><p className="mt-1 text-body-small text-text-secondary">Identifique el emprendimiento y su fecha de incorporación.</p></div><div className="grid gap-5 md:grid-cols-2"><FormField id="venture-name" label="Nombre" required error={showError('name')} className="md:col-span-2"><Input required autoComplete="organization" maxLength={200} value={form.name} onChange={event => change('name', event.target.value)} /></FormField><FormField id="venture-incorporated-at" label="Fecha de incorporación" required error={showError('incorporatedAt')}><Input required type="date" value={form.incorporatedAt} onChange={event => change('incorporatedAt', event.target.value)} /></FormField><FormField id="venture-location" label="Ubicación" description="Máximo 500 caracteres."><Input maxLength={500} value={form.locationText} onChange={event => change('locationText', event.target.value)} /></FormField></div></section> : null}
        {step === 2 ? <section aria-labelledby="venture-step-commercial" className="grid gap-5"><div><p className="text-label font-semibold text-interaction-primary-default">Paso 2 de 4</p><h3 id="venture-step-commercial" className="mt-1 text-heading-3 font-semibold text-text-primary">Información comercial</h3><p className="mt-1 text-body-small text-text-secondary">Agregue canales de contacto disponibles.</p></div><div className="grid gap-5 md:grid-cols-2"><FormField id="venture-phone" label="Teléfono comercial"><Input type="tel" autoComplete="tel" maxLength={50} value={form.businessPhone} onChange={event => change('businessPhone', event.target.value)} /></FormField><FormField id="venture-email" label="Correo comercial" error={showError('businessEmail')}><Input type="email" autoComplete="email" value={form.businessEmail} onChange={event => change('businessEmail', event.target.value)} /></FormField><FormField id="venture-website" label="Sitio web" error={showError('websiteUrl')}><Input type="url" inputMode="url" placeholder="https://" value={form.websiteUrl} onChange={event => change('websiteUrl', event.target.value)} /></FormField><FormField id="venture-social" label="Red social" error={showError('socialUrl')}><Input type="url" inputMode="url" placeholder="https://" value={form.socialUrl} onChange={event => change('socialUrl', event.target.value)} /></FormField></div></section> : null}
        {step === 3 ? <section aria-labelledby="venture-step-description" className="grid gap-5"><div><p className="text-label font-semibold text-interaction-primary-default">Paso 3 de 4</p><h3 id="venture-step-description" className="mt-1 text-heading-3 font-semibold text-text-primary">Descripción y oferta</h3><p className="mt-1 text-body-small text-text-secondary">Comparta información que ayude a conocer el emprendimiento.</p></div><div className="grid gap-5"><FormField id="venture-description" label="Descripción"><Textarea maxLength={5000} value={form.description} onChange={event => change('description', event.target.value)} /></FormField><FormField id="venture-offer" label="Oferta comercial" description="Máximo 5000 caracteres."><Textarea maxLength={5000} value={form.offerDescription} onChange={event => change('offerDescription', event.target.value)} /></FormField></div></section> : null}
        {step === 4 ? <Review form={form} /> : null}
      </fieldset>
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between"><Button type="button" variant="outline" onClick={step === 1 ? onClose : () => setStep((step - 1) as Step)} disabled={mutation.isPending}>{step === 1 ? 'Cancelar' : 'Anterior'}</Button>{step < 4 ? <Button type="button" onClick={continueToNextStep} disabled={mutation.isPending}>Continuar</Button> : <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando…' : venture ? 'Guardar cambios' : 'Registrar emprendimiento'}</Button>}</div>
    </form>
  </Modal>
}

function Review({ form }: { form: FormState }) {
  const value = (field: string) => field.trim() || 'No registrado'
  return <section aria-labelledby="venture-step-review" className="grid gap-5"><div><p className="text-label font-semibold text-interaction-primary-default">Paso 4 de 4</p><h3 id="venture-step-review" className="mt-1 text-heading-3 font-semibold text-text-primary">Revise la información</h3><p className="mt-1 text-body-small text-text-secondary">Confirme los datos antes de guardar el emprendimiento.</p></div><dl className="grid gap-4 md:grid-cols-2"><ReviewField label="Nombre" value={value(form.name)} /><ReviewField label="Fecha de incorporación" value={value(form.incorporatedAt)} /><ReviewField label="Ubicación" value={value(form.locationText)} /><ReviewField label="Teléfono comercial" value={value(form.businessPhone)} /><ReviewField label="Correo comercial" value={value(form.businessEmail)} /><ReviewField label="Sitio web" value={value(form.websiteUrl)} /><ReviewField label="Red social" value={value(form.socialUrl)} /><ReviewField label="Descripción" value={value(form.description)} /><ReviewField label="Oferta comercial" value={value(form.offerDescription)} /></dl></section>
}

function ReviewField({ label, value }: { label: string; value: string }) { return <div className="grid gap-1 rounded-lg border border-border bg-surface-subtle p-3"><dt className="text-label font-semibold text-text-primary">{label}</dt><dd className="whitespace-pre-wrap break-words text-body-small text-text-secondary">{value}</dd></div> }
