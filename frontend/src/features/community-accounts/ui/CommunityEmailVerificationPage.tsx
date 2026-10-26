import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { emailError } from '@/shared/lib/formValidation'
import { useToast } from '@/shared/ui/Toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { showResultDialog } from '@/shared/ui/resultDialog'
import { communityAccountsService } from '../api/communityAccounts.api'
import { communityAccountFeedback, communityFeedbackMessages } from '../model/communityAccountFeedback'

export function CommunityEmailVerificationPage() {
  const { notify } = useToast()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [email, setEmail] = useState('')
  const [verificationMessage, setVerificationMessage] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [emailErrorMessage, setEmailErrorMessage] = useState('')
  const [loading, setLoading] = useState<'verify' | 'resend' | null>(null)
  const [verificationSucceeded, setVerificationSucceeded] = useState(false)
  const verificationStarted = useRef(false)

  async function verify() {
    if (!token) {
      setVerificationError(communityFeedbackMessages.tokenUnavailable)
      return
    }
    if (verificationStarted.current) return

    verificationStarted.current = true
    setLoading('verify')
    setVerificationError('')
    try {
      await communityAccountsService.verifyEmail(token)
    } catch (error) {
      verificationStarted.current = false
      setVerificationError(communityAccountFeedback(error, 'verify').message)
      setLoading(null)
      return
    }

    setVerificationSucceeded(true)
    setVerificationMessage(communityFeedbackMessages.verificationSucceeded)
    setLoading(null)
    try {
      const result = await showResultDialog({
        icon: 'success',
        title: '¡Correo verificado!',
        text: 'Tu cuenta comunitaria está activa. Ya podés iniciar sesión',
        confirmButtonText: 'Iniciar sesión',
      })
      if (result.isConfirmed) navigate('/login', { replace: true })
    } catch {
      // Verification already succeeded; retain its terminal state if the dialog fails.
    }
  }

  async function resend(event: FormEvent) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const validationError = emailError(normalizedEmail)
    setEmailErrorMessage(validationError)
    if (validationError) return

    setLoading('resend')
    try {
      await communityAccountsService.resendVerification(normalizedEmail)
      notify(communityFeedbackMessages.resendAccepted, 'info')
    } catch (error) {
      const feedback = communityAccountFeedback(error, 'resend')
      if (feedback.field === 'email') setEmailErrorMessage(feedback.message)
      else notify(feedback.message, feedback.kind)
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="w-full">
      <p className="public-eyebrow text-brand-primary">Cuenta comunitaria</p>
      <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-deep">Verifique su correo</h1>
      <p className="mt-3 text-body leading-relaxed text-text-secondary">Use el enlace recibido para completar la verificación. No necesita definir otra contraseña.</p>
      {verificationMessage ? <p className="mt-5 rounded-control border border-status-success/30 bg-status-success-surface p-4 text-body-small text-status-success" role="status">{verificationMessage}</p> : null}
      {(verificationError || !token) ? <p className="mt-5 rounded-control border border-status-danger/30 bg-status-danger-surface p-4 text-body-small text-status-danger" role="alert">{verificationError || communityFeedbackMessages.tokenUnavailable}</p> : null}
      <Button className="mt-6 min-h-12" loading={loading === 'verify'} disabled={!token || loading === 'resend' || verificationSucceeded} onClick={verify}>Verificar correo</Button>
      <form className="mt-8 grid gap-3 border-t border-border-subtle pt-6" noValidate onSubmit={resend}>
        <h2 className="font-heading text-heading-3 font-bold text-brand-deep">¿Necesita otro enlace?</h2>
        <label className="grid gap-1.5 text-label font-semibold text-foreground" htmlFor="resend-email">
          Correo electrónico
          <Input id="resend-email" type="email" autoComplete="email" inputMode="email" maxLength={254} required value={email} aria-describedby={emailErrorMessage ? 'resend-email-error' : undefined} onChange={(event) => { setEmail(event.target.value); setEmailErrorMessage('') }} />
        </label>
        {emailErrorMessage ? <p id="resend-email-error" className="text-body-small text-destructive" role="alert">{emailErrorMessage}</p> : null}
        <Button type="submit" variant="outline" loading={loading === 'resend'} disabled={loading === 'verify'}>Reenviar enlace</Button>
      </form>
      <Link className="mt-6 inline-flex font-bold text-brand-primary underline-offset-4 hover:underline" to="/login">Volver a iniciar sesión</Link>
    </main>
  )
}
