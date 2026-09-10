import { Eye, EyeOff, LogIn } from 'lucide-react'
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
    <main className="w-full">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-7 bg-brand-red" />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-red">Acceso a su cuenta</p>
      </div>
      <h1 className="mt-3 font-heading text-heading-1 font-normal leading-tight text-brand-brown">Iniciar sesión</h1>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-foreground-muted">Ingrese sus credenciales para continuar con la gestión de Curime.</p>
      <StatusMessage error={error} className="mt-6 text-sm leading-relaxed" />
      <form className="mt-8 grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-bold text-brand-brown" htmlFor="login-email">Correo electrónico
          <input id="login-email" className="min-h-12 rounded-control border border-border bg-surface px-3.5 py-2.5 font-normal text-brand-brown shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-foreground-subtle hover:border-brand-maize/65 focus:border-brand-red focus:bg-card-white focus:outline-none focus-visible:ring-3 focus-visible:ring-brand-red/20" type="email" inputMode="email" autoComplete="username" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-bold text-brand-brown" htmlFor="login-password">Contraseña</label>
            <Link className="rounded-sm text-sm font-bold text-brand-red underline-offset-4 transition-colors hover:text-brand-brown hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red" to="/forgot-password">¿Olvidó su contraseña?</Link>
          </div>
          <div className="relative">
            <input id="login-password" className="min-h-12 rounded-control border border-border bg-surface px-3.5 py-2.5 pr-14 font-normal text-brand-brown shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-foreground-subtle hover:border-brand-maize/65 focus:border-brand-red focus:bg-card-white focus:outline-none focus-visible:ring-3 focus-visible:ring-brand-red/20" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute top-1/2 right-1.5 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-control border-0 bg-transparent p-0 text-brand-brown transition-colors hover:bg-brand-maize/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-red">
              {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <button className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-primary bg-primary px-5 py-3 font-bold text-primary-foreground shadow-md transition-[background-color,box-shadow,transform] hover:bg-brand-deep hover:shadow-lg motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-px motion-safe:active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-55" disabled={loading}><LogIn className="size-4" aria-hidden="true" />{loading ? 'Ingresando…' : 'Iniciar sesión'}</button>
      </form>
      <div className="mt-9 border-t border-border-subtle pt-6 text-center">
        <p className="text-sm text-foreground-muted">¿Aún no tiene una cuenta?</p>
        <Link className="mt-2 inline-flex min-h-11 items-center rounded-control px-3 font-bold text-brand-green underline-offset-4 transition-colors hover:bg-brand-ivory hover:text-brand-red hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red" to="/register">Solicitar una cuenta</Link>
      </div>
    </main>
  )
}
