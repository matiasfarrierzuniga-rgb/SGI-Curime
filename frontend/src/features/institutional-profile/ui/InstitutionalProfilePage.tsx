import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { emailError, normalizeEmail, normalizeText } from '@/shared/lib/formValidation'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { useInstitutionalProfile, useUpdateInstitutionalProfile } from '../hooks/institutionalProfile.queries'
import type { InstitutionalOrganizationType, UpdateInstitutionalProfileInput } from '../model/institutionalProfile.types'

type TextField = Exclude<keyof UpdateInstitutionalProfileInput, 'organizationType'>
type FormState = Record<TextField, string> & { organizationType: '' | InstitutionalOrganizationType }
type SaveState = 'DEFAULT' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'
const emptyForm: FormState = { legalName: '', legalIdentification: '', dinadecoRegistrationCode: '', dinadecoRegion: '', organizationType: '', province: '', canton: '', district: '', locality: '', correspondenceAddress: '', phone: '', telefax: '', email: '' }

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
  const { user } = useAuth()
  const canUpdate = hasCapability(user?.permissionCodes, 'adm.institutional-profile.update')
  const update = useUpdateInstitutionalProfile()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [emailMessage, setEmailMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [success, setSuccess] = useState('')
  const saveState: SaveState = update.isPending ? 'SUBMITTING' : requestError ? 'ERROR' : success ? 'SUCCESS' : 'DEFAULT'

  useEffect(() => { if (profile.data) setForm(toForm(profile.data)) }, [profile.data])
  const setField = (field: keyof FormState, value: string) => { setForm(current => ({ ...current, [field]: value })); setSuccess('') }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canUpdate || update.isPending) return
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

  return <PageContainer className="space-y-6 lg:space-y-8">
    <PageHeader context="Gestión administrativa" title="Perfil institucional" description="Administre la fuente canónica de los datos legales e institucionales de la Asociación." />
    {profile.isPending ? <LoadingState label="Cargando perfil institucional..." /> : null}
    {profile.isError ? <ErrorState title="No fue posible cargar el perfil institucional" message={getErrorMessage(profile.error)} action={<Button type="button" variant="outline" onClick={() => void profile.refetch()}>Reintentar</Button>} /> : null}
    {profile.data ? <Card className="shadow-elevation-1">
      <CardHeader className="border-b border-border-subtle">
        <CardTitle>Datos institucionales</CardTitle>
        <CardDescription>Todos los campos son opcionales. Un campo vacío indica que el dato todavía no ha sido validado o cargado por la Asociación.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 sm:pt-8">
        <form className="space-y-8" onSubmit={submit} noValidate>
          {saveState === 'ERROR' ? <ErrorState title="No fue posible guardar los cambios" message={requestError} /> : null}
          {saveState === 'SUCCESS' ? <Alert className="border-status-success-border bg-status-success-surface text-status-success" role="status"><CheckCircle2 aria-hidden="true" /><AlertTitle>Datos guardados</AlertTitle><AlertDescription className="text-status-success">{success}</AlertDescription></Alert> : null}
           {!canUpdate ? <p className="rounded-control border border-border bg-surface-subtle p-3 text-sm text-foreground-muted">Tiene acceso de consulta. Guardar cambios requiere permiso de actualización.</p> : null}
           <fieldset className="space-y-8" disabled={!canUpdate || saveState === 'SUBMITTING'}>
            <legend className="sr-only">Información institucional</legend>
            <FormSection headingId="legal-identity-heading" title="Identificación legal" description="Datos que identifican formalmente a la Asociación ante entidades y registros.">
              <FormField id="legalName" label={<><span>Nombre legal</span> <Optional /></>}>
                <Input maxLength={200} value={form.legalName} onChange={event => setField('legalName', event.target.value)} placeholder="Sin validar o cargar" autoComplete="organization" />
              </FormField>
              <div className="grid gap-5 md:grid-cols-2">
                <TextFieldControl id="legalIdentification" label="Cédula jurídica" value={form.legalIdentification} maxLength={80} onChange={value => setField('legalIdentification', value)} />
                <FormField id="organizationType" label={<><span>Tipo de asociación</span> <Optional /></>}>
                  <Select value={form.organizationType} onChange={event => setField('organizationType', event.target.value)}><option value="">Sin validar o cargar</option><option value="INTEGRAL">Integral</option><option value="SPECIFIC">Específica</option></Select>
                </FormField>
              </div>
            </FormSection>
            <FormSection headingId="dinadeco-heading" title="Registro DINADECO" description="Información de inscripción y referencia administrativa vigente.">
              <div className="grid gap-5 md:grid-cols-2">
                <TextFieldControl id="dinadecoRegistrationCode" label="Código o registro DINADECO" value={form.dinadecoRegistrationCode} maxLength={80} onChange={value => setField('dinadecoRegistrationCode', value)} />
                <TextFieldControl id="dinadecoRegion" label="Región o Dirección Regional" value={form.dinadecoRegion} maxLength={150} onChange={value => setField('dinadecoRegion', value)} />
              </div>
            </FormSection>
            <FormSection headingId="location-heading" title="Ubicación" description="Referencia territorial y dirección usada para la correspondencia institucional.">
              <div className="grid gap-5 md:grid-cols-2">
                <TextFieldControl id="province" label="Provincia" value={form.province} maxLength={100} onChange={value => setField('province', value)} />
                <TextFieldControl id="canton" label="Cantón" value={form.canton} maxLength={100} onChange={value => setField('canton', value)} />
                <TextFieldControl id="district" label="Distrito" value={form.district} maxLength={100} onChange={value => setField('district', value)} />
                <TextFieldControl id="locality" label="Localidad" value={form.locality} maxLength={150} onChange={value => setField('locality', value)} />
              </div>
              <FormField id="correspondenceAddress" label={<><span>Dirección de correspondencia</span> <Optional /></>}>
                <Textarea maxLength={500} value={form.correspondenceAddress} onChange={event => setField('correspondenceAddress', event.target.value)} placeholder="Sin validar o cargar" autoComplete="street-address" />
              </FormField>
            </FormSection>
            <FormSection headingId="contact-heading" title="Contacto institucional" description="Canales oficiales para la comunicación con la Asociación.">
              <div className="grid gap-5 md:grid-cols-2">
                <TextFieldControl id="phone" label="Teléfono" value={form.phone} maxLength={50} onChange={value => setField('phone', value)} inputMode="tel" autoComplete="tel" />
                <TextFieldControl id="telefax" label="Telefax" value={form.telefax} maxLength={50} onChange={value => setField('telefax', value)} inputMode="tel" />
              </div>
              <FormField id="email" label={<><span>Correo institucional</span> <Optional /></>} description="Use correo oficial de la Asociación." error={emailMessage}>
                <Input type="email" autoComplete="email" maxLength={254} value={form.email} onChange={event => setField('email', event.target.value)} placeholder="Sin validar o cargar" />
              </FormField>
            </FormSection>
          </fieldset>
          <div className="flex justify-stretch border-t border-border-subtle pt-6 sm:justify-end">
             <Button type="submit" className="w-full sm:min-w-48 sm:w-auto" loading={saveState === 'SUBMITTING'} disabled={!canUpdate || saveState === 'SUBMITTING'}>{saveState === 'SUBMITTING' ? 'Guardando cambios…' : 'Guardar cambios'}</Button>
          </div>
        </form>
      </CardContent>
    </Card> : null}
  </PageContainer>
}

function Optional() { return <span className="font-normal text-foreground-muted">(opcional)</span> }
function FormSection({ headingId, title, description, children }: { headingId: string; title: string; description: string; children: ReactNode }) {
  return <section className="border-b border-border-subtle pb-8 last:border-b-0 last:pb-0" aria-labelledby={headingId}>
    <div className="mb-5 max-w-2xl">
      <h2 id={headingId} className="text-heading-3 font-semibold text-text-primary">{title}</h2>
      <p className="mt-1 text-body-small text-text-secondary">{description}</p>
    </div>
    <div className="space-y-5">{children}</div>
  </section>
}
function TextFieldControl({ id, label, value, maxLength, onChange, inputMode, autoComplete }: { id: TextField; label: string; value: string; maxLength: number; onChange: (value: string) => void; inputMode?: 'tel'; autoComplete?: string }) {
  return <FormField id={id} label={<><span>{label}</span> <Optional /></>}>
    <Input maxLength={maxLength} value={value} onChange={event => onChange(event.target.value)} placeholder="Sin validar o cargar" inputMode={inputMode} autoComplete={autoComplete} />
  </FormField>
}
