import { Eye, EyeOff } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { homePathForRole } from '@/shared/security/roles'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { useAuth } from '../model/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    setError('')
    try {
      const user = await login({ email: email.trim().toLowerCase(), password })
      const requested = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(requested || homePathForRole(user.role), { replace: true })
    } catch {
      setError('No fue posible iniciar sesión. Verifique sus credenciales.')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <main>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Acceso a su cuenta</p>
      <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">Iniciar sesión</h1>
      <p className="mt-3 text-base leading-relaxed text-foreground-muted">Acceda a su cuenta de SGI-Curime.</p>
      <StatusMessage error={error} />
      <form className="mt-7 grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-bold" htmlFor="login-email">Correo electrónico
          <input id="login-email" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" type="email" inputMode="email" autoComplete="username" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-bold" htmlFor="login-password">Contraseña</label>
            <Link className="text-sm font-bold text-brand-primary underline-offset-4 hover:underline" to="/forgot-password">¿Olvidó su contraseña?</Link>
          </div>
          <div className="relative">
            <input id="login-password" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 pr-12 font-normal" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1 inline-flex size-10 items-center justify-center rounded-md border-0 bg-transparent p-0 text-brand-deep hover:bg-brand-soft/20">
              {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <button className="primary min-h-12 w-full rounded-lg px-5 py-3 font-bold" disabled={loading}>{loading ? 'Ingresando…' : 'Iniciar sesión'}</button>
      </form>
      <div className="mt-7 border-t border-border pt-6 text-center">
        <p className="text-sm text-foreground-muted">¿Todavía no tiene una cuenta?</p>
        <Link className="mt-2 inline-flex min-h-11 items-center font-bold text-brand-primary underline-offset-4 hover:underline" to="/register">Solicitar una cuenta</Link>
      </div>
    </main>
  )
}
