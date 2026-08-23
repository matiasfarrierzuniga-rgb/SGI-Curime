import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { authService } from '../api/auth.api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const submitting = useRef(false)
  async function submit(e: FormEvent) { e.preventDefault(); if (submitting.current) return; submitting.current = true; setLoading(true); setError(''); try { const result = await authService.forgotPassword(email.trim().toLowerCase()); setSuccess(result.message); setEmail('') } catch { setError('No fue posible procesar la solicitud. Intente nuevamente.') } finally { submitting.current = false; setLoading(false) } }
  return <main className="auth-page card"><h1>Recuperar contraseña</h1><StatusMessage error={error} success={success}/><form className="form-grid" onSubmit={submit}><label>Correo electrónico<input type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)}/></label><button className="primary" disabled={loading}>{loading ? 'Enviando…' : 'Enviar instrucciones'}</button></form><p><Link to="/login">Volver al inicio de sesión</Link></p></main>
}
