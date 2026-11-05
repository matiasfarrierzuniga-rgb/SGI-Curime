import { MailCheck } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { digitsOnly, emailError, identificationError, identificationMaxLength, normalizeEmail, normalizeText, phoneError, structuredNameError, type IdentificationType } from '@/shared/lib/formValidation'
import { useToast } from '@/shared/ui/Toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { PhoneField } from '@/shared/ui/forms/PhoneField'
import { showResultDialog } from '@/shared/ui/resultDialog'
import { communityAccountsService } from '../api/communityAccounts.api'
import {
  communityAccountFeedback,
} from '../model/communityAccountFeedback'

type FormState = {
  firstName: string
  firstSurname: string
  secondSurname: string
  identificationType: IdentificationType
  identification: string
  email: string
  phoneCountryCode: string
  phoneNationalNumber: string
  privacyAcknowledgement: boolean
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initial: FormState = {
  firstName: '', firstSurname: '', secondSurname: '', identificationType: 'NATIONAL', identification: '', email: '', phoneCountryCode: '+506', phoneNationalNumber: '', privacyAcknowledgement: false,
}
const inputClass = 'min-h-12 rounded-control border-border bg-control px-3.5 py-2.5 text-base'

export function CommunityRegistrationPage() {
  const { notify } = useToast()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deliveryFailed, setDeliveryFailed] = useState(false)
  const submitting = useRef(false)

  function validate() {
    const next: FormErrors = {
      firstName: structuredNameError(form.firstName),
      firstSurname: structuredNameError(form.firstSurname),
      secondSurname: structuredNameError(form.secondSurname, false),
      identification: identificationError(form.identificationType, form.identification),
      email: emailError(form.email),
      phoneNationalNumber: phoneError(form.phoneCountryCode, form.phoneNationalNumber),
      privacyAcknowledgement: form.privacyAcknowledgement ? '' : 'Debe aceptar el uso de sus datos para crear la cuenta.',
    }
    if ([form.firstName, form.firstSurname, form.secondSurname].map(normalizeText).filter(Boolean).join(' ').length > 150) {
      next.firstSurname = 'El nombre completo no puede superar 150 caracteres.'
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current || !validate()) return

    submitting.current = true
    setLoading(true)
    setDeliveryFailed(false)
    try {
      await communityAccountsService.register({
        ...form,
        firstName: normalizeText(form.firstName),
        firstSurname: normalizeText(form.firstSurname),
        secondSurname: normalizeText(form.secondSurname) || undefined,
        email: normalizeEmail(form.email),
        phoneCountryCode: form.phoneNationalNumber ? form.phoneCountryCode : undefined,
        phoneNationalNumber: form.phoneNationalNumber || undefined,
      })
      await showResultDialog({
        icon: 'info',
        title: 'Solicitud recibida',
        text: 'Si los datos permiten continuar, recibirás instrucciones. Revisá tu correo o solicitá ayuda para recuperar el acceso.',
        confirmButtonText: 'Entendido',
      })
      setSubmitted(true)
    } catch (error) {
      const feedback = communityAccountFeedback(error, 'register')
      if (feedback.message.startsWith('No pudimos enviar el correo')) setDeliveryFailed(true)
      if (feedback.field) {
        setErrors((current) => ({ ...current, [feedback.field!]: feedback.message }))
      } else {
        notify(feedback.message, feedback.kind)
      }
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section className="grid justify-items-center gap-5 py-8 text-center" aria-labelledby="community-registration-confirmation">
        <span className="grid size-16 place-items-center rounded-full bg-brand-primary text-white">
          <MailCheck className="size-8" aria-hidden="true" />
        </span>
        <div>
          <p className="public-eyebrow text-brand-primary">Revise su correo</p>
          <h1 id="community-registration-confirmation" className="mt-3 font-heading text-heading-1 font-bold text-brand-deep">Confirme su correo electrónico</h1>
          <p className="mx-auto mt-4 max-w-md text-body leading-relaxed text-text-secondary">Si los datos permiten continuar, recibirás instrucciones. Revisá tu correo y la carpeta de spam. Si no podés acceder, solicitá ayuda a la administración.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center rounded-control bg-brand-primary px-5 font-bold text-white" to="/login">Ir a iniciar sesión</Link>
        <Link className="inline-flex min-h-11 items-center font-bold text-brand-primary underline" to="/verify-community-email">Solicitar un nuevo enlace</Link>
      </section>
    )
  }

  return (
    <main className="w-full">
      <header>
        <p className="public-eyebrow text-brand-primary">Cuenta comunitaria</p>
        <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">Cree su cuenta</h1>
        <p className="mt-2 max-w-xl text-body leading-relaxed text-text-secondary">Verifique su correo para acceder a Mi Comunidad. Este registro no crea afiliación ni acceso administrativo.</p>
      </header>
      <form className="mt-6 grid gap-5" noValidate onSubmit={submit}>
        <Field id="community-id-type" label="Tipo de identificación">
          <Select id="community-id-type" value={form.identificationType} onChange={event => setForm(current => ({ ...current, identificationType: event.target.value as IdentificationType, identification: '' }))}><option value="NATIONAL">Cédula nacional</option><option value="DIMEX">DIMEX</option></Select>
        </Field>
        <Field id="community-identification" label="Número de identificación" error={errors.identification}>
          <Input id="community-identification" className={inputClass} inputMode="numeric" maxLength={identificationMaxLength(form.identificationType)} value={form.identification} aria-describedby={errors.identification ? 'community-identification-error' : undefined} onChange={event => setForm(current => ({ ...current, identification: digitsOnly(event.target.value, identificationMaxLength(current.identificationType)) }))} />
        </Field>
        <Field id="community-first-name" label="Nombre(s)" error={errors.firstName}>
          <Input id="community-first-name" className={inputClass} autoComplete="given-name" maxLength={150} value={form.firstName} aria-describedby={errors.firstName ? 'community-first-name-error' : undefined} onChange={event => setForm(current => ({ ...current, firstName: event.target.value }))} />
        </Field>
        <Field id="community-first-surname" label="Primer apellido" error={errors.firstSurname}>
          <Input id="community-first-surname" className={inputClass} autoComplete="family-name" maxLength={150} value={form.firstSurname} aria-describedby={errors.firstSurname ? 'community-first-surname-error' : undefined} onChange={event => setForm(current => ({ ...current, firstSurname: event.target.value }))} />
        </Field>
        <Field id="community-second-surname" label="Segundo apellido" error={errors.secondSurname} required={false}>
          <Input id="community-second-surname" className={inputClass} maxLength={150} value={form.secondSurname} aria-describedby={errors.secondSurname ? 'community-second-surname-error' : undefined} onChange={event => setForm(current => ({ ...current, secondSurname: event.target.value }))} />
        </Field>
        <Field id="community-email" label="Correo electrónico" error={errors.email}>
          <Input id="community-email" className={inputClass} type="email" inputMode="email" autoComplete="email" maxLength={254} value={form.email} aria-describedby={errors.email ? 'community-email-error' : undefined} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        </Field>
        <PhoneField id="community-phone" label="Teléfono" value={{ countryCode: form.phoneCountryCode, nationalNumber: form.phoneNationalNumber }} error={errors.phoneNationalNumber} onChange={value => setForm(current => ({ ...current, phoneCountryCode: value.countryCode ?? '+506', phoneNationalNumber: value.nationalNumber ?? '' }))} />
        <label className="flex items-start gap-3 rounded-control border border-border p-3 text-body-small text-foreground">
          <input type="checkbox" className="mt-1 size-4 accent-brand-primary" checked={form.privacyAcknowledgement} onChange={(event) => setForm((current) => ({ ...current, privacyAcknowledgement: event.target.checked }))} aria-describedby={errors.privacyAcknowledgement ? 'community-privacy-error' : undefined} />
          <span>Autorizo el uso de mis datos para crear esta cuenta comunitaria.</span>
        </label>
        {errors.privacyAcknowledgement ? <p id="community-privacy-error" className="text-body-small text-destructive" role="alert">{errors.privacyAcknowledgement}</p> : null}
        <Button className="min-h-12" type="submit" loading={loading}>Crear cuenta</Button>
        {deliveryFailed ? <Link className="font-bold text-brand-primary underline" to="/verify-community-email">Solicitar un nuevo enlace para el correo registrado</Link> : null}
      </form>
    </main>
  )
}

function Field({ id, label, error, children, required = true }: { id: string; label: string; error?: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-label font-semibold text-foreground">{label}{required ? <><span className="text-destructive" aria-hidden="true"> *</span><span className="sr-only"> (requerido)</span></> : <span> (opcional)</span>}</label>
      <div>{children}</div>
      {error ? <p id={`${id}-error`} className="text-body-small text-destructive" role="alert">{error}</p> : null}
    </div>
  )
}
