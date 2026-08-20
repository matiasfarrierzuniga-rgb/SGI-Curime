import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { StatusMessage } from '../components/StatusMessage'
import { userRequestsService } from '../services/userRequestsService'
import type { CreateUserRequest } from '../types/userRequests'
import { getErrorMessage } from '../utils/errors'
const initial: CreateUserRequest = { fullName: '', identification: '', email: '', phone: '', address: '', reason: '' }
export function RegisterPage() { const [form, setForm] = useState(initial); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  const field = (key: keyof CreateUserRequest) => ({ value: form[key] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }) })
  async function submit(e: FormEvent) { e.preventDefault(); setLoading(true); setError(''); try { const payload = { ...form, phone: form.phone || undefined, address: form.address || undefined }; await userRequestsService.create(payload); setSuccess('Solicitud enviada correctamente. Será revisada por una persona administradora.'); setForm(initial) } catch (err) { setError(getErrorMessage(err)) } finally { setLoading(false) } }
  return <main className="auth-page card"><h1>Solicitud de registro</h1><StatusMessage error={error} success={success}/><form className="form-grid" onSubmit={submit}><label>Nombre completo<input required minLength={2} maxLength={150} {...field('fullName')}/></label><label>Identificación<input required maxLength={50} {...field('identification')}/></label><label>Correo electrónico<input type="email" required maxLength={254} {...field('email')}/></label><label>Teléfono (opcional)<input maxLength={30} {...field('phone')}/></label><label>Dirección (opcional)<textarea maxLength={300} {...field('address')}/></label><label>Motivo de la solicitud<textarea required minLength={3} maxLength={1000} {...field('reason')}/></label><button className="primary" disabled={loading}>{loading ? 'Enviando…' : 'Enviar solicitud'}</button></form><p><Link to="/login">Volver al inicio de sesión</Link></p></main> }
