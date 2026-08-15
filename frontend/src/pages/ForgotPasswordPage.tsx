import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { StatusMessage } from '../components/StatusMessage'
import { authService } from '../services/authService'
export function ForgotPasswordPage() { const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  async function submit(e: FormEvent) { e.preventDefault(); setLoading(true); setError(''); try { const result = await authService.forgotPassword(email); setSuccess(result.message); setEmail('') } catch { setError('No fue posible procesar la solicitud. Intente nuevamente.') } finally { setLoading(false) } }
  return <main className="auth-page card"><h1>Recuperar contraseña</h1><StatusMessage error={error} success={success}/><form className="form-grid" onSubmit={submit}><label>Correo electrónico<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)}/></label><button className="primary" disabled={loading}>{loading ? 'Enviando…' : 'Enviar instrucciones'}</button></form><p><Link to="/login">Volver al inicio de sesión</Link></p></main> }
