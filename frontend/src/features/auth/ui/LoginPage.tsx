import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { useAuth } from '../model/AuthContext'
import { homePathForRole } from '@/shared/security/roles'

export function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const submitting = useRef(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); if (submitting.current) return; submitting.current = true; setLoading(true); setError('')
    try { const user = await login({ email: email.trim().toLowerCase(), password }); const requested = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname; navigate(requested || homePathForRole(user.role), { replace: true }) }
    catch { setError('No fue posible iniciar sesión. Verifique sus credenciales.') }
    finally { submitting.current = false; setLoading(false) }
  }
  return <main className="auth-page card"><h1>Iniciar sesión</h1><StatusMessage error={error}/><form className="form-grid" onSubmit={submit}><label>Correo electrónico<input type="email" inputMode="email" autoComplete="username" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label><button className="primary" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button></form><p><Link to="/forgot-password">Olvidé mi contraseña</Link> · <Link to="/register">Solicitar registro</Link></p></main>
}
