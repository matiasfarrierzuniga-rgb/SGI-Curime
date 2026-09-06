import { ArrowLeft, ArrowRight, Check, Circle, Eye, EyeOff } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import {
  digitsOnly,
  emailError,
  identificationError,
  identificationMaxLength,
  normalizeEmail,
  normalizeText,
  phoneError,
  structuredNameError,
  type IdentificationType,
} from '@/shared/lib/formValidation'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { PhoneField } from '@/shared/ui/forms/PhoneField'
import { authService } from '../api/auth.api'
import type { RegisterUser } from '../model/auth.types'

type RegisterForm = RegisterUser & { passwordConfirmation: string }
type RegisterErrors = Partial<Record<keyof RegisterForm, string>>
type Step = 1 | 2 | 3

const initial: RegisterForm = {
  firstName: '',
  firstSurname: '',
  secondSurname: '',
  identificationType: 'NATIONAL',
  identification: '',
  email: '',
  phoneCountryCode: '+506',
  phoneNationalNumber: '',
  address: '',
  password: '',
  passwordConfirmation: '',
}

const inputClass = 'min-h-12 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
const steps = [
  { id: 1 as Step, label: 'Datos' },
  { id: 2 as Step, label: 'Contacto' },
  { id: 3 as Step, label: 'Seguridad' },
]

function passwordError(password: string) {
  return password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)
    ? 'La contraseña debe cumplir todos los requisitos indicados.'
    : ''
}

function buildErrors(form: RegisterForm): RegisterErrors {
  return {
    firstName: structuredNameError(form.firstName),
    firstSurname: structuredNameError(form.firstSurname),
    secondSurname: structuredNameError(form.secondSurname ?? '', false),
    identification: identificationError(form.identificationType, form.identification),
    email: emailError(form.email),
    phoneNationalNumber: phoneError(form.phoneCountryCode ?? '', form.phoneNationalNumber ?? ''),
    password: passwordError(form.password),
    passwordConfirmation: form.password === form.passwordConfirmation ? '' : 'Las contraseñas no coinciden.',
  }
}

const stepFields: Record<Step, Array<keyof RegisterForm>> = {
  1: ['firstName', 'firstSurname', 'secondSurname', 'identification'],
  2: ['email', 'phoneNationalNumber'],
  3: ['password', 'passwordConfirmation'],
}

const fieldIds: Partial<Record<keyof RegisterForm, string>> = {
  firstName: 'first-name',
  firstSurname: 'first-surname',
  secondSurname: 'second-surname',
  identification: 'identification',
  email: 'register-email',
  phoneNationalNumber: 'phone-number',
  password: 'register-password',
  passwordConfirmation: 'register-password-confirmation',
}

