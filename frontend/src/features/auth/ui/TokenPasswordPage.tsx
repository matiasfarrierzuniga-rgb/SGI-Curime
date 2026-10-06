import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { authService } from '../api/auth.api'

function activationErrorMessage(error: unknown) {
  const data = axios.isAxiosError(error) ? error.response?.data as { message?: string | string[] } | undefined : undefined
  const message = Array.isArray(data?.message) ? data.message.join('. ') : data?.message ?? getErrorMessage(error)
  const normalized = message.toLowerCase()

  if (normalized.includes('passwords do not match') || normalized.includes('contraseñas no coinciden')) return 'Las contraseñas no coinciden.'
  if (normalized.includes('activation token has already been used') || normalized.includes('token de activación ya fue utilizado')) return 'Este enlace de activación ya fue utilizado. Inicie sesión o solicite ayuda si aún no puede acceder.'
  if (normalized.includes('account cannot be activated') || normalized.includes('cuenta no puede ser activada')) return 'Esta cuenta no es elegible para activarse o ya está activa. Inicie sesión o contacte a la administración.'
  if (normalized.includes('invalid activation token') || normalized.includes('activation token has expired') || normalized.includes('activation token is no longer valid') || normalized.includes('token de activación no válido') || normalized.includes('token de activación vencido')) return 'El enlace de activación no es válido o venció. Solicite un nuevo enlace a la administración.'
  if (normalized.includes('password') || normalized.includes('contraseña')) return `La contraseña no cumple la política requerida. ${message}`

  return message
}

export function TokenPasswordPage({ mode }: { mode: 'activate' | 'reset' }) {
  const [params] = useSearchParams()
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isActivation = mode === 'activate'
  const hasToken = Boolean(token.trim())
  const title = isActivation ? 'Activar cuenta' : 'Crear nueva contraseña'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (isActivation && !hasToken) {
      setError('Falta el token de activación. Abra el enlace recibido por correo o solicite ayuda a la administración.')
      return
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = { token, password, passwordConfirmation: confirmation }
      const result = isActivation ? await authService.activate(payload) : await authService.resetPassword(payload)
      setSuccess(isActivation ? 'Cuenta activada correctamente. Ya puede iniciar sesión.' : result.message)
      setPassword('')
      setConfirmation('')
    } catch (requestError) {
      setError(isActivation ? activationErrorMessage(requestError) : getErrorMessage(requestError))
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
      <StatusMessage error={error || (isActivation && !hasToken ? 'Falta el token de activación. Abra el enlace recibido por correo o solicite ayuda a la administración.' : '')} success={success} />
      {!success && <form className="mt-6 grid gap-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-bold" htmlFor="access-token">Token
          <Input id="access-token" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" required maxLength={256} autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="new-password">Nueva contraseña
          <Input id="new-password" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" type="password" required minLength={10} maxLength={128} autoComplete="new-password" aria-describedby="password-requirements" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="confirm-password">Confirmar contraseña
          <Input id="confirm-password" className="min-h-12 rounded-lg border border-border bg-surface px-3.5 py-2.5 font-normal" type="password" required minLength={10} maxLength={128} autoComplete="new-password" aria-describedby="password-requirements" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </label>
        <Button type="submit" className="primary min-h-12 w-full rounded-lg px-5 py-3 font-bold" disabled={loading || (isActivation && !hasToken)}>{loading ? 'Procesando…' : title}</Button>
      </form>}
      <div className="mt-7 border-t border-border pt-5 text-center">
        <Link className="inline-flex min-h-11 items-center font-bold text-brand-primary underline-offset-4 hover:underline" to="/login">Volver a iniciar sesión</Link>
      </div>
    </main>
  )
}
