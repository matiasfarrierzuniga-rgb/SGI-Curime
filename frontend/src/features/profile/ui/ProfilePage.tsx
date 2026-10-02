import { useState, type FormEvent, type ReactNode } from 'react'
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

type PasswordForm = { currentPassword: string; password: string; passwordConfirmation: string }

const emptyPasswordForm: PasswordForm = { currentPassword: '', password: '', passwordConfirmation: '' }

export function ProfilePage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const roleName = getRoleName(user?.role)
  const [form, setForm] = useState<PasswordForm>(emptyPasswordForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.password !== form.passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await authService.changePassword(form)
      notify(result.message || 'Contraseña actualizada.', 'success')
      setForm(emptyPasswordForm)
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer className="space-y-6 lg:space-y-8">
      <PageHeader context="Cuenta" title="Mi perfil" description="Consulte los datos asociados a su cuenta y actualice su contraseña." />

      <Card className="shadow-elevation-1">
        <CardHeader className="border-b border-border-subtle">
          <CardTitle>Información de cuenta</CardTitle>
          <CardDescription>Datos entregados por su sesión actual.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-8">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <AccountDetail label="Nombre">{user?.fullName ?? '—'}</AccountDetail>
            <AccountDetail label="Correo"><span className="break-all">{user?.email ?? '—'}</span></AccountDetail>
            <AccountDetail label="Rol">{roleName ?? '—'}</AccountDetail>
            <AccountDetail label="Estado">
              <StatusBadge variant={user?.status === 'ACTIVE' ? 'success' : 'neutral'}>{user?.status === 'ACTIVE' ? 'Activo' : user?.status ?? '—'}</StatusBadge>
            </AccountDetail>
          </dl>
        </CardContent>
      </Card>

      <Card className="shadow-elevation-1">
        <CardHeader className="border-b border-border-subtle">
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>Use al menos 10 caracteres e incluya mayúscula, minúscula y número.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-8">
          <form className="max-w-xl space-y-6" onSubmit={submit}>
            {error ? <Alert variant="destructive"><AlertTitle>No fue posible cambiar la contraseña</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
            <div className="space-y-5">
              <FormField id="current-password" label="Contraseña actual" required>
                <Input type="password" required autoComplete="current-password" value={form.currentPassword} onChange={event => setForm(current => ({ ...current, currentPassword: event.target.value }))} />
              </FormField>
              <FormField id="new-password" label="Nueva contraseña" required>
                <Input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} />
              </FormField>
              <FormField id="password-confirmation" label="Confirmar nueva contraseña" required>
                <Input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={form.passwordConfirmation} onChange={event => setForm(current => ({ ...current, passwordConfirmation: event.target.value }))} />
              </FormField>
            </div>
            <div className="border-t border-border-subtle pt-6">
              <Button type="submit" className="w-full sm:w-auto" loading={loading}>{loading ? 'Actualizando…' : 'Cambiar contraseña'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

function AccountDetail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-label font-semibold text-text-secondary">{label}</dt><dd className="mt-1 text-body font-medium text-text-primary">{children}</dd></div>
}
