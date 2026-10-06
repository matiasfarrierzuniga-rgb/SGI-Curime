import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, emailError, identificationError, identificationMaxLength, normalizeEmail, normalizeText, phoneError, structuredNameError, type IdentificationType } from '@/shared/lib/formValidation'
import { StatusMessage } from '@/shared/ui/StatusMessage'
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

const initial: RegisterForm = { firstName: '', firstSurname: '', secondSurname: '', identificationType: 'NATIONAL', identification: '', email: '', phoneCountryCode: '+506', phoneNationalNumber: '', address: '', reason: '' }
const inputClass = 'min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal'

function requestErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    const message = (error.response.data as { message?: string | string[] } | undefined)?.message
    if (Array.isArray(message)) return message.join('. ')
    if (typeof message === 'string') return message
  }
  return getErrorMessage(error)
}

export function RegisterPage() {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const submitting = useRef(false)
  const field = (name: keyof RegisterForm) => ({ value: form[name] ?? '', onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: event.target.value }) })

  function validate() {
    const next = {
      firstName: structuredNameError(form.firstName),
      firstSurname: structuredNameError(form.firstSurname),
      secondSurname: structuredNameError(form.secondSurname, false),
      identification: identificationError(form.identificationType, form.identification),
      email: emailError(form.email),
      phoneNationalNumber: phoneError(form.phoneCountryCode ?? '', form.phoneNationalNumber ?? ''),
      reason: form.reason.trim().length >= 3 ? '' : 'Indique el motivo de su solicitud.',
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current || !validate()) return
    submitting.current = true
    setLoading(true)
    setError('')
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
        address: form.address ? normalizeText(form.address) || undefined : undefined,
        phoneCountryCode: form.phoneNationalNumber ? form.phoneCountryCode : undefined,
        phoneNationalNumber: form.phoneNationalNumber || undefined,
        reason: normalizeText(form.reason),
      }
      await userRequestsService.create(payload)
      setSuccess('Solicitud enviada correctamente. Queda pendiente de revisión administrativa. Le avisaremos si se aprueba para continuar con la activación.')
      setForm(initial)
    } catch (requestError) {
      setError(requestErrorMessage(requestError))
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  const idType = form.identificationType as IdentificationType
  return (
    <main>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Acceso comunitario</p>
      <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">Solicitar una cuenta</h1>
      <ol className="mt-4 grid gap-2 rounded-lg bg-brand-ivory p-4 text-sm leading-relaxed text-foreground-muted">
        <li><strong className="text-brand-deep">1.</strong> Complete la solicitud.</li>
        <li><strong className="text-brand-deep">2.</strong> Una persona administradora la revisará.</li>
        <li><strong className="text-brand-deep">3.</strong> Si se aprueba, recibirá el proceso de activación.</li>
      </ol>
      <StatusMessage error={error} success={success} />
      <form className="mt-7 grid gap-5" onSubmit={submit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold" htmlFor="first-name">Nombre
            <Input id="first-name" className={inputClass} required minLength={2} maxLength={150} autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? 'first-name-error' : undefined} {...field('firstName')} onBlur={validate} />
            {errors.firstName && <span id="first-name-error" className="field-error" role="alert">{errors.firstName}</span>}
          </label>
          <label className="grid gap-2 text-sm font-bold" htmlFor="first-surname">Primer apellido
            <Input id="first-surname" className={inputClass} required minLength={2} maxLength={150} autoComplete="family-name" aria-invalid={Boolean(errors.firstSurname)} aria-describedby={errors.firstSurname ? 'first-surname-error' : undefined} {...field('firstSurname')} onBlur={validate} />
            {errors.firstSurname && <span id="first-surname-error" className="field-error" role="alert">{errors.firstSurname}</span>}
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold" htmlFor="second-surname">Segundo apellido <span className="font-normal text-foreground-muted">(opcional)</span>
          <Input id="second-surname" className={inputClass} minLength={2} maxLength={150} autoComplete="family-name" aria-invalid={Boolean(errors.secondSurname)} aria-describedby={errors.secondSurname ? 'second-surname-error' : undefined} {...field('secondSurname')} onBlur={validate} />
          {errors.secondSurname && <span id="second-surname-error" className="field-error" role="alert">{errors.secondSurname}</span>}
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="identification-type">Tipo de identificación
          <Select id="identification-type" className={inputClass} value={idType} onChange={(event) => setForm({ ...form, identificationType: event.target.value as IdentificationType, identification: '' })}><option value="NATIONAL">Nacional</option><option value="DIMEX">DIMEX</option></Select>
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="identification">Número de identificación
          <Input id="identification" className={inputClass} type="text" inputMode="numeric" required maxLength={identificationMaxLength(idType)} aria-invalid={Boolean(errors.identification)} aria-describedby={errors.identification ? 'identification-error' : undefined} value={form.identification} onChange={(event) => setForm({ ...form, identification: digitsOnly(event.target.value, identificationMaxLength(idType)) })} onBlur={validate} />
          {errors.identification && <span id="identification-error" className="field-error" role="alert">{errors.identification}</span>}
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="register-email">Correo electrónico
          <Input id="register-email" className={inputClass} type="email" inputMode="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} {...field('email')} onBlur={validate} />
          {errors.email && <span id="register-email-error" className="field-error" role="alert">{errors.email}</span>}
        </label>
        <div onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) validate() }}>
          <PhoneField id="phone-number" label="Número" value={{ countryCode: form.phoneCountryCode, nationalNumber: form.phoneNationalNumber }} error={errors.phoneNationalNumber} onChange={({ countryCode, nationalNumber }) => setForm({ ...form, phoneCountryCode: countryCode, phoneNationalNumber: nationalNumber })} />
        </div>
        <label className="grid gap-2 text-sm font-bold" htmlFor="address">Dirección (opcional)
          <Textarea id="address" className="min-h-24 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" maxLength={300} autoComplete="street-address" {...field('address')} />
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="reason">Motivo de la solicitud
          <Textarea id="reason" className="min-h-28 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" required minLength={3} maxLength={1000} {...field('reason')} />
        </label>
        <Button className="primary min-h-12 w-full rounded-lg px-5 py-3 font-bold" disabled={loading}>{loading ? 'Enviando…' : 'Enviar solicitud'}</Button>
      </form>
      <div className="mt-7 border-t border-border pt-5 text-center text-sm text-foreground-muted">
        ¿Ya tiene una cuenta? <Link className="inline-flex min-h-11 items-center font-bold text-brand-primary underline-offset-4 hover:underline" to="/login">Iniciar sesión</Link>
      </div>
    </main>
  )
}
