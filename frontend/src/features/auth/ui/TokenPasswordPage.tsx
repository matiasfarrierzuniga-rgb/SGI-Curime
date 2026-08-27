import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { authService } from '../api/auth.api'

export function TokenPasswordPage({ mode }: { mode: 'activate' | 'reset' }) {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isActivation = mode === 'activate'
  const title = isActivation ? 'Activar cuenta' : 'Crear nueva contraseña'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = { token, password, passwordConfirmation: confirmation }
      const result = isActivation ? await authService.activate(payload) : await authService.resetPassword(payload)
      setSuccess(result.message)
      setPassword('')
      setConfirmation('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">{isActivation ? 'Primer acceso' : 'Recuperación de acceso'}</p>
      <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">{title}</h1>
      <p className="mt-3 leading-relaxed text-foreground-muted">{isActivation ? 'Defina una contraseña para completar la activación de su cuenta.' : 'Defina una nueva contraseña para volver a ingresar a su cuenta.'}</p>
      <p id="password-requirements" className="mt-3 rounded-lg bg-brand-ivory p-3 text-sm leading-relaxed text-foreground-muted">La contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.</p>
      <StatusMessage error={error} success={success} />
      <form className="mt-6 grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-bold" htmlFor="access-token">Token
          <input id="access-token" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" required maxLength={256} autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="new-password">Nueva contraseña
          <input id="new-password" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" type="password" required minLength={10} maxLength={128} autoComplete="new-password" aria-describedby="password-requirements" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="confirm-password">Confirmar contraseña
          <input id="confirm-password" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" type="password" required minLength={10} maxLength={128} autoComplete="new-password" aria-describedby="password-requirements" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </label>
        <button className="primary min-h-12 w-full rounded-lg px-5 py-3 font-bold" disabled={loading}>{loading ? 'Procesando…' : title}</button>
      </form>
      <div className="mt-7 border-t border-border pt-5 text-center">
        <Link className="inline-flex min-h-11 items-center font-bold text-brand-primary underline-offset-4 hover:underline" to="/login">Volver a iniciar sesión</Link>
      </div>
    </main>
  )
}
