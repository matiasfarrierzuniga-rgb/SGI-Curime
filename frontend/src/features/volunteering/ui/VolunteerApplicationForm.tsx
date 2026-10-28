import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { PhoneField } from '@/shared/ui/forms/PhoneField'
import { useSubmitVolunteerApplication } from '../hooks/usePublicOpportunities'
import type { VolunteerApplicationInput } from '../model/publicOpportunities.types'

type Form = { fullName: string; email: string; phoneCountryCode: string; phoneNationalNumber: string; motivation: string }
const emptyForm: Form = { fullName: '', email: '', phoneCountryCode: '', phoneNationalNumber: '', motivation: '' }

function errorsFor(form: Form) {
  const email = form.email.trim()
  const code = form.phoneCountryCode.trim()
  const number = form.phoneNationalNumber.trim()
  const phoneValid = Boolean(code && number && /^\+[1-9]\d{0,3}$/.test(code) && /^\d+$/.test(number) && (code !== '+506' || number.length === 8) && code.length - 1 + number.length <= 15)
  return {
    fullName: !form.fullName.trim() ? 'Ingrese su nombre completo.' : '',
    email: email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Ingrese un correo válido.' : '',
    phone: (code || number) && !phoneValid ? 'Ingrese un teléfono válido.' : '',
    contact: !email && !phoneValid ? 'Indique al menos un correo electrónico o teléfono.' : '',
  }
}

export function VolunteerApplicationForm({ opportunityId }: { opportunityId: number }) {
  const [form, setForm] = useState(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [requestError, setRequestError] = useState('')
  const mutation = useSubmitVolunteerApplication(opportunityId)
  const errors = errorsFor(form)
  const change = (key: keyof Form, value: string) => setForm(current => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean) || mutation.isPending) return
    setRequestError('')
    const input: VolunteerApplicationInput = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase() || undefined,
      phoneCountryCode: form.phoneCountryCode || undefined,
      phoneNationalNumber: form.phoneNationalNumber || undefined,
      motivation: form.motivation.trim() || undefined,
    }
    try { await mutation.mutateAsync(input) }
    catch (error) { setRequestError(getErrorMessage(error, 'No fue posible enviar su postulación. Inténtelo de nuevo.')) }
  }

  if (mutation.isSuccess) return <div role="status" className="mt-8 rounded-control border border-success bg-success/10 p-5 text-body text-brand-ink">Tu postulación fue recibida correctamente y queda pendiente de revisión por la asociación.</div>

  return <section aria-labelledby="application-title" className="mt-9 border-t border-border pt-8">
    <h2 id="application-title" className="text-heading-2 font-semibold text-brand-ink">Postularme como voluntario</h2>
    <p className="mt-2 text-body text-brand-ink/75">Necesitamos su nombre y al menos un medio de contacto. La postulación queda pendiente de revisión.</p>
    <form noValidate onSubmit={submit} className="mt-6 grid gap-5">
      <FormField id="volunteer-full-name" label="Nombre completo" required error={submitted ? errors.fullName : ''}><Input id="volunteer-full-name" autoComplete="name" maxLength={200} value={form.fullName} onChange={event => change('fullName', event.target.value)} /></FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="volunteer-email" label="Correo electrónico" error={submitted ? errors.email : ''}><Input id="volunteer-email" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={event => change('email', event.target.value)} /></FormField>
        <PhoneField id="volunteer-phone" label="Teléfono" value={{ countryCode: form.phoneCountryCode || undefined, nationalNumber: form.phoneNationalNumber || undefined }} onChange={value => setForm(current => ({ ...current, phoneCountryCode: value.countryCode ?? '', phoneNationalNumber: value.nationalNumber ?? '' }))} error={submitted ? errors.phone : ''} />
      </div>
      {submitted && errors.contact ? <p role="alert" className="text-body-small font-medium text-destructive">{errors.contact}</p> : null}
      <FormField id="volunteer-motivation" label="Mensaje o motivación"><Textarea id="volunteer-motivation" maxLength={2000} value={form.motivation} onChange={event => change('motivation', event.target.value)} /></FormField>
      {requestError ? <p role="alert" className="text-body-small font-medium text-destructive">{requestError}</p> : null}
      <button type="submit" disabled={mutation.isPending} className="min-h-11 w-fit rounded-control bg-brand-deep px-6 font-semibold text-brand-ivory hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60">{mutation.isPending ? 'Enviando postulación…' : 'Enviar postulación'}</button>
    </form>
  </section>
}
