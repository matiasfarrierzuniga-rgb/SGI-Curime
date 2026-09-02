import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, emailError, identificationError, identificationMaxLength, normalizeEmail, normalizeText, phoneError, phoneNationalMaxLength, structuredNameError, type IdentificationType } from '@/shared/lib/formValidation'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { authService } from '../api/auth.api'
import type { RegisterUser } from '../model/auth.types'

type RegisterForm = RegisterUser & { passwordConfirmation: string }

const initial: RegisterForm = { firstName: '', firstSurname: '', secondSurname: '', identificationType: 'NATIONAL', identification: '', email: '', phoneCountryCode: '+506', phoneNationalNumber: '', address: '', password: '', passwordConfirmation: '' }
const inputClass = 'min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal'

export function RegisterPage() {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const submitting = useRef(false)
  const field = (name: keyof RegisterForm) => ({ value: form[name] ?? '', onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: event.target.value }) })

  function validate() {
    const password = form.password.length < 10 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)
      ? 'La contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.'
      : ''
    const next = {
      firstName: structuredNameError(form.firstName),
      firstSurname: structuredNameError(form.firstSurname),
      secondSurname: structuredNameError(form.secondSurname ?? '', false),
      email: emailError(form.email),
      phoneNationalNumber: phoneError(form.phoneCountryCode ?? '', form.phoneNationalNumber ?? ''),
      identification: identificationError(form.identificationType, form.identification),
      password,
      passwordConfirmation: form.password === form.passwordConfirmation ? '' : 'Las contraseñas no coinciden.',
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
    setSuccess('')
    try {
      const payload: RegisterUser = {
        firstName: normalizeText(form.firstName),
        firstSurname: normalizeText(form.firstSurname),
        secondSurname: form.secondSurname ? normalizeText(form.secondSurname) || undefined : undefined,
        identificationType: form.identificationType,
        identification: form.identification,
        email: normalizeEmail(form.email),
        phoneCountryCode: form.phoneNationalNumber ? form.phoneCountryCode : undefined,
        phoneNationalNumber: form.phoneNationalNumber || undefined,
        address: form.address ? normalizeText(form.address) || undefined : undefined,
        password: form.password,
      }
      await authService.register(payload)
      setSuccess('Cuenta creada correctamente. Ya puede iniciar sesión.')
      setForm(initial)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  const idType = form.identificationType as IdentificationType
  return (
    <main>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Acceso comunitario</p>
      <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">Crear una cuenta</h1>
      <p className="mt-3 leading-relaxed text-foreground-muted">Complete sus datos para crear una cuenta activa. Después podrá iniciar sesión.</p>
      <StatusMessage error={error} success={success} />
      <form className="mt-7 grid gap-5" onSubmit={submit} noValidate>
        <label className="grid gap-2 text-sm font-bold" htmlFor="first-name">Nombre
          <input id="first-name" className={inputClass} required minLength={2} maxLength={150} autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? 'first-name-error' : undefined} {...field('firstName')} onBlur={validate} />
          {errors.firstName && <span id="first-name-error" className="field-error" role="alert">{errors.firstName}</span>}
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="first-surname">Primer apellido
          <input id="first-surname" className={inputClass} required minLength={2} maxLength={150} autoComplete="family-name" aria-invalid={Boolean(errors.firstSurname)} aria-describedby={errors.firstSurname ? 'first-surname-error' : undefined} {...field('firstSurname')} onBlur={validate} />
          {errors.firstSurname && <span id="first-surname-error" className="field-error" role="alert">{errors.firstSurname}</span>}
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="second-surname">Segundo apellido (opcional)
          <input id="second-surname" className={inputClass} minLength={2} maxLength={150} autoComplete="family-name" aria-invalid={Boolean(errors.secondSurname)} aria-describedby={errors.secondSurname ? 'second-surname-error' : undefined} {...field('secondSurname')} onBlur={validate} />
          {errors.secondSurname && <span id="second-surname-error" className="field-error" role="alert">{errors.secondSurname}</span>}
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="identification-type">Tipo de identificación
          <select id="identification-type" className={inputClass} value={idType} onChange={(event) => setForm({ ...form, identificationType: event.target.value as IdentificationType, identification: '' })}><option value="NATIONAL">Cédula nacional</option><option value="DIMEX">DIMEX</option></select>
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="identification">Número de identificación
          <input id="identification" className={inputClass} type="text" inputMode="numeric" required maxLength={identificationMaxLength(idType)} aria-invalid={Boolean(errors.identification)} aria-describedby={errors.identification ? 'identification-error' : undefined} value={form.identification} onChange={(event) => setForm({ ...form, identification: digitsOnly(event.target.value, identificationMaxLength(idType)) })} onBlur={validate} />
          {errors.identification && <span id="identification-error" className="field-error" role="alert">{errors.identification}</span>}
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="register-email">Correo electrónico
          <input id="register-email" className={inputClass} type="email" inputMode="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} {...field('email')} onBlur={validate} />
          {errors.email && <span id="register-email-error" className="field-error" role="alert">{errors.email}</span>}
        </label>
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <label className="grid content-start gap-2 text-sm font-bold" htmlFor="country-code">Código país
            <input id="country-code" className={inputClass} type="text" autoComplete="tel-country-code" maxLength={5} {...field('phoneCountryCode')} />
          </label>
          <label className="grid gap-2 text-sm font-bold" htmlFor="phone-number">Número (opcional)
            <input id="phone-number" className={inputClass} type="text" inputMode="numeric" autoComplete="tel-national" maxLength={phoneNationalMaxLength(form.phoneCountryCode ?? '')} aria-invalid={Boolean(errors.phoneNationalNumber)} aria-describedby={errors.phoneNationalNumber ? 'phone-error' : undefined} value={form.phoneNationalNumber ?? ''} onChange={(event) => setForm({ ...form, phoneNationalNumber: digitsOnly(event.target.value, phoneNationalMaxLength(form.phoneCountryCode ?? '')) })} onBlur={validate} />
            {errors.phoneNationalNumber && <span id="phone-error" className="field-error" role="alert">{errors.phoneNationalNumber}</span>}
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold" htmlFor="address">Dirección (opcional)
          <textarea id="address" className="min-h-24 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" maxLength={300} autoComplete="street-address" {...field('address')} />
        </label>
        <p id="password-requirements" className="rounded-lg bg-brand-ivory p-3 text-sm leading-relaxed text-foreground-muted">La contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.</p>
        <label className="grid gap-2 text-sm font-bold" htmlFor="register-password">Contraseña
          <input id="register-password" className={inputClass} type="password" required minLength={10} maxLength={128} autoComplete="new-password" aria-describedby="password-requirements" aria-invalid={Boolean(errors.password)} {...field('password')} onBlur={validate} />
          {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="register-password-confirmation">Confirmar contraseña
          <input id="register-password-confirmation" className={inputClass} type="password" required minLength={10} maxLength={128} autoComplete="new-password" aria-describedby="password-requirements" aria-invalid={Boolean(errors.passwordConfirmation)} {...field('passwordConfirmation')} onBlur={validate} />
          {errors.passwordConfirmation && <span className="field-error" role="alert">{errors.passwordConfirmation}</span>}
        </label>
        <button className="primary min-h-12 w-full rounded-lg px-5 py-3 font-bold" disabled={loading}>{loading ? 'Creando cuenta…' : 'Crear cuenta'}</button>
      </form>
      <div className="mt-7 border-t border-border pt-5 text-center text-sm text-foreground-muted">
        ¿Ya tiene una cuenta? <Link className="inline-flex min-h-11 items-center font-bold text-brand-primary underline-offset-4 hover:underline" to="/login">Iniciar sesión</Link>
      </div>
    </main>
  )
}
