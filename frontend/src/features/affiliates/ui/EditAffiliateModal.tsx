import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, emailError, fullNameError, identificationError as identificationFormatError, identificationMaxLength, normalizeEmail, normalizeText, phoneError, phoneNationalMaxLength } from '@/shared/lib/formValidation'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Modal } from '@/shared/ui/Modal'
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

export function EditAffiliateModal({ affiliate, onClose }: EditAffiliateModalProps) {
  const [form, setForm] = useState(() => initialForm(affiliate))
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
      onClose()
    } catch (reason) {
      setError(getErrorMessage(reason, 'No fue posible actualizar el afiliado.'))
    }
  }

  return (
    <Modal title="Editar afiliado" onClose={onClose} busy={update.isPending}>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void submit() }}>
        {error && <ErrorState title="No fue posible guardar los cambios" message={error} />}
        <fieldset disabled={update.isPending} className="contents">
          <label>Nombre completo<input required minLength={2} maxLength={150} autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />{fieldErrors.fullName && <span className="field-error" role="alert">{fieldErrors.fullName}</span>}</label>
          <label>Tipo de identificación<select value={form.identificationType} onChange={(event) => setForm({ ...form, identificationType: event.target.value as AffiliateEditForm['identificationType'] })}><option value="">Sin especificar</option><option value="NATIONAL">Cédula nacional</option><option value="DIMEX">DIMEX</option></select></label>
          <label>Identificación<input maxLength={form.identificationType ? identificationMaxLength(form.identificationType) : 50} value={form.identification} onChange={(event) => setForm({ ...form, identification: digitsOnly(event.target.value, form.identificationType ? identificationMaxLength(form.identificationType) : 50) })} />{fieldErrors.identification && <span className="field-error" role="alert">{fieldErrors.identification}</span>}</label>
          <label>Fecha de nacimiento<input required type="date" max={new Date().toISOString().slice(0, 10)} value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></label>
          <label>Género<input maxLength={30} value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} /></label>
          <label>Código país<input maxLength={5} autoComplete="tel-country-code" value={form.phoneCountryCode} onChange={(event) => setForm({ ...form, phoneCountryCode: event.target.value })} /></label>
          <label>Número telefónico<input inputMode="numeric" autoComplete="tel-national" maxLength={phoneNationalMaxLength(form.phoneCountryCode)} value={form.phoneNationalNumber} onChange={(event) => setForm({ ...form, phoneNationalNumber: digitsOnly(event.target.value, phoneNationalMaxLength(form.phoneCountryCode)) })} />{fieldErrors.phone && <span className="field-error" role="alert">{fieldErrors.phone}</span>}</label>
          <label>Correo electrónico<input type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />{fieldErrors.email && <span className="field-error" role="alert">{fieldErrors.email}</span>}</label>
          <label>Dirección<input required maxLength={300} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />{fieldErrors.address && <span className="field-error" role="alert">{fieldErrors.address}</span>}</label>
          <label>Ocupación<input maxLength={100} value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} /></label>
          <label>Lugar de trabajo<input maxLength={150} value={form.workplace} onChange={(event) => setForm({ ...form, workplace: event.target.value })} /></label>
          <label>Tipo de afiliado<input maxLength={100} value={form.affiliateType} onChange={(event) => setForm({ ...form, affiliateType: event.target.value })} /></label>
        </fieldset>
        <div className="actions"><button type="button" onClick={onClose} disabled={update.isPending}>Cancelar</button><button className="primary" disabled={update.isPending}>{update.isPending ? 'Guardando…' : 'Guardar cambios'}</button></div>
      </form>
    </Modal>
  )
}
