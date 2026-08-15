import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { StatusMessage } from '../components/StatusMessage'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth(); const navigate = useNavigate(); const location = useLocation()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  if (isAuthenticated) return <Navigate to="/profile" replace />
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); try { const user = await login({ email, password }); const requested = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname; navigate(requested || (user.role === 'Administrador' ? '/admin/users' : '/profile'), { replace: true }) } catch { setError('No fue posible iniciar sesión. Verifique sus credenciales.') } finally { setLoading(false) } }
  return <main className="auth-page card"><h1>Iniciar sesión</h1><StatusMessage error={error}/><form className="form-grid" onSubmit={submit}><label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label><button className="primary" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button></form><p><Link to="/forgot-password">Olvidé mi contraseña</Link> · <Link to="/register">Solicitar registro</Link></p></main>
}
