import { cloneElement, isValidElement, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import axios from 'axios'
import { Check, ChevronLeft, ChevronRight, FileCheck2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, emailError, identificationError, identificationMaxLength, normalizeEmail, normalizeText, phoneError, structuredNameError, type IdentificationType } from '@/shared/lib/formValidation'
import { Button } from '@/shared/ui/button'
import { PhoneField } from '@/shared/ui/forms/PhoneField'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { userRequestsService } from '../api/userRequests.api'
import type { CreateUserRequest } from '../model/userRequests.types'

type RegisterForm = Omit<CreateUserRequest, 'fullName'> & {
  firstName: string
  firstSurname: string
  secondSurname: string
}
type Step = 1 | 2 | 3

const initial: RegisterForm = { firstName: '', firstSurname: '', secondSurname: '', identificationType: 'NATIONAL', identification: '', email: '', phoneCountryCode: '+506', phoneNationalNumber: '', address: '', reason: '' }
const steps = [
  { number: 1 as Step, title: 'Información personal', description: 'Identidad' },
  { number: 2 as Step, title: 'Información de contacto', description: 'Contacto' },
  { number: 3 as Step, title: 'Revisión y envío', description: 'Confirmación' },
]
const inputClass = 'min-h-12 rounded-control border-border bg-control px-3.5 py-2.5 text-base'

function requestErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    const message = (error.response.data as { message?: string | string[] } | undefined)?.message
    if (Array.isArray(message)) return message.join('. ')
    if (typeof message === 'string') return message
  }
  return getErrorMessage(error)
}

function validateForm(form: RegisterForm) {
  return {
    firstName: structuredNameError(form.firstName),
    firstSurname: structuredNameError(form.firstSurname),
    secondSurname: structuredNameError(form.secondSurname, false),
    identification: identificationError(form.identificationType, form.identification),
    email: emailError(form.email),
    phoneNationalNumber: phoneError(form.phoneCountryCode ?? '', form.phoneNationalNumber ?? ''),
    reason: form.reason.trim().length >= 3 ? '' : 'Indique el motivo de su solicitud.',
  } satisfies Record<string, string>
}

