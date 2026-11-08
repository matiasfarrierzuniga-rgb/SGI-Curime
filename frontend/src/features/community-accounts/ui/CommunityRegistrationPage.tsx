import { MailCheck } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { emailError, normalizeEmail } from '@/shared/lib/formValidation'
import { useToast } from '@/shared/ui/Toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { showResultDialog } from '@/shared/ui/resultDialog'
import { communityAccountsService } from '../api/communityAccounts.api'
import {
  communityAccountFeedback,
} from '../model/communityAccountFeedback'

type FormState = {
  email: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initial: FormState = {
  email: '',
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
      email: emailError(form.email),
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
        email: normalizeEmail(form.email),
      })
      await showResultDialog({
        icon: 'info',
        title: 'Revisá tu correo',
        text: 'Si el correo puede continuar el proceso, recibirás instrucciones para verificar tu cuenta. Este registro no crea afiliación ni acceso administrativo.',
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
          <p className="public-eyebrow text-brand-primary">Verificación pendiente</p>
          <h1 id="community-registration-confirmation" className="mt-3 font-heading text-heading-1 font-bold text-brand-deep">Revisá tu correo electrónico</h1>
          <p className="mx-auto mt-4 max-w-md text-body leading-relaxed text-text-secondary">Si tu correo puede continuar el proceso, recibirás un enlace para verificar tu cuenta. Revisá también la carpeta de spam. La verificación no crea afiliación ni acceso administrativo.</p>
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
      <form className="mt-6 max-w-xl rounded-surface border border-border bg-surface p-5 shadow-sm sm:p-6" noValidate onSubmit={submit} aria-busy={loading}>
        <Field id="community-email" label="Correo electrónico" error={errors.email}>
          <Input id="community-email" className={inputClass} required type="email" inputMode="email" autoComplete="email" maxLength={254} value={form.email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'community-email-error' : undefined} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        </Field>
        <p className="mt-3 text-body-small leading-relaxed text-text-secondary">Le enviaremos un enlace de verificación si este correo puede continuar el proceso. Revisá también la carpeta de spam.</p>
        <Button className="mt-5 min-h-12 w-full sm:w-auto" type="submit" loading={loading}>Crear cuenta</Button>
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
