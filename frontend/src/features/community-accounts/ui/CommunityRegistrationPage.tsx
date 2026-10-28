import { MailCheck } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { emailError, normalizeEmail, normalizeText, structuredNameError } from '@/shared/lib/formValidation'
import { useToast } from '@/shared/ui/Toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { showResultDialog } from '@/shared/ui/resultDialog'
import { communityAccountsService } from '../api/communityAccounts.api'
import {
  communityAccountFeedback,
  communityFeedbackMessages,
  communityPasswordError,
} from '../model/communityAccountFeedback'

type FormState = {
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
  privacyAcknowledgement: boolean
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initial: FormState = {
  fullName: '', email: '', password: '', passwordConfirmation: '', privacyAcknowledgement: false,
}
const inputClass = 'min-h-12 rounded-control border-border bg-control px-3.5 py-2.5 text-base'

export function CommunityRegistrationPage() {
  const { notify } = useToast()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)

  function validate() {
    const next: FormErrors = {
      fullName: structuredNameError(form.fullName),
      email: emailError(form.email),
      password: communityPasswordError(form.password),
      passwordConfirmation: form.password !== form.passwordConfirmation ? communityFeedbackMessages.passwordConfirmation : '',
      privacyAcknowledgement: form.privacyAcknowledgement ? '' : 'Debe aceptar el uso de sus datos para crear la cuenta.',
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current || !validate()) return

    submitting.current = true
    setLoading(true)
    try {
      await communityAccountsService.register({
        ...form,
        fullName: normalizeText(form.fullName),
        email: normalizeEmail(form.email),
      })
      await showResultDialog({
        icon: 'info',
        title: 'Solicitud recibida',
        text: 'Si el correo puede utilizarse, recibirás un enlace para verificar tu cuenta',
        confirmButtonText: 'Entendido',
      })
      setSubmitted(true)
    } catch (error) {
      const feedback = communityAccountFeedback(error, 'register')
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
          <p className="mx-auto mt-4 max-w-md text-body leading-relaxed text-text-secondary">Si el correo puede continuar el proceso, recibirá instrucciones de verificación. Revise también correo no deseado.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center rounded-control bg-brand-primary px-5 font-bold text-white" to="/login">Ir a iniciar sesión</Link>
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
        <Field id="community-full-name" label="Nombre completo" error={errors.fullName}>
          <Input id="community-full-name" className={inputClass} autoComplete="name" maxLength={150} value={form.fullName} aria-describedby={errors.fullName ? 'community-full-name-error' : undefined} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
        </Field>
        <Field id="community-email" label="Correo electrónico" error={errors.email}>
          <Input id="community-email" className={inputClass} type="email" inputMode="email" autoComplete="email" maxLength={254} value={form.email} aria-describedby={errors.email ? 'community-email-error' : undefined} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        </Field>
        <Field id="community-password" label="Contraseña" error={errors.password}>
          <Input id="community-password" className={inputClass} type="password" autoComplete="new-password" maxLength={128} value={form.password} aria-describedby={errors.password ? 'community-password-error' : undefined} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
        </Field>
        <Field id="community-password-confirmation" label="Confirmar contraseña" error={errors.passwordConfirmation}>
          <Input id="community-password-confirmation" className={inputClass} type="password" autoComplete="new-password" maxLength={128} value={form.passwordConfirmation} aria-describedby={errors.passwordConfirmation ? 'community-password-confirmation-error' : undefined} onChange={(event) => setForm((current) => ({ ...current, passwordConfirmation: event.target.value }))} />
        </Field>
        <label className="flex items-start gap-3 rounded-control border border-border p-3 text-body-small text-foreground">
          <input type="checkbox" className="mt-1 size-4 accent-brand-primary" checked={form.privacyAcknowledgement} onChange={(event) => setForm((current) => ({ ...current, privacyAcknowledgement: event.target.checked }))} aria-describedby={errors.privacyAcknowledgement ? 'community-privacy-error' : undefined} />
          <span>Autorizo el uso de mis datos para crear esta cuenta comunitaria.</span>
        </label>
        {errors.privacyAcknowledgement ? <p id="community-privacy-error" className="text-body-small text-destructive" role="alert">{errors.privacyAcknowledgement}</p> : null}
        <Button className="min-h-12" type="submit" loading={loading}>Crear cuenta</Button>
      </form>
    </main>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-label font-semibold text-foreground">{label}<span className="text-destructive" aria-hidden="true"> *</span><span className="sr-only"> (requerido)</span></label>
      <div>{children}</div>
      {error ? <p id={`${id}-error`} className="text-body-small text-destructive" role="alert">{error}</p> : null}
    </div>
  )
}
