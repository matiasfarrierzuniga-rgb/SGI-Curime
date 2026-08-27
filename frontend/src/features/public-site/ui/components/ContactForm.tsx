import { useState, type ChangeEvent, type FormEvent } from 'react'
import { emailError, fullNameError, normalizeEmail, normalizeText } from '@/shared/lib/formValidation'

type ContactField = 'firstName' | 'lastNames' | 'email' | 'subject' | 'message'
type ContactValues = Record<ContactField, string>
type ContactErrors = Partial<Record<ContactField, string>>

const initialValues: ContactValues = {
  firstName: '',
  lastNames: '',
  email: '',
  subject: '',
  message: '',
}

const fieldClass = 'min-h-12 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/15'

function validateField(name: ContactField, rawValue: string) {
  const value = normalizeText(rawValue)
  if (name === 'firstName') return fullNameError(value)
  if (name === 'lastNames') {
    const error = fullNameError(value)
    return error ? 'Ingrese apellidos válidos usando letras, espacios, apóstrofes o guiones.' : ''
  }
  if (name === 'email') return emailError(value)
  if (name === 'subject') return value.length >= 3 ? '' : 'El asunto debe tener al menos 3 caracteres.'
  return value.length >= 10 ? '' : 'El mensaje debe tener al menos 10 caracteres.'
}

export function ContactForm() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [notice, setNotice] = useState('')

  const update = (name: ContactField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [name]: event.target.value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setNotice('')
  }

  const validateOne = (name: ContactField) => {
    const error = validateField(name, values[name])
    setErrors((current) => ({ ...current, [name]: error || undefined }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = Object.fromEntries(
      (Object.keys(values) as ContactField[])
        .map((name) => [name, validateField(name, values[name])])
        .filter(([, error]) => Boolean(error)),
    ) as ContactErrors
    setErrors(nextErrors)
    setNotice('')
    if (Object.keys(nextErrors).length > 0) return

    setValues((current) => ({
      ...current,
      firstName: normalizeText(current.firstName),
      lastNames: normalizeText(current.lastNames),
      email: normalizeEmail(current.email),
      subject: normalizeText(current.subject),
      message: normalizeText(current.message),
    }))
    setNotice('El envío en línea aún no está disponible. Puede enviar su consulta mediante el correo oficial de la Asociación.')
  }

  const fieldProps = (name: ContactField) => ({
    value: values[name],
    onChange: update(name),
    onBlur: () => validateOne(name),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-7 lg:p-8">
      <h2 className="text-heading-2 text-brand-deep">Envíe su consulta</h2>
      <p className="mt-2 text-body-small text-foreground-muted">Complete los campos requeridos. La integración de envío en línea se habilitará posteriormente.</p>
      <form className="mt-6 grid gap-5" onSubmit={submit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-label font-semibold" htmlFor="firstName">Nombre <span aria-hidden="true">*</span>
            <input id="firstName" className={fieldClass} required minLength={2} maxLength={80} autoComplete="given-name" {...fieldProps('firstName')} />
            {errors.firstName && <span id="firstName-error" className="field-error" role="alert">{errors.firstName}</span>}
          </label>
          <label className="grid gap-2 text-label font-semibold" htmlFor="lastNames">Apellidos <span aria-hidden="true">*</span>
            <input id="lastNames" className={fieldClass} required minLength={2} maxLength={120} autoComplete="family-name" {...fieldProps('lastNames')} />
            {errors.lastNames && <span id="lastNames-error" className="field-error" role="alert">{errors.lastNames}</span>}
          </label>
        </div>
        <label className="grid gap-2 text-label font-semibold" htmlFor="contactEmail">Correo electrónico <span aria-hidden="true">*</span>
          <input id="contactEmail" className={fieldClass} type="email" inputMode="email" required maxLength={254} autoComplete="email" {...fieldProps('email')} />
          {errors.email && <span id="email-error" className="field-error" role="alert">{errors.email}</span>}
        </label>
        <label className="grid gap-2 text-label font-semibold" htmlFor="subject">Asunto <span aria-hidden="true">*</span>
          <input id="subject" className={fieldClass} required minLength={3} maxLength={150} {...fieldProps('subject')} />
          {errors.subject && <span id="subject-error" className="field-error" role="alert">{errors.subject}</span>}
        </label>
        <label className="grid gap-2 text-label font-semibold" htmlFor="message">Mensaje <span aria-hidden="true">*</span>
          <textarea id="message" className={`${fieldClass} min-h-36 resize-y`} required minLength={10} maxLength={2000} {...fieldProps('message')} />
          {errors.message && <span id="message-error" className="field-error" role="alert">{errors.message}</span>}
        </label>
        {notice && <p className="rounded-lg border border-brand-accent bg-brand-ivory p-3 text-sm leading-relaxed text-brand-deep" role="status">{notice}</p>}
        <button className="primary min-h-12 w-full rounded-lg px-5 py-3 font-bold sm:w-auto sm:justify-self-start" type="submit">Enviar consulta</button>
      </form>
    </div>
  )
}
