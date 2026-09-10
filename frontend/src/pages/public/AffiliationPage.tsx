import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { affiliationSchema, mapAffiliationFormToRequest, type AffiliationFormValues } from '@/features/affiliate-requests'
import { getErrorMessage } from '@/shared/lib/errors'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'
import { Breadcrumbs, PublicPageHeader, SectionContainer, Seo } from '../../components/public/PublicComponents'

const emptyValues: AffiliationFormValues = { birthDate: '', gender: '', address: '', occupation: '', workplace: '', affiliationReason: '' }

export function AffiliationPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [success, setSuccess] = useState(false)
  const [requestError, setRequestError] = useState('')
  const submitLock = useRef(false)
  const form = useForm<AffiliationFormValues>({ resolver: zodResolver(affiliationSchema), defaultValues: emptyValues, mode: 'onTouched' })

  useEffect(() => {
    if (user?.address && !form.formState.dirtyFields.address) form.setValue('address', user.address)
  }, [form, user?.address])

  async function submit(values: AffiliationFormValues) {
    if (submitLock.current) return
    submitLock.current = true
    setRequestError('')
    try {
      await affiliateRequestsService.create(mapAffiliationFormToRequest(values))
      setSuccess(true)
    } catch (error) {
      setRequestError(axios.isAxiosError(error) && error.response?.status === 409
        ? 'Ya existe una afiliación o una solicitud pendiente asociada a su cuenta.'
        : getErrorMessage(error, 'No fue posible enviar la solicitud. Intente nuevamente.'))
    } finally { submitLock.current = false }
  }

  return <>
    <Seo title="Afiliación | ADI Curime" description="Solicitud de afiliación a la Asociación de Desarrollo Integral de Curime." />
    <PublicPageHeader title="Solicitud de afiliación" intro="La Asociación revisará la solicitud antes de aprobarla y asignar el rol correspondiente." />
    <SectionContainer>
      <Breadcrumbs current="Afiliación" />
      {isLoading ? <p role="status">Restaurando sesión…</p> : !isAuthenticated || !user ? <AccountRequired /> : success ? <Success /> : (
        <div className="mx-auto grid max-w-3xl gap-6">
          <section className="rounded-surface border border-brand-sage bg-surface-muted p-5" aria-labelledby="account-identity-title">
            <h2 id="account-identity-title" className="font-heading text-heading-3">Identidad de la cuenta</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Identity label="Nombre" value={user.fullName} />
              <Identity label="Identificación" value={user.identification ?? 'No disponible'} />
              <Identity label="Correo" value={user.email} />
              <Identity label="Teléfono" value={[user.phoneCountryCode, user.phoneNationalNumber].filter(Boolean).join(' ') || 'No disponible'} />
            </dl>
            <p className="mt-4 text-sm text-foreground-muted">Estos datos provienen de su cuenta y no pueden cambiarse desde esta solicitud.</p>
          </section>
          <form className="grid gap-5 rounded-surface border border-brand-sage bg-card-white p-6" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={form.formState.isSubmitting}>
            {requestError ? <p role="alert" className="field-error">{requestError}</p> : null}
            <fieldset disabled={form.formState.isSubmitting} className="contents">
              <Field label="Fecha de nacimiento" id="birthDate" error={form.formState.errors.birthDate?.message}><input id="birthDate" type="date" max={new Date().toISOString().slice(0, 10)} {...form.register('birthDate')} /></Field>
              <Field label="Género (opcional)" id="gender" error={form.formState.errors.gender?.message}><input id="gender" maxLength={30} {...form.register('gender')} /></Field>
              <Field label="Dirección" id="address" error={form.formState.errors.address?.message}><input id="address" autoComplete="street-address" maxLength={300} {...form.register('address')} /></Field>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Ocupación (opcional)" id="occupation" error={form.formState.errors.occupation?.message}><input id="occupation" maxLength={100} {...form.register('occupation')} /></Field><Field label="Lugar de trabajo (opcional)" id="workplace" error={form.formState.errors.workplace?.message}><input id="workplace" maxLength={150} {...form.register('workplace')} /></Field></div>
              <Field label="¿Por qué desea afiliarse?" id="affiliationReason" error={form.formState.errors.affiliationReason?.message}><textarea id="affiliationReason" minLength={3} maxLength={1000} {...form.register('affiliationReason')} /></Field>
              <button type="submit" className="primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Enviando solicitud…' : 'Enviar solicitud'}</button>
            </fieldset>
          </form>
        </div>
      )}
    </SectionContainer>
  </>
}

function AccountRequired() { return <section className="mx-auto max-w-2xl rounded-surface border border-brand-sage bg-card-white p-6 shadow-sm" aria-labelledby="affiliation-account-title"><h2 id="affiliation-account-title" className="font-heading text-heading-2 text-brand-ink">Necesita una cuenta para solicitar afiliación</h2><p className="mt-3 text-foreground-muted">Inicie sesión para usar la identidad verificada de su cuenta. Si aún no tiene una, puede crearla ahora.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="primary" to="/login" state={{ from: { pathname: '/afiliacion' } }}>Iniciar sesión</Link><Link className="secondary" to="/register">Crear una cuenta</Link></div></section> }
function Success() { return <section className="mx-auto max-w-2xl rounded-surface border border-success/40 bg-success-bg p-6" aria-labelledby="affiliation-success-title"><h2 id="affiliation-success-title" className="font-heading text-heading-2">Recibimos su solicitud</h2><p className="mt-3">La Asociación se comunicará con usted. No necesita enviar otra solicitud.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="primary" to="/">Volver al inicio</Link><Link className="secondary" to="/contacto">Contactar a la Asociación</Link></div></section> }
function Identity({ label, value }: { label: string; value: string }) { return <div><dt className="text-sm font-semibold text-foreground-muted">{label}</dt><dd className="mt-1 text-brand-ink">{value}</dd></div> }
function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: ReactNode }) { return <div className="grid gap-2"><label className="font-semibold" htmlFor={id}>{label}</label>{children}{error ? <span className="field-error" role="alert">{error}</span> : null}</div> }
