import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, identificationMaxLength, type IdentificationType } from '@/shared/lib/formValidation'
import { affiliationSchema, mapAffiliationFormToRequest, type AffiliationFormValues } from '@/features/affiliate-requests'
import { PhoneField } from '@/shared/ui/forms/PhoneField'
import { Breadcrumbs, PublicPageHeader, SectionContainer, Seo } from '../../components/public/PublicComponents'

const blank: AffiliationFormValues = { firstName: '', firstSurname: '', secondSurname: '', identificationType: 'NATIONAL', identification: '', birthDate: '', gender: '', phoneCountryCode: '', phoneNationalNumber: '', email: '', address: '', occupation: '', workplace: '', affiliationReason: '' }

export function AffiliationPage() {
  const { control, formState: { errors, isSubmitting }, handleSubmit, register, reset, setValue, watch } = useForm<AffiliationFormValues>({
    defaultValues: blank,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(affiliationSchema),
    shouldFocusError: true,
  })
  const identificationType = watch('identificationType')

  async function submit(form: AffiliationFormValues) {
    try {
      await affiliateRequestsService.create(mapAffiliationFormToRequest(form))
      reset(blank)
      toast.success('Solicitud enviada correctamente. La ADI revisará la información.')
    } catch (caught) {
      toast.error(getErrorMessage(caught, 'No fue posible enviar la solicitud.'))
    }
  }

  return <><Seo title="Solicitud de afiliación" description="Solicite su afiliación a la ADI Curime."/><PublicPageHeader title="Solicitud de afiliación" intro="Complete sus datos para que la Asociación revise su solicitud."/><Breadcrumbs current="Afiliación"/><SectionContainer><div className="public-form card"><form className="form-grid" onSubmit={handleSubmit(submit)} noValidate aria-busy={isSubmitting}>
    <fieldset className="form-grid border-0 p-0" disabled={isSubmitting}>
      <label>Nombre<input required maxLength={150} autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? 'first-name-error' : undefined} {...register('firstName')}/>{errors.firstName && <span id="first-name-error" className="field-error" role="alert">{errors.firstName.message}</span>}</label>
      <label>Primer apellido<input required maxLength={150} autoComplete="family-name" aria-invalid={Boolean(errors.firstSurname)} aria-describedby={errors.firstSurname ? 'first-surname-error' : undefined} {...register('firstSurname')}/>{errors.firstSurname && <span id="first-surname-error" className="field-error" role="alert">{errors.firstSurname.message}</span>}</label>
      <label>Segundo apellido (opcional)<input maxLength={150} autoComplete="additional-name" aria-invalid={Boolean(errors.secondSurname)} aria-describedby={errors.secondSurname ? 'second-surname-error' : undefined} {...register('secondSurname')}/>{errors.secondSurname && <span id="second-surname-error" className="field-error" role="alert">{errors.secondSurname.message}</span>}</label>
      <label>Tipo de identificación<select {...register('identificationType', { onChange: (event) => { setValue('identificationType', event.target.value as IdentificationType); setValue('identification', '', { shouldValidate: true }) } })}><option value="NATIONAL">Nacional</option><option value="DIMEX">DIMEX</option></select></label>
      <label>Número de identificación<input type="text" inputMode="numeric" required maxLength={identificationMaxLength(identificationType)} aria-invalid={Boolean(errors.identification)} aria-describedby={errors.identification ? 'identification-error' : undefined} {...register('identification', { onChange: (event) => setValue('identification', digitsOnly(event.target.value, identificationMaxLength(identificationType)), { shouldValidate: false }) })}/>{errors.identification && <span id="identification-error" className="field-error" role="alert">{errors.identification.message}</span>}</label>
      <label>Fecha de nacimiento<input required type="date" max={new Date().toISOString().slice(0, 10)} aria-invalid={Boolean(errors.birthDate)} aria-describedby={errors.birthDate ? 'birth-date-error' : undefined} {...register('birthDate')}/>{errors.birthDate && <span id="birth-date-error" className="field-error" role="alert">{errors.birthDate.message}</span>}</label>
      <label>Género (opcional)<input maxLength={30} aria-invalid={Boolean(errors.gender)} aria-describedby={errors.gender ? 'gender-error' : undefined} {...register('gender')}/>{errors.gender && <span id="gender-error" className="field-error" role="alert">{errors.gender.message}</span>}</label>
      <Controller control={control} name="phoneNationalNumber" render={({ field }) => <PhoneField id="phone-number" label="Teléfono" value={{ countryCode: watch('phoneCountryCode'), nationalNumber: field.value }} error={errors.phoneNationalNumber?.message} disabled={isSubmitting} onChange={({ countryCode, nationalNumber }) => { setValue('phoneCountryCode', countryCode ?? '', { shouldValidate: false }); field.onChange(nationalNumber ?? '') }} />}/>
      <label>Correo (opcional)<input type="email" inputMode="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')}/>{errors.email && <span id="email-error" className="field-error" role="alert">{errors.email.message}</span>}</label>
      <label>Dirección<input required maxLength={300} autoComplete="street-address" aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'address-error' : undefined} {...register('address')}/>{errors.address && <span id="address-error" className="field-error" role="alert">{errors.address.message}</span>}</label>
      <label>Ocupación (opcional)<input maxLength={100} aria-invalid={Boolean(errors.occupation)} aria-describedby={errors.occupation ? 'occupation-error' : undefined} {...register('occupation')}/>{errors.occupation && <span id="occupation-error" className="field-error" role="alert">{errors.occupation.message}</span>}</label>
      <label>Lugar de trabajo (opcional)<input maxLength={150} aria-invalid={Boolean(errors.workplace)} aria-describedby={errors.workplace ? 'workplace-error' : undefined} {...register('workplace')}/>{errors.workplace && <span id="workplace-error" className="field-error" role="alert">{errors.workplace.message}</span>}</label>
      <label>Motivo para afiliarse<textarea required minLength={3} maxLength={1000} aria-invalid={Boolean(errors.affiliationReason)} aria-describedby={errors.affiliationReason ? 'affiliation-reason-error' : undefined} {...register('affiliationReason')}/>{errors.affiliationReason && <span id="affiliation-reason-error" className="field-error" role="alert">{errors.affiliationReason.message}</span>}</label>
      <button className="primary" disabled={isSubmitting}>{isSubmitting ? 'Enviando…' : 'Enviar solicitud'}</button>
    </fieldset>
  </form></div></SectionContainer></>
}
