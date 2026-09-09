import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, identificationMaxLength, type IdentificationType } from '@/shared/lib/formValidation'
import { affiliationSchema, mapAffiliationFormToRequest, type AffiliationFormValues } from '@/features/affiliate-requests'
import { PhoneField } from '@/shared/ui/forms/PhoneField'
import { Breadcrumbs, PublicPageHeader, SectionContainer, Seo } from '../../components/public/PublicComponents'

const blank: AffiliationFormValues = { firstName: '', firstSurname: '', secondSurname: '', identificationType: 'NATIONAL', identification: '', birthDate: '', gender: '', phoneCountryCode: '', phoneNationalNumber: '', email: '', address: '', occupation: '', workplace: '', affiliationReason: '' }

export function AffiliationPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submissionError, setSubmissionError] = useState('')
  const { control, formState: { errors, isSubmitting }, handleSubmit, register, reset, setValue, watch } = useForm<AffiliationFormValues>({
    defaultValues: blank,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(affiliationSchema),
    shouldFocusError: true,
  })
  const identificationType = watch('identificationType')

  async function submit(form: AffiliationFormValues) {
    setSubmissionError('')
    try {
      await affiliateRequestsService.create(mapAffiliationFormToRequest(form))
      reset(blank)
      setSubmitted(true)
    } catch (caught) {
      const isConflict = axios.isAxiosError(caught) && caught.response?.status === 409
      setSubmissionError(isConflict
        ? 'Ya existe una afiliación o una solicitud pendiente con estos datos. Si necesita ayuda, comuníquese con la Asociación.'
        : getErrorMessage(caught, 'No fue posible enviar la solicitud. Revise los datos e inténtelo de nuevo.'))
    }
  }

  return <><Seo title="Solicitud de afiliación" description="Solicite su afiliación a la ADI Curime."/><PublicPageHeader title="Solicitud de afiliación" intro="Envíe sus datos para solicitar ser parte de la Asociación de Desarrollo Integral de Curime."/><Breadcrumbs current="Afiliación"/><SectionContainer><div className="public-form card">
    {submitted ? <section className="form-grid" aria-labelledby="affiliation-success-title" role="status">
      <div className="message success">
        <h2 id="affiliation-success-title">Recibimos su solicitud</h2>
        <p>La Asociación revisará la información. Si necesita confirmar algún dato, se comunicará con usted usando el teléfono o correo, si los proporcionó.</p>
        <p>No necesita enviar otra solicitud mientras espera la revisión.</p>
      </div>
      <div className="actions"><Link className="button" to="/">Volver al inicio</Link><Link className="button button-ghost" to="/contacto">Contactar a la Asociación</Link></div>
    </section> : <form className="form-grid" onSubmit={handleSubmit(submit)} noValidate aria-busy={isSubmitting}>
    <div>
      <h2>Datos para la solicitud</h2>
      <p className="muted">Los campos marcados como opcionales pueden dejarse vacíos. Al enviar, la Asociación revisará la solicitud antes de aprobarla.</p>
    </div>
    {submissionError && <div className="message error" role="alert"><strong>No pudimos enviar la solicitud.</strong><p>{submissionError}</p></div>}
    <fieldset className="form-grid border-0 p-0" disabled={isSubmitting}>
      <label>Nombre<input required maxLength={150} autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? 'first-name-error' : undefined} {...register('firstName')}/>{errors.firstName && <span id="first-name-error" className="field-error" role="alert">{errors.firstName.message}</span>}</label>
      <label>Primer apellido<input required maxLength={150} autoComplete="family-name" aria-invalid={Boolean(errors.firstSurname)} aria-describedby={errors.firstSurname ? 'first-surname-error' : undefined} {...register('firstSurname')}/>{errors.firstSurname && <span id="first-surname-error" className="field-error" role="alert">{errors.firstSurname.message}</span>}</label>
      <label>Segundo apellido (opcional)<input maxLength={150} autoComplete="additional-name" aria-invalid={Boolean(errors.secondSurname)} aria-describedby={errors.secondSurname ? 'second-surname-error' : undefined} {...register('secondSurname')}/>{errors.secondSurname && <span id="second-surname-error" className="field-error" role="alert">{errors.secondSurname.message}</span>}</label>
      <label>Tipo de identificación<select {...register('identificationType', { onChange: (event) => { setValue('identificationType', event.target.value as IdentificationType); setValue('identification', '', { shouldValidate: true }) } })}><option value="NATIONAL">Nacional</option><option value="DIMEX">DIMEX</option></select></label>
      <label>Número de identificación<input type="text" inputMode="numeric" required maxLength={identificationMaxLength(identificationType)} aria-invalid={Boolean(errors.identification)} aria-describedby={errors.identification ? 'identification-error' : undefined} {...register('identification', { onChange: (event) => setValue('identification', digitsOnly(event.target.value, identificationMaxLength(identificationType)), { shouldValidate: false }) })}/>{errors.identification && <span id="identification-error" className="field-error" role="alert">{errors.identification.message}</span>}</label>
      <label>Fecha de nacimiento<input required type="date" max={new Date().toISOString().slice(0, 10)} aria-invalid={Boolean(errors.birthDate)} aria-describedby={errors.birthDate ? 'birth-date-error' : undefined} {...register('birthDate')}/>{errors.birthDate && <span id="birth-date-error" className="field-error" role="alert">{errors.birthDate.message}</span>}</label>
      <Controller control={control} name="phoneNationalNumber" render={({ field }) => <PhoneField id="phone-number" label="Teléfono" value={{ countryCode: watch('phoneCountryCode'), nationalNumber: field.value }} error={errors.phoneNationalNumber?.message} disabled={isSubmitting} onChange={({ countryCode, nationalNumber }) => { setValue('phoneCountryCode', countryCode ?? '', { shouldValidate: false }); field.onChange(nationalNumber ?? '') }} />}/>
      <label>Correo (opcional)<input type="email" inputMode="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')}/>{errors.email && <span id="email-error" className="field-error" role="alert">{errors.email.message}</span>}</label>
      <label>Dirección<input required maxLength={300} autoComplete="street-address" aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'address-error' : undefined} {...register('address')}/>{errors.address && <span id="address-error" className="field-error" role="alert">{errors.address.message}</span>}</label>
      <div className="form-grid">
        <label htmlFor="affiliation-reason">¿Por qué desea afiliarse?</label>
        <textarea id="affiliation-reason" required minLength={3} maxLength={1000} aria-invalid={Boolean(errors.affiliationReason)} aria-describedby={errors.affiliationReason ? 'affiliation-reason-error affiliation-reason-help' : 'affiliation-reason-help'} {...register('affiliationReason')}/>
        <span id="affiliation-reason-help" className="muted">Cuéntenos brevemente cómo le gustaría participar en la comunidad.</span>
        {errors.affiliationReason && <span id="affiliation-reason-error" className="field-error" role="alert">{errors.affiliationReason.message}</span>}
      </div>
      <button type="submit" className="primary" disabled={isSubmitting}>{isSubmitting ? 'Enviando solicitud…' : 'Enviar solicitud'}</button>
    </fieldset>
  </form>}</div></SectionContainer></>
}
