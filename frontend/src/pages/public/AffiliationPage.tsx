import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { affiliationSchema, mapAffiliationFormToRequest, type AffiliationFormValues } from '@/features/affiliate-requests'
import { digitsOnly, identificationMaxLength, phoneNationalMaxLength } from '@/shared/lib/formValidation'
import { getErrorMessage } from '@/shared/lib/errors'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'
import { Breadcrumbs, PublicPageHeader, SectionContainer, Seo } from '../../components/public/PublicComponents'

const emptyValues: AffiliationFormValues = {
  identificationType: 'NATIONAL', identification: '', firstName: '', firstSurname: '', secondSurname: '', birthDate: '', gender: '',
  phoneCountryCode: '', phoneNationalNumber: '', email: '', address: '', occupation: '', workplace: '', affiliationReason: '',
}

export function AffiliationPage() {
  const [success, setSuccess] = useState(false)
  const [requestError, setRequestError] = useState('')
  const submitLock = useRef(false)
  const form = useForm<AffiliationFormValues>({ resolver: zodResolver(affiliationSchema), defaultValues: emptyValues, mode: 'onTouched' })

  async function submit(values: AffiliationFormValues) {
    if (submitLock.current) return
    submitLock.current = true
    setRequestError('')
    try {
      await affiliateRequestsService.create(mapAffiliationFormToRequest(values))
      setSuccess(true)
    } catch (error) {
      setRequestError(axios.isAxiosError(error) && error.response?.status === 409
        ? 'Ya existe una afiliación o una solicitud pendiente con estos datos.'
        : getErrorMessage(error, 'No fue posible enviar la solicitud. Intente nuevamente.'))
    } finally { submitLock.current = false }
  }

  return <>
    <Seo title="Afiliación | ADI Curime" description="Solicitud de afiliación a la Asociación de Desarrollo Integral de Curime." />
    <PublicPageHeader title="Solicitud de afiliación" intro="Complete sus datos para que la Asociación revise su solicitud." />
    <SectionContainer>
      <Breadcrumbs current="Afiliación" />
      {success ? <Success /> : (
        <div className="mx-auto grid max-w-3xl gap-6">
          <form className="grid gap-5 rounded-surface border border-brand-sage bg-card-white p-6" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={form.formState.isSubmitting}>
            {requestError ? <p role="alert" className="field-error">{requestError}</p> : null}
            <fieldset disabled={form.formState.isSubmitting} className="contents">
              <section className="grid gap-5" aria-labelledby="identity-title">
                <h2 id="identity-title" className="font-heading text-heading-3">Datos de identidad</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Tipo de identificación" id="identificationType" error={form.formState.errors.identificationType?.message}><select id="identificationType" {...form.register('identificationType')}><option value="NATIONAL">Cédula nacional</option><option value="DIMEX">DIMEX</option></select></Field>
                  <Field label="Número de identificación" id="identification" error={form.formState.errors.identification?.message}><input id="identification" inputMode="numeric" autoComplete="off" maxLength={identificationMaxLength(form.watch('identificationType'))} {...form.register('identification', { onChange: (event) => { event.target.value = digitsOnly(event.target.value, identificationMaxLength(form.getValues('identificationType'))) } })} /></Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2"><Field label="Nombre" id="firstName" error={form.formState.errors.firstName?.message}><input id="firstName" autoComplete="given-name" maxLength={150} {...form.register('firstName')} /></Field><Field label="Primer apellido" id="firstSurname" error={form.formState.errors.firstSurname?.message}><input id="firstSurname" autoComplete="family-name" maxLength={150} {...form.register('firstSurname')} /></Field></div>
                <Field label="Segundo apellido (opcional)" id="secondSurname" error={form.formState.errors.secondSurname?.message}><input id="secondSurname" autoComplete="additional-name" maxLength={150} {...form.register('secondSurname')} /></Field>
              </section>
              <section className="grid gap-5 border-t border-brand-sage pt-5" aria-labelledby="contact-title">
                <h2 id="contact-title" className="font-heading text-heading-3">Contacto</h2>
                <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><Field label="Código de país (opcional)" id="phoneCountryCode" error={form.formState.errors.phoneCountryCode?.message}><input id="phoneCountryCode" inputMode="tel" autoComplete="tel-country-code" placeholder="+506" maxLength={5} {...form.register('phoneCountryCode')} /></Field><Field label="Teléfono (opcional)" id="phoneNationalNumber" error={form.formState.errors.phoneNationalNumber?.message}><input id="phoneNationalNumber" inputMode="tel" autoComplete="tel-national" maxLength={phoneNationalMaxLength(form.watch('phoneCountryCode'))} {...form.register('phoneNationalNumber', { onChange: (event) => { event.target.value = digitsOnly(event.target.value, phoneNationalMaxLength(form.getValues('phoneCountryCode'))) } })} /></Field></div>
                <p className="-mt-3 text-sm text-foreground-muted">Si indica teléfono, complete ambos campos.</p>
                <Field label="Correo electrónico (opcional)" id="email" error={form.formState.errors.email?.message}><input id="email" type="email" autoComplete="email" maxLength={254} {...form.register('email')} /></Field>
              </section>
              <section className="grid gap-5 border-t border-brand-sage pt-5" aria-labelledby="application-title">
                <h2 id="application-title" className="font-heading text-heading-3">Solicitud</h2>
              <Field label="Fecha de nacimiento" id="birthDate" error={form.formState.errors.birthDate?.message}><input id="birthDate" type="date" max={new Date().toISOString().slice(0, 10)} {...form.register('birthDate')} /></Field>
              <Field label="Género (opcional)" id="gender" error={form.formState.errors.gender?.message}><input id="gender" maxLength={30} {...form.register('gender')} /></Field>
              <Field label="Dirección" id="address" error={form.formState.errors.address?.message}><input id="address" autoComplete="street-address" maxLength={300} {...form.register('address')} /></Field>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Ocupación (opcional)" id="occupation" error={form.formState.errors.occupation?.message}><input id="occupation" maxLength={100} {...form.register('occupation')} /></Field><Field label="Lugar de trabajo (opcional)" id="workplace" error={form.formState.errors.workplace?.message}><input id="workplace" maxLength={150} {...form.register('workplace')} /></Field></div>
              <Field label="¿Por qué desea afiliarse?" id="affiliationReason" error={form.formState.errors.affiliationReason?.message}><textarea id="affiliationReason" minLength={3} maxLength={1000} {...form.register('affiliationReason')} /></Field>
              </section>
              <button type="submit" className="primary" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Enviando solicitud…' : 'Enviar solicitud'}</button>
            </fieldset>
          </form>
        </div>
      )}
    </SectionContainer>
  </>
}

function Success() { return <section className="mx-auto max-w-2xl rounded-surface border border-success/40 bg-success-bg p-6" aria-labelledby="affiliation-success-title"><h2 id="affiliation-success-title" className="font-heading text-heading-2">Recibimos su solicitud</h2><p className="mt-3">La Asociación se comunicará con usted. No necesita enviar otra solicitud.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="primary" to="/">Volver al inicio</Link><Link className="secondary" to="/contacto">Contactar a la Asociación</Link></div></section> }
function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: ReactNode }) { return <div className="grid gap-2"><label className="font-semibold" htmlFor={id}>{label}</label>{children}{error ? <span className="field-error" role="alert">{error}</span> : null}</div> }