export function RegisterPage() {
  const [form, setForm] = useState(initial)
  const [step, setStep] = useState<Step>(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const submitting = useRef(false)
  const idType = form.identificationType as IdentificationType

  const change = (name: keyof RegisterForm, value: string) => {
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => current[name] ? { ...current, [name]: '' } : current)
    setServerError('')
  }

  const field = (name: keyof RegisterForm) => ({
    value: form[name] ?? '',
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change(name, event.target.value),
  })

  const validateStep = (target: Step) => {
    const allErrors = validateForm(form)
    const keys: (keyof ReturnType<typeof validateForm>)[] = target === 1
      ? ['firstName', 'firstSurname', 'secondSurname', 'identification']
      : target === 2
        ? ['email', 'phoneNationalNumber', 'reason']
        : []
    const next = Object.fromEntries(keys.map(key => [key, allErrors[key] ?? '']).filter(([, value]) => value))
    if (target === 3 && !consent) next.consent = 'Debe aceptar el uso de sus datos para tramitar la solicitud.'
    setErrors(current => ({ ...current, ...next }))
    return Object.keys(next).length === 0
  }

  const goNext = () => {
    if (validateStep(step) && step < 3) setStep((step + 1) as Step)
  }

  const goBack = () => setStep(current => (current > 1 ? current - 1 : current) as Step)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current || !validateStep(3)) return
    submitting.current = true
    setLoading(true)
    setServerError('')
    try {
      const firstName = normalizeText(form.firstName)
      const firstSurname = normalizeText(form.firstSurname)
      const secondSurname = normalizeText(form.secondSurname)
      const payload: CreateUserRequest = {
        firstName,
        firstSurname,
        secondSurname: secondSurname || undefined,
        fullName: [firstName, firstSurname, secondSurname].filter(Boolean).join(' '),
        identificationType: form.identificationType,
        identification: form.identification,
        email: normalizeEmail(form.email),
        phoneCountryCode: form.phoneNationalNumber ? form.phoneCountryCode : undefined,
        phoneNationalNumber: form.phoneNationalNumber || undefined,
        address: form.address ? normalizeText(form.address) || undefined : undefined,
        reason: normalizeText(form.reason),
      }
      await userRequestsService.create(payload)
      setSubmitted(true)
    } catch (error) {
      setServerError(requestErrorMessage(error))
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  if (submitted) return <Confirmation />

  return (
    <main className="w-full py-0">
      <header>
        <p className="public-eyebrow text-brand-primary">Solicitud de cuenta</p>
        <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">{steps[step - 1].title}</h1>
        <p className="mt-2 max-w-xl text-body leading-relaxed text-text-secondary">{step === 1 ? 'Complete sus datos personales para iniciar la solicitud.' : step === 2 ? 'Indique cómo podemos comunicarnos con usted.' : 'Revise la información antes de enviar su solicitud.'}</p>
      </header>

      <nav aria-label="Progreso de la solicitud" className="mt-5 border-y border-border-subtle py-3">
        <ol className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {steps.map(item => {
            const complete = item.number < step
            const current = item.number === step
            return <li key={item.number} className="min-w-0">
              <button type="button" onClick={() => item.number <= step && setStep(item.number)} disabled={item.number > step} aria-current={current ? 'step' : undefined} className="group flex w-full min-w-0 items-center justify-center gap-2 text-left sm:justify-start disabled:cursor-default disabled:opacity-55">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors ${complete ? 'border-brand-primary bg-brand-primary text-white' : current ? 'border-brand-primary bg-brand-primary text-white' : 'border-border-strong bg-surface-muted text-text-secondary'}`}>
                  {complete ? <Check className="size-4" aria-hidden="true" /> : item.number}
                </span>
                <span className="hidden min-w-0 sm:block"><span className={`block text-xs leading-tight font-bold ${current ? 'text-brand-deep' : 'text-text-secondary'}`}>{item.title}</span><span className="mt-0.5 block text-caption leading-tight text-text-secondary">{item.description}</span></span>
                <span className="sr-only">{item.title}{current ? ', paso actual' : complete ? ', completado' : ''}</span>
              </button>
            </li>
          })}
        </ol>
      </nav>

      {serverError ? <div className="mt-6 rounded-control border border-destructive/40 bg-destructive/10 p-4 text-body-small text-destructive" role="alert"><strong>No fue posible enviar la solicitud.</strong><p className="mt-1">{serverError}</p></div> : null}

      <form className="mt-5 grid gap-5" onSubmit={submit} noValidate>
        {step === 1 ? <PersonalStep errors={errors} idType={idType} field={field} change={change} /> : null}
        {step === 2 ? <ContactStep form={form} errors={errors} field={field} change={change} /> : null}
        {step === 3 ? <ReviewStep form={form} errors={errors} consent={consent} onConsentChange={(value) => { setConsent(value); if (value) setErrors(current => ({ ...current, consent: '' })) }} onEdit={setStep} /> : null}

        <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={step === 1 ? undefined : goBack} disabled={loading} className={step === 1 ? 'invisible' : ''}><ChevronLeft className="size-4" aria-hidden="true" />Anterior</Button>
          {step < 3 ? <Button type="button" onClick={goNext} disabled={loading}>Continuar<ChevronRight className="size-4" aria-hidden="true" /></Button> : <Button type="submit" loading={loading}>Enviar solicitud<FileCheck2 className="size-4" aria-hidden="true" /></Button>}
        </div>
      </form>

      <p className="mt-5 border-t border-border-subtle pt-4 text-center text-body-small text-text-secondary">¿Ya tiene una cuenta? <Link className="font-bold text-brand-primary underline-offset-4 hover:underline" to="/login">Iniciar sesión</Link></p>
    </main>
  )
}

function PersonalStep({ errors, idType, field, change }: { errors: Record<string, string>; idType: IdentificationType; field: (name: keyof RegisterForm) => { value: string; onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void }; change: (name: keyof RegisterForm, value: string) => void }) {
  return <section aria-labelledby="personal-step-title" className="grid gap-4"><p id="personal-step-title" className="sr-only">Información personal</p><fieldset className="grid gap-4 sm:grid-cols-2" data-identity-fields><legend className="sr-only">Datos de identificación</legend><Field id="identification-type" label="Tipo de identificación" required className="sm:col-span-2"><Select id="identification-type" className={inputClass} value={idType} onChange={event => { change('identificationType', event.target.value); change('identification', '') }}><option value="NATIONAL">Cédula nacional</option><option value="DIMEX">DIMEX</option></Select></Field><Field id="identification" label="Número de identificación" error={errors.identification} required className="sm:col-span-2"><Input {...field('identification')} id="identification" className={inputClass} type="text" inputMode="numeric" maxLength={identificationMaxLength(idType)} onChange={event => change('identification', digitsOnly(event.target.value, identificationMaxLength(idType)))} /></Field><aside className="sm:col-span-2 flex items-start gap-2 rounded-control border border-brand-accent/40 bg-brand-accent/10 px-3 py-2.5 text-body-small leading-snug text-brand-deep"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" /><p>La consulta de identidad estará disponible próximamente. Por ahora, ingrese sus datos tal como aparecen en su identificación.</p></aside><Field id="first-name" label="Nombre" error={errors.firstName} required><Input {...field('firstName')} id="first-name" className={inputClass} autoComplete="given-name" maxLength={150} /></Field><Field id="first-surname" label="Primer apellido" error={errors.firstSurname} required><Input {...field('firstSurname')} id="first-surname" className={inputClass} autoComplete="family-name" maxLength={150} /></Field><Field id="second-surname" label="Segundo apellido" hint="Opcional" className="sm:col-span-2"><Input {...field('secondSurname')} id="second-surname" className={inputClass} autoComplete="family-name" maxLength={150} /></Field></fieldset></section>
}

function ContactStep({ form, errors, field, change }: { form: RegisterForm; errors: Record<string, string>; field: (name: keyof RegisterForm) => { value: string; onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void }; change: (name: keyof RegisterForm, value: string) => void }) {
  return <section aria-labelledby="contact-step-title" className="grid gap-5"><div><p className="text-label font-bold text-brand-primary">Paso 2 de 3</p><h2 id="contact-step-title" className="mt-1 font-heading text-heading-2 font-bold text-brand-deep">Información de contacto</h2><p className="mt-2 text-body-small text-text-secondary">Usaremos estos datos para comunicarnos sobre su solicitud.</p></div><div className="grid gap-5"><Field id="register-email" label="Correo electrónico" error={errors.email} required><Input {...field('email')} id="register-email" className={inputClass} type="email" inputMode="email" autoComplete="email" maxLength={254} /></Field><PhoneField id="phone-number" label="Teléfono" value={{ countryCode: form.phoneCountryCode, nationalNumber: form.phoneNationalNumber }} error={errors.phoneNationalNumber} onChange={({ countryCode, nationalNumber }) => { change('phoneCountryCode', countryCode ?? ''); change('phoneNationalNumber', nationalNumber ?? '') }} description="Opcional. Incluya un número que podamos utilizar para contactarle." /><Field id="address" label="Dirección" hint="Opcional"><Textarea {...field('address')} id="address" className="min-h-24 rounded-control border-border bg-control px-3.5 py-2.5 text-base" autoComplete="street-address" maxLength={300} /></Field><Field id="reason" label="Motivo de la solicitud" error={errors.reason} required><Textarea {...field('reason')} id="reason" className="min-h-28 rounded-control border-border bg-control px-3.5 py-2.5 text-base" maxLength={1000} /></Field></div></section>
}

function ReviewStep({ form, errors, consent, onConsentChange, onEdit }: { form: RegisterForm; errors: Record<string, string>; consent: boolean; onConsentChange: (value: boolean) => void; onEdit: (step: Step) => void }) {
  const fullName = [form.firstName, form.firstSurname, form.secondSurname].filter(Boolean).join(' ')
  return <section aria-labelledby="review-step-title" className="grid gap-5"><div><p className="text-label font-bold text-brand-primary">Paso 3 de 3</p><h2 id="review-step-title" className="mt-1 font-heading text-heading-2 font-bold text-brand-deep">Revise su solicitud</h2><p className="mt-2 text-body-small text-text-secondary">Confirme que la información sea correcta antes de enviarla.</p></div><div className="grid gap-4"><ReviewGroup title="Información personal" onEdit={() => onEdit(1)}><ReviewItem label="Nombre completo" value={fullName} /><ReviewItem label="Identificación" value={`${form.identificationType === 'NATIONAL' ? 'Cédula nacional' : 'DIMEX'} · ${form.identification}`} /></ReviewGroup><ReviewGroup title="Información de contacto" onEdit={() => onEdit(2)}><ReviewItem label="Correo electrónico" value={form.email} /><ReviewItem label="Teléfono" value={form.phoneNationalNumber ? `${form.phoneCountryCode ?? ''} ${form.phoneNationalNumber}` : 'No registrado'} /><ReviewItem label="Dirección" value={form.address || 'No registrada'} /><ReviewItem label="Motivo" value={form.reason} /></ReviewGroup></div><label className={`flex items-start gap-3 rounded-control border p-4 text-body-small ${errors.consent ? 'border-destructive bg-destructive/5' : 'border-border bg-surface-muted'}`}><input type="checkbox" checked={consent} onChange={event => onConsentChange(event.target.checked)} className="mt-1 size-4 accent-brand-primary" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'consent-error' : undefined} /><span>Acepto que la Asociación utilice estos datos para revisar y tramitar mi solicitud de cuenta.</span></label>{errors.consent ? <p id="consent-error" className="-mt-3 text-body-small font-medium text-destructive" role="alert">{errors.consent}</p> : null}</section>
}

function ReviewGroup({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return <section className="rounded-control border border-border bg-surface-muted p-4"><div className="flex items-center justify-between gap-4"><h3 className="font-heading text-heading-3 font-bold text-brand-deep">{title}</h3><Button type="button" variant="link" size="sm" onClick={onEdit}>Editar</Button></div><dl className="mt-4 grid gap-3 sm:grid-cols-2">{children}</dl></section>
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-caption font-bold uppercase tracking-[0.08em] text-text-secondary">{label}</dt><dd className="mt-1 break-words text-body-small text-brand-deep">{value}</dd></div>
}

function Field({ id, label, hint, error, required, className, children }: { id: string; label: string; hint?: string; error?: string; required?: boolean; className?: string; children: ReactNode }) {
  const control = isValidElement(children) ? cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>, { 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined }) : children
  return <div className={`grid gap-1.5 ${className ?? ''}`}><label className="inline-flex w-fit items-baseline gap-1 text-label font-semibold text-foreground" htmlFor={id}><span>{label}</span>{required ? <span className="shrink-0 text-destructive" aria-hidden="true">*</span> : <span className="font-normal text-text-secondary">(opcional)</span>}{required ? <span className="sr-only"> (requerido)</span> : null}</label>{control}{hint ? <p className="text-body-small text-text-secondary">{hint}</p> : null}{error ? <p id={`${id}-error`} className="text-body-small font-medium text-destructive" role="alert">{error}</p> : null}</div>
}

function Confirmation() {
  return <section className="grid justify-items-center gap-5 py-8 text-center" aria-labelledby="registration-confirmation-title"><span className="grid size-16 place-items-center rounded-full bg-brand-primary text-white shadow-sm"><Check className="size-8" aria-hidden="true" /></span><div><p className="public-eyebrow text-brand-primary">Solicitud recibida</p><h1 id="registration-confirmation-title" className="mt-3 font-heading text-heading-1 font-bold text-brand-deep">Solicitud enviada correctamente</h1><p className="mx-auto mt-4 max-w-md text-body leading-relaxed text-text-secondary">Su solicitud queda pendiente de revisión administrativa. Le avisaremos si se aprueba para continuar con la activación.</p></div><div className="flex items-start gap-3 rounded-control border border-brand-accent/50 bg-brand-accent/10 p-4 text-left text-body-small text-brand-deep"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" /><p>Por seguridad, no mostramos ni generamos números de solicitud en esta pantalla.</p></div><div className="flex flex-col items-center gap-2 sm:flex-row"><Link className="inline-flex min-h-11 items-center rounded-control bg-brand-primary px-5 font-bold text-white hover:bg-brand-soft focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/">Volver al sitio</Link><Link className="inline-flex min-h-11 items-center px-4 font-bold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/login">Iniciar sesión</Link></div></section>
}
