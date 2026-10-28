import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { authService, useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { getRoleName } from '@/shared/security/roles'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useToast } from '@/shared/ui/Toast'

type PasswordForm = {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}

type PasswordField = keyof PasswordForm
type PasswordVisibility = Record<PasswordField, boolean>

const emptyPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
}

const initialVisibility: PasswordVisibility = {
  currentPassword: false,
  newPassword: false,
  newPasswordConfirmation: false,
}

export function ProfilePage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const roleName = getRoleName(user?.role)
  const statusLabel = getStatusLabel(user?.status)
  const hasStatus = Boolean(user?.status?.trim())
  const [form, setForm] = useState<PasswordForm>(emptyPasswordForm)
  const [visibility, setVisibility] = useState<PasswordVisibility>(initialVisibility)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationError, setConfirmationError] = useState('')

  const updatePassword = (field: PasswordField, value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    setError('')
    setConfirmationError('')
  }

  const toggleVisibility = (field: PasswordField) => {
    setVisibility(current => ({ ...current, [field]: !current[field] }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.newPassword !== form.newPasswordConfirmation) {
      setError('')
      setConfirmationError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setError('')
    setConfirmationError('')
    try {
      const result = await authService.changePassword(form)
      notify(result.message || 'Contraseña actualizada.', 'success')
      setForm(emptyPasswordForm)
      setVisibility(initialVisibility)
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer className="space-y-6 lg:space-y-8">
      <PageHeader context="Cuenta" title="Mi perfil" description="Consulte los datos asociados a su cuenta y actualice su contraseña." />

      <section aria-labelledby="profile-identity-title" className="overflow-hidden rounded-surface border border-brand-green/25 bg-brand-green text-brand-ivory shadow-elevation-1">
        <div className="h-1.5 bg-brand-maize" aria-hidden="true" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="grid size-20 shrink-0 place-items-center rounded-full border-4 border-brand-maize/70 bg-brand-green text-heading-2 font-bold text-brand-ivory shadow-inner" aria-hidden="true">
            {getInitials(user?.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-caption font-bold uppercase tracking-[0.14em] text-brand-maize">Sesión autenticada</p>
            <h2 id="profile-identity-title" className="mt-1 text-heading-2 font-bold text-balance [overflow-wrap:anywhere]">{displayValue(user?.fullName)}</h2>
            <p className="mt-1 break-all text-body-small text-brand-ivory/85">{displayValue(user?.email)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-maize/60 bg-brand-maize/15 px-3 py-1 text-caption font-semibold text-brand-ivory">Rol: {displayValue(roleName)}</span>
              {hasStatus ? <StatusBadge variant={user?.status === 'ACTIVE' ? 'success' : 'neutral'}>{statusLabel}</StatusBadge> : null}
            </div>
          </div>
        </div>
      </section>

      <Card className="shadow-elevation-1" aria-labelledby="account-information-title">
        <CardHeader className="border-b border-border-subtle">
          <CardTitle id="account-information-title">Información de cuenta</CardTitle>
          <CardDescription>Datos de solo lectura entregados por su sesión actual.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-8">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <AccountDetail label="Nombre">{displayValue(user?.fullName)}</AccountDetail>
            <AccountDetail label="Correo"><span className="break-all">{displayValue(user?.email)}</span></AccountDetail>
            <AccountDetail label="Rol">{displayValue(roleName)}</AccountDetail>
            <AccountDetail label="Estado">
              {hasStatus ? <StatusBadge variant={user?.status === 'ACTIVE' ? 'success' : 'neutral'}>{statusLabel}</StatusBadge> : displayValue(user?.status)}
            </AccountDetail>
          </dl>
        </CardContent>
      </Card>

      <Card id="cambiar-contrasena" className="shadow-elevation-1" aria-labelledby="password-security-title">
        <CardHeader className="border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-green/10 text-brand-green" aria-hidden="true"><ShieldCheck className="size-5" /></span>
            <div>
              <CardTitle id="password-security-title">Seguridad de la cuenta</CardTitle>
              <CardDescription className="mt-1">Cambie su contraseña sin modificar sus datos personales ni permisos.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-8">
          <form className="max-w-xl space-y-6" onSubmit={submit}>
            {error ? <Alert variant="destructive"><AlertTitle>No fue posible cambiar la contraseña</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
            <div className="grid gap-5">
              <FormField id="current-password" label="Contraseña actual" required>
                <PasswordInput
                  autoComplete="current-password"
                  label="la contraseña actual"
                  maxLength={128}
                  value={form.currentPassword}
                  visible={visibility.currentPassword}
                  onChange={event => updatePassword('currentPassword', event.target.value)}
                  onToggle={() => toggleVisibility('currentPassword')}
                  required
                />
              </FormField>
              <FormField id="new-password" label="Nueva contraseña" description="Use al menos 10 caracteres e incluya mayúscula, minúscula y número." required>
                <PasswordInput
                  autoComplete="new-password"
                  label="la nueva contraseña"
                  maxLength={128}
                  minLength={10}
                  value={form.newPassword}
                  visible={visibility.newPassword}
                  onChange={event => updatePassword('newPassword', event.target.value)}
                  onToggle={() => toggleVisibility('newPassword')}
                  required
                />
              </FormField>
              <FormField id="password-confirmation" label="Confirmar nueva contraseña" error={confirmationError} required>
                <PasswordInput
                  autoComplete="new-password"
                  label="la confirmación de contraseña"
                  maxLength={128}
                  minLength={10}
                  value={form.newPasswordConfirmation}
                  visible={visibility.newPasswordConfirmation}
                  onChange={event => updatePassword('newPasswordConfirmation', event.target.value)}
                  onToggle={() => toggleVisibility('newPasswordConfirmation')}
                  required
                />
              </FormField>
            </div>
            <div className="flex flex-col gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-small text-text-secondary">Al actualizarla, las sesiones existentes se gestionan según la política de seguridad.</p>
              <Button type="submit" className="w-full sm:w-auto" loading={loading}>{loading ? 'Actualizando…' : 'Cambiar contraseña'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

type PasswordInputProps = {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  autoComplete: string
  label: string
  maxLength?: number
  minLength?: number
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onToggle: () => void
  required?: boolean
  value: string
  visible: boolean
}

function PasswordInput({ id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, autoComplete, label, maxLength, minLength, onChange, onToggle, required, value, visible }: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        className="pr-12"
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="absolute right-1 top-1 grid size-9 place-items-center rounded-control text-text-secondary transition-colors hover:bg-background-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
        aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
        aria-pressed={visible}
        onClick={onToggle}
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}

function AccountDetail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-label font-semibold text-text-secondary">{label}</dt><dd className="mt-1 text-body font-medium text-text-primary">{children}</dd></div>
}

function displayValue(value: string | null | undefined) {
  return value?.trim() || 'No disponible'
}

function getInitials(value: string | null | undefined) {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? []
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getStatusLabel(status: string | null | undefined) {
  if (!status?.trim()) return 'No disponible'
  if (status === 'ACTIVE') return 'Activo'
  if (status === 'INACTIVE') return 'Inactivo'
  return status
}
