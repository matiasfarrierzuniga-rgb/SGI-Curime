import { useState, type ChangeEvent, type FormEvent } from 'react'
import { emailError, fullNameError, normalizeEmail, normalizeText } from '@/shared/lib/formValidation'
import { Button } from '@/shared/ui/button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'

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
    setNotice('Su consulta no se ha enviado porque el formulario en línea aún no está habilitado. Puede copiar estos datos y escribir al correo oficial de la Asociación.')
  }

  const fieldProps = (name: ContactField) => ({
    value: values[name],
    onChange: update(name),
    onBlur: () => validateOne(name),
    'aria-invalid': Boolean(errors[name]),
  })

  return (
    <section aria-labelledby="contact-form-title" className="rounded-surface border border-brand-sage/70 bg-card-white p-5 shadow-surface sm:p-7 lg:p-8">
      <p className="public-eyebrow text-brand-primary">Prepare su consulta</p>
      <h2 id="contact-form-title" className="mt-3 font-heading text-heading-2 text-brand-ink">Organice su mensaje antes de enviarlo por correo</h2>
      <p className="mt-3 text-pretty text-body-small leading-relaxed text-foreground-muted">Este formulario no envía mensajes automáticamente. Le ayuda a revisar los datos antes de contactar a la Asociación mediante el correo oficial.</p>
      <form className="mt-6 grid gap-5" onSubmit={submit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="firstName" label="Nombre" required error={errors.firstName}><Input minLength={2} maxLength={80} autoComplete="given-name" {...fieldProps('firstName')} /></FormField>
          <FormField id="lastNames" label="Apellidos" required error={errors.lastNames}><Input minLength={2} maxLength={120} autoComplete="family-name" {...fieldProps('lastNames')} /></FormField>
        </div>
        <FormField id="email" label="Correo electrónico" required error={errors.email}><Input type="email" inputMode="email" maxLength={254} autoComplete="email" {...fieldProps('email')} /></FormField>
        <FormField id="subject" label="Asunto" required error={errors.subject}><Input minLength={3} maxLength={150} {...fieldProps('subject')} /></FormField>
        <FormField id="message" label="Mensaje" required error={errors.message}><Textarea className="min-h-36 resize-y" minLength={10} maxLength={2000} {...fieldProps('message')} /></FormField>
        {notice && <p className="rounded-control border border-brand-accent/60 bg-brand-ivory p-3 text-body-small leading-relaxed text-brand-deep" role="status">{notice}</p>}
        <Button className="w-full sm:w-auto sm:justify-self-start" size="lg" type="submit">Revisar consulta</Button>
      </form>
    </section>
  )
}
