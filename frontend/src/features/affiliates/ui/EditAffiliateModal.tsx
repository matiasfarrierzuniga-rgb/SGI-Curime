import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, emailError, fullNameError, identificationError as identificationFormatError, identificationMaxLength, normalizeEmail, normalizeText, phoneError, phoneNationalMaxLength } from '@/shared/lib/formValidation'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Modal } from '@/shared/ui/Modal'
import { toast } from '@/shared/ui/Toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { useAffiliateMutations } from '../hooks/useAffiliatesQueries'
import type { Affiliate, AffiliateUpdate } from '../model/affiliates.types'

type AffiliateEditForm = {
  fullName: string
  identificationType: '' | 'NATIONAL' | 'DIMEX'
  identification: string
  birthDate: string
  gender: string
  phoneCountryCode: string
  phoneNationalNumber: string
  email: string
  address: string
  occupation: string
  workplace: string
  affiliateType: string
}

type EditAffiliateModalProps = {
  affiliate: Affiliate
  onClose: () => void
}

function initialForm(affiliate: Affiliate): AffiliateEditForm {
  return {
    fullName: affiliate.fullName,
    identificationType: affiliate.identificationType ?? '',
    identification: affiliate.identification,
    birthDate: affiliate.birthDate.slice(0, 10),
    gender: affiliate.gender ?? '',
    phoneCountryCode: affiliate.phoneCountryCode ?? '',
    phoneNationalNumber: affiliate.phoneNationalNumber ?? '',
    email: affiliate.email ?? '',
    address: affiliate.address,
    occupation: affiliate.occupation ?? '',
    workplace: affiliate.workplace ?? '',
    affiliateType: affiliate.affiliateType ?? '',
  }
}

function toPayload(form: AffiliateEditForm): AffiliateUpdate {
  const identification = normalizeText(form.identification)
  const hasIdentificationPair = Boolean(form.identificationType && identification)

  return {
    fullName: normalizeText(form.fullName),
    identificationType: hasIdentificationPair ? form.identificationType || undefined : undefined,
    identification: hasIdentificationPair ? identification : undefined,
    birthDate: form.birthDate || undefined,
    gender: normalizeText(form.gender) || undefined,
    phoneCountryCode: normalizeText(form.phoneCountryCode) || undefined,
    phoneNationalNumber: form.phoneNationalNumber || undefined,
    email: form.email ? normalizeEmail(form.email) : undefined,
    address: normalizeText(form.address),
    occupation: normalizeText(form.occupation) || undefined,
    workplace: normalizeText(form.workplace) || undefined,
    affiliateType: normalizeText(form.affiliateType) || undefined,
  }
}

function affiliatePhoneError(countryCode: string, nationalNumber: string) {
  const code = normalizeText(countryCode)
  const number = nationalNumber.trim()

  if (!code && !number) return ''
  if (!code || !number) return 'Ingrese código de país y número telefónico juntos.'
  return phoneError(code, number)
}

