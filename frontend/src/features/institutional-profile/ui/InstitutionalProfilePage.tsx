import { useEffect, useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { emailError, normalizeEmail, normalizeText } from '@/shared/lib/formValidation'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { useInstitutionalProfile, useUpdateInstitutionalProfile } from '../hooks/institutionalProfile.queries'
import type { InstitutionalOrganizationType, UpdateInstitutionalProfileInput } from '../model/institutionalProfile.types'

type TextField = Exclude<keyof UpdateInstitutionalProfileInput, 'organizationType'>
type FormState = Record<TextField, string> & { organizationType: '' | InstitutionalOrganizationType }
const emptyForm: FormState = { legalName: '', legalIdentification: '', dinadecoRegistrationCode: '', dinadecoRegion: '', organizationType: '', province: '', canton: '', district: '', locality: '', correspondenceAddress: '', phone: '', telefax: '', email: '' }
const shortFields = [
  ['legalName', 'Nombre legal', 200], ['legalIdentification', 'Cédula jurídica', 80],
  ['dinadecoRegistrationCode', 'Código o registro DINADECO', 80], ['dinadecoRegion', 'Región o Dirección Regional', 150],
  ['province', 'Provincia', 100], ['canton', 'Cantón', 100], ['district', 'Distrito', 100],
  ['locality', 'Localidad', 150], ['phone', 'Teléfono', 50], ['telefax', 'Telefax', 50],
] as const satisfies ReadonlyArray<readonly [TextField, string, number]>

function toForm(profile: UpdateInstitutionalProfileInput): FormState {
  return Object.fromEntries(Object.keys(emptyForm).map(key => [key, profile[key as keyof UpdateInstitutionalProfileInput] ?? ''])) as FormState
}

function toPayload(form: FormState): UpdateInstitutionalProfileInput {
  const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, normalizeText(value) || null])) as UpdateInstitutionalProfileInput
  payload.email = form.email ? normalizeEmail(form.email) : null
  payload.organizationType = form.organizationType || null
  return payload
}

export function InstitutionalProfilePage() {
  const profile = useInstitutionalProfile()
  const update = useUpdateInstitutionalProfile()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [emailMessage, setEmailMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { if (profile.data) setForm(toForm(profile.data)) }, [profile.data])
  const setField = (field: keyof FormState, value: string) => { setForm(current => ({ ...current, [field]: value })); setSuccess('') }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (update.isPending) return
    const nextEmailError = form.email ? emailError(form.email) : ''
    setEmailMessage(nextEmailError)
    if (nextEmailError) return
    setRequestError('')
    setSuccess('')
    try {
      const saved = await update.mutateAsync(toPayload(form))
      setForm(toForm(saved))
      setSuccess('Perfil institucional guardado correctamente.')
    } catch (reason) {
      setRequestError(getErrorMessage(reason, 'No fue posible guardar el perfil institucional.'))
    }
  }

  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title="Perfil institucional" description="Administre la fuente canónica de los datos legales e institucionales de la Asociación." />
    {profile.isPending ? <LoadingState label="Cargando perfil institucional..." /> : null}
    {profile.isError ? <ErrorState title="No fue posible cargar el perfil institucional" message={getErrorMessage(profile.error)} action={<Button type="button" variant="outline" onClick={() => void profile.refetch()}>Reintentar</Button>} /> : null}
    {profile.data ? <Card>
      <CardHeader>
        <CardTitle>Datos institucionales</CardTitle>
        <CardDescription>Todos los campos son opcionales. Un campo vacío indica que el dato todavía no ha sido validado o cargado por la Asociación.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={submit} noValidate>
          {requestError ? <ErrorState title="No fue posible guardar los cambios" message={requestError} /> : null}
          {success ? <div className="rounded-control border border-status-success/30 bg-status-success-surface p-3 text-sm text-status-success" role="status">{success}</div> : null}
          <fieldset className="grid gap-5 md:grid-cols-2" disabled={update.isPending}>
            <legend className="sr-only">Información institucional</legend>
            {shortFields.slice(0, 4).map(([key, label, maxLength]) => <Field key={key} id={key} label={label} value={form[key]} maxLength={maxLength} onChange={value => setField(key, value)} />)}
            <label className="grid gap-2 text-sm font-semibold" htmlFor="organizationType">Tipo de asociación <Optional /><Select id="organizationType" value={form.organizationType} onChange={event => setField('organizationType', event.target.value)}><option value="">Sin validar o cargar</option><option value="INTEGRAL">Integral</option><option value="SPECIFIC">Específica</option></Select></label>
            {shortFields.slice(4).map(([key, label, maxLength]) => <Field key={key} id={key} label={label} value={form[key]} maxLength={maxLength} onChange={value => setField(key, value)} />)}
            <label className="grid gap-2 text-sm font-semibold md:col-span-2" htmlFor="correspondenceAddress">Dirección de correspondencia <Optional /><Textarea id="correspondenceAddress" maxLength={500} value={form.correspondenceAddress} onChange={event => setField('correspondenceAddress', event.target.value)} placeholder="Sin validar o cargar" /></label>
            <label className="grid gap-2 text-sm font-semibold md:col-span-2" htmlFor="email">Correo institucional <Optional /><Input id="email" type="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(emailMessage)} aria-describedby={emailMessage ? 'email-error' : undefined} value={form.email} onChange={event => setField('email', event.target.value)} placeholder="Sin validar o cargar" />{emailMessage ? <span id="email-error" className="text-sm text-destructive" role="alert">{emailMessage}</span> : null}</label>
          </fieldset>
          <div className="flex justify-end"><Button type="submit" disabled={update.isPending}>{update.isPending ? 'Guardando…' : 'Guardar perfil'}</Button></div>
        </form>
      </CardContent>
    </Card> : null}
  </section>
}

function Optional() { return <span className="font-normal text-foreground-muted">(opcional)</span> }
function Field({ id, label, value, maxLength, onChange }: { id: TextField; label: string; value: string; maxLength: number; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-semibold" htmlFor={id}>{label} <Optional /><Input id={id} maxLength={maxLength} value={value} onChange={event => onChange(event.target.value)} placeholder="Sin validar o cargar" /></label>
}
