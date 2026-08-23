import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { userRequestsService } from '../services/userRequestsService'
import type { CreateUserRequest } from '../types/userRequests'
import { digitsOnly, identificationError, identificationMaxLength, normalizeEmail, normalizeText, personContactErrors, phoneNationalMaxLength, type IdentificationType } from '@/shared/lib/formValidation'
import { getErrorMessage } from '@/shared/lib/errors'

const initial: CreateUserRequest = { fullName: '', identificationType: 'NATIONAL', identification: '', email: '', phoneCountryCode: '+506', phoneNationalNumber: '', address: '', reason: '' }

export function RegisterPage() {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const submitting = useRef(false)
  const field = (name: keyof CreateUserRequest) => ({ value: form[name] ?? '', onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: e.target.value }) })
  function validate() {
    const next = { ...personContactErrors(form), identification: identificationError(form.identificationType, form.identification) }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (submitting.current || !validate()) return
    submitting.current = true; setLoading(true); setError('')
    try {
      const payload = { ...form, fullName: normalizeText(form.fullName), email: normalizeEmail(form.email), address: form.address ? normalizeText(form.address) || undefined : undefined, phoneCountryCode: form.phoneNationalNumber ? form.phoneCountryCode : undefined, phoneNationalNumber: form.phoneNationalNumber || undefined, reason: normalizeText(form.reason) }
      await userRequestsService.create(payload)
      setSuccess('Solicitud enviada correctamente. Será revisada por una persona administradora.')
      setForm(initial)
    } catch (err) { setError(getErrorMessage(err)) } finally { submitting.current = false; setLoading(false) }
  }
  const idType = form.identificationType as IdentificationType
  return <main className="auth-page card"><h1>Solicitud de registro</h1><StatusMessage error={error} success={success}/><form className="form-grid" onSubmit={submit} noValidate>
    <label>Nombre completo<input required minLength={2} maxLength={150} autoComplete="name" {...field('fullName')} onBlur={validate}/>{errors.fullName && <span className="field-error" role="alert">{errors.fullName}</span>}</label>
    <label>Tipo de identificación<select value={idType} onChange={e => setForm({ ...form, identificationType: e.target.value as IdentificationType, identification: '' })}><option value="NATIONAL">Nacional</option><option value="DIMEX">DIMEX</option></select></label>
    <label>Número de identificación<input type="text" inputMode="numeric" required maxLength={identificationMaxLength(idType)} value={form.identification} onChange={e => setForm({ ...form, identification: digitsOnly(e.target.value, identificationMaxLength(idType)) })} onBlur={validate}/>{errors.identification && <span className="field-error" role="alert">{errors.identification}</span>}</label>
    <label>Correo electrónico<input type="email" inputMode="email" autoComplete="email" required maxLength={254} {...field('email')} onBlur={validate}/>{errors.email && <span className="field-error" role="alert">{errors.email}</span>}</label>
    <label>Código país<input type="text" autoComplete="tel-country-code" maxLength={5} {...field('phoneCountryCode')} /></label>
    <label>Número (opcional)<input type="text" inputMode="numeric" autoComplete="tel-national" maxLength={phoneNationalMaxLength(form.phoneCountryCode ?? '')} value={form.phoneNationalNumber ?? ''} onChange={e => setForm({ ...form, phoneNationalNumber: digitsOnly(e.target.value, phoneNationalMaxLength(form.phoneCountryCode ?? '')) })} onBlur={validate}/>{errors.phoneNationalNumber && <span className="field-error" role="alert">{errors.phoneNationalNumber}</span>}</label>
    <label>Dirección (opcional)<textarea maxLength={300} autoComplete="street-address" {...field('address')}/></label><label>Motivo de la solicitud<textarea required minLength={3} maxLength={1000} {...field('reason')}/></label><button className="primary" disabled={loading}>{loading ? 'Enviando…' : 'Enviar solicitud'}</button></form><p><Link to="/login">Volver al inicio de sesión</Link></p></main>
}