function validate(form: AffiliateEditForm) {
  const identification = normalizeText(form.identification)
  const identificationError = form.identificationType && identification
    ? identificationFormatError(form.identificationType, identification)
    : form.identificationType
      ? 'Ingrese una identificación para el tipo seleccionado.'
      : identification
        ? 'Seleccione el tipo de identificación.'
        : ''

  return {
    fullName: fullNameError(form.fullName),
    identification: identificationError,
    email: form.email ? emailError(form.email) : '',
    phone: affiliatePhoneError(form.phoneCountryCode, form.phoneNationalNumber),
    address: normalizeText(form.address) ? '' : 'La dirección es requerida.',
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="text-caption font-medium text-status-danger" role="alert">{message}</span> : null
}

export function EditAffiliateModal({ affiliate, onClose }: EditAffiliateModalProps) {
  const [form, setForm] = useState(() => initialForm(affiliate))
  const [birthDateMaximum] = useState(() => new Date().toISOString().slice(0, 10))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const { update } = useAffiliateMutations()

  const submit = async () => {
    if (update.isPending) return
    const nextErrors = validate(form)
    setFieldErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setError('')
    try {
      await update.mutateAsync({ id: affiliate.id, payload: toPayload(form) })
      toast.success('Cambios del afiliado guardados.')
      onClose()
    } catch (reason) {
      setError(getErrorMessage(reason, 'No fue posible actualizar el afiliado.'))
    }
  }

  return (
    <Modal title="Editar afiliado" onClose={onClose} busy={update.isPending}>
      <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); void submit() }}>
        {error && <ErrorState title="No fue posible guardar los cambios" message={error} />}
        <fieldset disabled={update.isPending} className="space-y-6">
          <legend className="sr-only">Datos editables del afiliado</legend>
          <section aria-labelledby="identity-heading" className="space-y-4"><div><h3 id="identity-heading" className="text-heading-3 font-semibold text-text-primary">Identificación personal</h3><p className="mt-1 text-body-small text-text-secondary">Datos requeridos para reconocer el expediente.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-label font-semibold text-text-primary sm:col-span-2">Nombre completo<Input required minLength={2} maxLength={150} autoComplete="name" value={form.fullName} aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /><FieldError id="fullName-error" message={fieldErrors.fullName} /></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary">Tipo de identificación<Select value={form.identificationType} onChange={(event) => setForm({ ...form, identificationType: event.target.value as AffiliateEditForm['identificationType'] })}><option value="">Sin especificar</option><option value="NATIONAL">Cédula nacional</option><option value="DIMEX">DIMEX</option></Select></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary">Identificación<Input maxLength={form.identificationType ? identificationMaxLength(form.identificationType) : 50} value={form.identification} aria-invalid={Boolean(fieldErrors.identification)} aria-describedby={fieldErrors.identification ? 'identification-error' : undefined} onChange={(event) => setForm({ ...form, identification: digitsOnly(event.target.value, form.identificationType ? identificationMaxLength(form.identificationType) : 50) })} /><FieldError id="identification-error" message={fieldErrors.identification} /></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary">Fecha de nacimiento<Input required type="date" max={birthDateMaximum} value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary">Género<Input maxLength={30} value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} /></label></div></section>
          <section aria-labelledby="contact-heading" className="space-y-4 border-t border-border-default pt-5"><div><h3 id="contact-heading" className="text-heading-3 font-semibold text-text-primary">Contacto</h3><p className="mt-1 text-body-small text-text-secondary">Teléfono y correo para comunicaciones administrativas.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-label font-semibold text-text-primary">Código país<Input maxLength={5} autoComplete="tel-country-code" value={form.phoneCountryCode} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined} onChange={(event) => setForm({ ...form, phoneCountryCode: event.target.value })} /></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary">Número telefónico<Input inputMode="numeric" autoComplete="tel-national" maxLength={phoneNationalMaxLength(form.phoneCountryCode)} value={form.phoneNationalNumber} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined} onChange={(event) => setForm({ ...form, phoneNationalNumber: digitsOnly(event.target.value, phoneNationalMaxLength(form.phoneCountryCode)) })} /><FieldError id="phone-error" message={fieldErrors.phone} /></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary sm:col-span-2">Correo electrónico<Input type="email" maxLength={254} autoComplete="email" value={form.email} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} onChange={(event) => setForm({ ...form, email: event.target.value })} /><FieldError id="email-error" message={fieldErrors.email} /></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary sm:col-span-2">Dirección<Input required maxLength={300} value={form.address} aria-invalid={Boolean(fieldErrors.address)} aria-describedby={fieldErrors.address ? 'address-error' : undefined} onChange={(event) => setForm({ ...form, address: event.target.value })} /><FieldError id="address-error" message={fieldErrors.address} /></label></div></section>
          <section aria-labelledby="affiliation-heading" className="space-y-4 border-t border-border-default pt-5"><div><h3 id="affiliation-heading" className="text-heading-3 font-semibold text-text-primary">Actividad y afiliación</h3><p className="mt-1 text-body-small text-text-secondary">Información complementaria del registro administrativo.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-label font-semibold text-text-primary">Ocupación<Input maxLength={100} value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} /></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary">Lugar de trabajo<Input maxLength={150} value={form.workplace} onChange={(event) => setForm({ ...form, workplace: event.target.value })} /></label><label className="flex flex-col gap-2 text-label font-semibold text-text-primary sm:col-span-2">Tipo de afiliado<Input maxLength={100} value={form.affiliateType} onChange={(event) => setForm({ ...form, affiliateType: event.target.value })} /></label></div></section>
        </fieldset>
        <div className="flex flex-col-reverse gap-3 border-t border-border-default pt-5 sm:flex-row sm:justify-end"><Button variant="outline" type="button" onClick={onClose} disabled={update.isPending}>Cancelar</Button><Button type="submit" disabled={update.isPending}>{update.isPending ? 'Guardando…' : 'Guardar cambios'}</Button></div>
      </form>
    </Modal>
  )
}