export function RegisterPage() {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const submitting = useRef(false)

  const field = (name: keyof RegisterForm) => ({
    value: form[name] ?? '',
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [name]: event.target.value }))
      if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }))
    },
  })

  const idType = form.identificationType as IdentificationType
  const passwordChecks = [
    { label: '10 caracteres', valid: form.password.length >= 10 },
    { label: 'Una mayúscula', valid: /[A-Z]/.test(form.password) },
    { label: 'Una minúscula', valid: /[a-z]/.test(form.password) },
    { label: 'Un número', valid: /\d/.test(form.password) },
  ]

  function focusFirstError(nextErrors: RegisterErrors, fields: Array<keyof RegisterForm>) {
    const invalid = fields.find((name) => Boolean(nextErrors[name]))
    if (!invalid) return
    const id = fieldIds[invalid]
    if (!id) return
    requestAnimationFrame(() => {
      const element = document.getElementById(id)
      element?.focus()
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  function validateStep(targetStep: Step) {
    const allErrors = buildErrors(form)
    const fields = stepFields[targetStep]
    const relevantErrors = Object.fromEntries(fields.map((name) => [name, allErrors[name] ?? ''])) as RegisterErrors
    setErrors((current) => ({ ...current, ...relevantErrors }))
    const valid = fields.every((name) => !allErrors[name])
    if (!valid) focusFirstError(allErrors, fields)
    return valid
  }

  function nextStep() {
    setError('')
    if (!validateStep(step)) return
    setStep((current) => Math.min(3, current + 1) as Step)
  }

  function previousStep() {
    setError('')
    setStep((current) => Math.max(1, current - 1) as Step)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current || !validateStep(3)) return

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
      setErrors({})
      setStep(1)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <main>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Acceso comunitario</p>
      <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">Crear una cuenta</h1>
      <p className="mt-3 leading-relaxed text-foreground-muted">Cree su acceso al SGI en tres pasos sencillos.</p>

      <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Progreso del registro">
        {steps.map((item) => {
          const completed = item.id < step
          const active = item.id === step
          return (
            <li key={item.id} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold ${completed || active ? 'border-brand-primary bg-brand-primary text-white' : 'border-border bg-surface text-foreground-muted'}`}
                  aria-current={active ? 'step' : undefined}
                >
                  {completed ? <Check className="size-4" aria-hidden="true" /> : item.id}
                </span>
                <span className={`truncate text-xs font-bold sm:text-sm ${active ? 'text-brand-deep' : 'text-foreground-muted'}`}>{item.label}</span>
              </div>
              <div className={`mt-2 h-1 rounded-full ${completed || active ? 'bg-brand-primary' : 'bg-border'}`} aria-hidden="true" />
            </li>
          )
        })}
      </ol>

      <StatusMessage error={error} success={success} />

      <form className="mt-7" onSubmit={submit} noValidate>
        {step === 1 && (
          <section className="grid gap-5" aria-labelledby="register-step-1-title">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">Paso 1 de 3</p>
              <h2 id="register-step-1-title" className="mt-1 font-heading text-2xl font-bold text-brand-deep">Datos personales</h2>
              <p className="mt-1 text-sm text-foreground-muted">Use los datos de su documento de identificación.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold" htmlFor="first-name">Nombre
                <input id="first-name" className={inputClass} required minLength={2} maxLength={150} autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? 'first-name-error' : undefined} {...field('firstName')} />
                {errors.firstName && <span id="first-name-error" className="field-error" role="alert">{errors.firstName}</span>}
              </label>
              <label className="grid gap-2 text-sm font-bold" htmlFor="first-surname">Primer apellido
                <input id="first-surname" className={inputClass} required minLength={2} maxLength={150} autoComplete="family-name" aria-invalid={Boolean(errors.firstSurname)} aria-describedby={errors.firstSurname ? 'first-surname-error' : undefined} {...field('firstSurname')} />
                {errors.firstSurname && <span id="first-surname-error" className="field-error" role="alert">{errors.firstSurname}</span>}
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold" htmlFor="second-surname">Segundo apellido <span className="font-normal text-foreground-muted">(opcional)</span>
              <input id="second-surname" className={inputClass} minLength={2} maxLength={150} autoComplete="family-name" aria-invalid={Boolean(errors.secondSurname)} aria-describedby={errors.secondSurname ? 'second-surname-error' : undefined} {...field('secondSurname')} />
              {errors.secondSurname && <span id="second-surname-error" className="field-error" role="alert">{errors.secondSurname}</span>}
            </label>

            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <label className="grid gap-2 text-sm font-bold" htmlFor="identification-type">Tipo de identificación
                <select
                  id="identification-type"
                  className={inputClass}
                  value={idType}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, identificationType: event.target.value as IdentificationType, identification: '' }))
                    setErrors((current) => ({ ...current, identification: '' }))
                  }}
                >
                  <option value="NATIONAL">Cédula nacional</option>
                  <option value="DIMEX">DIMEX</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold" htmlFor="identification">Número de identificación
                <input id="identification" className={inputClass} type="text" inputMode="numeric" required maxLength={identificationMaxLength(idType)} aria-invalid={Boolean(errors.identification)} aria-describedby={errors.identification ? 'identification-error' : undefined} value={form.identification} onChange={(event) => { setForm((current) => ({ ...current, identification: digitsOnly(event.target.value, identificationMaxLength(idType)) })); if (errors.identification) setErrors((current) => ({ ...current, identification: '' })) }} />
                {errors.identification && <span id="identification-error" className="field-error" role="alert">{errors.identification}</span>}
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="grid gap-5" aria-labelledby="register-step-2-title">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">Paso 2 de 3</p>
              <h2 id="register-step-2-title" className="mt-1 font-heading text-2xl font-bold text-brand-deep">Contacto</h2>
              <p className="mt-1 text-sm text-foreground-muted">Indique cómo podemos identificar su acceso y contactarle si es necesario.</p>
            </div>

            <label className="grid gap-2 text-sm font-bold" htmlFor="register-email">Correo electrónico
              <input id="register-email" className={inputClass} type="email" inputMode="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} {...field('email')} />
              {errors.email && <span id="register-email-error" className="field-error" role="alert">{errors.email}</span>}
            </label>

            <PhoneField
              id="phone-number"
              label="Teléfono"
              value={{ countryCode: form.phoneCountryCode, nationalNumber: form.phoneNationalNumber }}
              error={errors.phoneNationalNumber}
              onChange={({ countryCode, nationalNumber }) => {
                setForm((current) => ({ ...current, phoneCountryCode: countryCode, phoneNationalNumber: nationalNumber }))
                if (errors.phoneNationalNumber) setErrors((current) => ({ ...current, phoneNationalNumber: '' }))
              }}
            />

            <label className="grid gap-2 text-sm font-bold" htmlFor="address">Dirección <span className="font-normal text-foreground-muted">(opcional)</span>
              <textarea id="address" className="min-h-24 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15" maxLength={300} autoComplete="street-address" {...field('address')} />
            </label>
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-5" aria-labelledby="register-step-3-title">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">Paso 3 de 3</p>
              <h2 id="register-step-3-title" className="mt-1 font-heading text-2xl font-bold text-brand-deep">Seguridad</h2>
              <p className="mt-1 text-sm text-foreground-muted">Proteja su cuenta con una contraseña segura.</p>
            </div>

            <div id="password-requirements" className="grid gap-2 rounded-xl bg-brand-ivory p-4 sm:grid-cols-2" aria-label="Requisitos de contraseña">
              {passwordChecks.map((check) => (
                <div key={check.label} className={`flex items-center gap-2 text-sm ${check.valid ? 'font-semibold text-brand-deep' : 'text-foreground-muted'}`}>
                  {check.valid ? <Check className="size-4" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}
                  {check.label}
                </div>
              ))}
            </div>

            <label className="grid gap-2 text-sm font-bold" htmlFor="register-password">Contraseña
              <div className="relative">
                <input id="register-password" className={`${inputClass} pr-12`} type={showPassword ? 'text' : 'password'} required minLength={10} maxLength={128} autoComplete="new-password" aria-describedby="password-requirements" aria-invalid={Boolean(errors.password)} {...field('password')} />
                <button type="button" className="absolute right-1 top-1 grid size-10 place-items-center rounded-md text-foreground-muted hover:bg-brand-soft/25 hover:text-brand-deep" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
            </label>

            <label className="grid gap-2 text-sm font-bold" htmlFor="register-password-confirmation">Confirmar contraseña
              <div className="relative">
                <input id="register-password-confirmation" className={`${inputClass} pr-12`} type={showConfirmation ? 'text' : 'password'} required minLength={10} maxLength={128} autoComplete="new-password" aria-invalid={Boolean(errors.passwordConfirmation)} {...field('passwordConfirmation')} />
                <button type="button" className="absolute right-1 top-1 grid size-10 place-items-center rounded-md text-foreground-muted hover:bg-brand-soft/25 hover:text-brand-deep" onClick={() => setShowConfirmation((current) => !current)} aria-label={showConfirmation ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}>
                  {showConfirmation ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.passwordConfirmation && <span className="field-error" role="alert">{errors.passwordConfirmation}</span>}
            </label>
          </section>
        )}

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
          {step > 1 ? (
            <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-lg px-4 font-bold text-brand-deep hover:bg-brand-soft/25" onClick={previousStep} disabled={loading}>
              <ArrowLeft className="size-4" aria-hidden="true" /> Atrás
            </button>
          ) : <span />}

          {step < 3 ? (
            <button type="button" className="primary inline-flex min-h-12 items-center gap-2 rounded-lg px-5 py-3 font-bold" onClick={nextStep}>
              Continuar <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button className="primary min-h-12 rounded-lg px-6 py-3 font-bold" disabled={loading}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-foreground-muted">
        ¿Ya tiene una cuenta? <Link className="inline-flex min-h-11 items-center font-bold text-brand-primary underline-offset-4 hover:underline" to="/login">Iniciar sesión</Link>
      </div>
    </main>
  )
}
