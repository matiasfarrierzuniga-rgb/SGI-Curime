import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { authService } from '../api/auth.api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const submitting = useRef(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    setError('')
    try {
      const result = await authService.forgotPassword(email.trim().toLowerCase())
      setSuccess(result.message)
      setEmail('')
    } catch {
      setError('No fue posible procesar la solicitud. Intente nuevamente.')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <main>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Ayuda de acceso</p>
      <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">Recuperar contraseña</h1>
      <p className="mt-3 leading-relaxed text-foreground-muted">Ingrese el correo asociado a su cuenta y le enviaremos las instrucciones disponibles para recuperar el acceso.</p>
      <StatusMessage error={error} success={success} />
      <form className="mt-7 grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-bold" htmlFor="forgot-email">Correo electrónico
          <input id="forgot-email" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button className="primary min-h-12 w-full rounded-lg px-5 py-3 font-bold" disabled={loading}>{loading ? 'Enviando…' : 'Enviar instrucciones'}</button>
      </form>
      <div className="mt-7 border-t border-border pt-5 text-center">
        <Link className="inline-flex min-h-11 items-center font-bold text-brand-primary underline-offset-4 hover:underline" to="/login">Volver a iniciar sesión</Link>
      </div>
    </main>
  )
}
