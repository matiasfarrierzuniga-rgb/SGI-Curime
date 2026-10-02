import { CheckCircle2, Pencil } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { emailError, normalizeEmail, normalizeText } from '@/shared/lib/formValidation'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { FormField } from '@/shared/ui/FormField'
import { FormSection } from '@/shared/ui/FormSection'
import { FormStepper, type FormStepperStep } from '@/shared/ui/FormStepper'
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
const formSteps: readonly FormStepperStep[] = [
  { title: 'Identificación legal', description: 'Datos formales de la Asociación.' },
  { title: 'Registro DINADECO', description: 'Inscripción y referencia administrativa.' },
  { title: 'Ubicación', description: 'Referencia territorial y correspondencia.' },
  { title: 'Contacto institucional', description: 'Canales oficiales de comunicación.' },
]

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
  const [isEditing, setIsEditing] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<ReadonlySet<number>>(() => new Set([0]))
  const saveState: SaveState = update.isPending ? 'SUBMITTING' : requestError ? 'ERROR' : success ? 'SUCCESS' : 'DEFAULT'

  useEffect(() => { if (profile.data) setForm(toForm(profile.data)) }, [profile.data])
  const setField = (field: keyof FormState, value: string) => { setForm(current => ({ ...current, [field]: value })); setSuccess(''); setRequestError('') }
  const cancel = () => {
    if (profile.data) setForm(toForm(profile.data))
    setEmailMessage('')
    setRequestError('')
    setSuccess('')
    setActiveStep(0)
    setVisitedSteps(new Set([0]))
    setIsEditing(false)
  }
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
      setActiveStep(0)
      setVisitedSteps(new Set([0]))
      setIsEditing(false)
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Datos institucionales</CardTitle>
            <CardDescription>Todos los campos son opcionales. Un campo vacío indica que el dato todavía no ha sido validado o cargado por la Asociación.</CardDescription>
          </div>
          {canUpdate && !isEditing ? <Button type="button" variant="outline" onClick={() => { setSuccess(''); setRequestError(''); setEmailMessage(''); setActiveStep(0); setVisitedSteps(new Set([0])); setIsEditing(true) }}><Pencil aria-hidden="true" />Editar perfil</Button> : null}
        </div>
      </CardHeader>
      <CardContent className="pt-6 sm:pt-8">
        {saveState === 'SUCCESS' ? <Alert className="mb-6 border-status-success-border bg-status-success-surface text-status-success" role="status"><CheckCircle2 aria-hidden="true" /><AlertTitle>Datos guardados</AlertTitle><AlertDescription className="text-status-success">{success}</AlertDescription></Alert> : null}
        {!isEditing ? <ProfileDetails profile={profile.data} /> : <form className="space-y-8" onSubmit={submit} noValidate>
           {saveState === 'ERROR' ? <ErrorState title="No fue posible guardar los cambios" message={requestError} /> : null}
           <FormStepper steps={formSteps} activeStep={activeStep} visitedSteps={visitedSteps} onStepChange={step => setActiveStep(step)} />
           <fieldset className="space-y-8" disabled={saveState === 'SUBMITTING'}>
            <legend className="sr-only">Editar información institucional</legend>
              {activeStep === 0 ? <FormSection className="gap-6" title="Identificación legal" description="Datos que identifican formalmente a la Asociación ante entidades y registros.">
              <FormField id="legalName" label={<><span>Nombre legal</span> <Optional /></>}>
                <Input maxLength={200} value={form.legalName} onChange={event => setField('legalName', event.target.value)} placeholder="Sin validar o cargar" autoComplete="organization" />
              </FormField>
              <div className="grid gap-5 md:grid-cols-2">
                <TextFieldControl id="legalIdentification" label="Cédula jurídica" value={form.legalIdentification} maxLength={80} onChange={value => setField('legalIdentification', value)} />
                <FormField id="organizationType" label={<><span>Tipo de asociación</span> <Optional /></>}>
                  <Select value={form.organizationType} onChange={event => setField('organizationType', event.target.value)}><option value="">Sin validar o cargar</option><option value="INTEGRAL">Integral</option><option value="SPECIFIC">Específica</option></Select>
                </FormField>
              </div>
             </FormSection> : null}
              {activeStep === 1 ? <FormSection className="gap-6" title="Registro DINADECO" description="Información de inscripción y referencia administrativa vigente.">
              <div className="grid gap-5 md:grid-cols-2">
                <TextFieldControl id="dinadecoRegistrationCode" label="Código o registro DINADECO" value={form.dinadecoRegistrationCode} maxLength={80} onChange={value => setField('dinadecoRegistrationCode', value)} />
                <TextFieldControl id="dinadecoRegion" label="Región o Dirección Regional" value={form.dinadecoRegion} maxLength={150} onChange={value => setField('dinadecoRegion', value)} />
              </div>
             </FormSection> : null}
              {activeStep === 2 ? <FormSection className="gap-6" title="Ubicación" description="Referencia territorial y dirección usada para la correspondencia institucional.">
              <div className="grid gap-5 md:grid-cols-2">
                <TextFieldControl id="province" label="Provincia" value={form.province} maxLength={100} onChange={value => setField('province', value)} />
                <TextFieldControl id="canton" label="Cantón" value={form.canton} maxLength={100} onChange={value => setField('canton', value)} />
                <TextFieldControl id="district" label="Distrito" value={form.district} maxLength={100} onChange={value => setField('district', value)} />
                <TextFieldControl id="locality" label="Localidad" value={form.locality} maxLength={150} onChange={value => setField('locality', value)} />
              </div>
              <FormField id="correspondenceAddress" label={<><span>Dirección de correspondencia</span> <Optional /></>}>
                <Textarea maxLength={500} value={form.correspondenceAddress} onChange={event => setField('correspondenceAddress', event.target.value)} placeholder="Sin validar o cargar" autoComplete="street-address" />
              </FormField>
             </FormSection> : null}
              {activeStep === 3 ? <FormSection className="gap-6" title="Contacto institucional" description="Canales oficiales para la comunicación con la Asociación.">
              <div className="grid gap-5 md:grid-cols-2">
                <TextFieldControl id="phone" label="Teléfono" value={form.phone} maxLength={50} onChange={value => setField('phone', value)} inputMode="tel" autoComplete="tel" />
                <TextFieldControl id="telefax" label="Telefax" value={form.telefax} maxLength={50} onChange={value => setField('telefax', value)} inputMode="tel" />
              </div>
              <FormField id="email" label={<><span>Correo institucional</span> <Optional /></>} description="Use correo oficial de la Asociación." error={emailMessage}>
                <Input type="email" autoComplete="email" maxLength={254} value={form.email} onChange={event => setField('email', event.target.value)} placeholder="Sin validar o cargar" />
              </FormField>
             </FormSection> : null}
           </fieldset>
           <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:justify-end">
             <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={cancel} disabled={saveState === 'SUBMITTING'}>Cancelar</Button>
             {activeStep > 0 ? <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setActiveStep(activeStep - 1)} disabled={saveState === 'SUBMITTING'}>Atrás</Button> : null}
             {activeStep < formSteps.length - 1 ? <Button type="button" className="w-full sm:min-w-36 sm:w-auto" onClick={() => { const nextStep = activeStep + 1; setVisitedSteps(current => new Set([...current, nextStep])); setActiveStep(nextStep) }} disabled={saveState === 'SUBMITTING'}>Siguiente</Button> : <Button type="submit" className="w-full sm:min-w-48 sm:w-auto" loading={saveState === 'SUBMITTING'} disabled={!canUpdate || saveState === 'SUBMITTING'}>{saveState === 'SUBMITTING' ? 'Guardando cambios…' : 'Guardar cambios'}</Button>}
           </div>
        </form>}
      </CardContent>
    </Card> : null}
  </PageContainer>
}

function Optional() { return <span className="font-normal text-foreground-muted">(opcional)</span> }
function TextFieldControl({ id, label, value, maxLength, onChange, inputMode, autoComplete }: { id: TextField; label: string; value: string; maxLength: number; onChange: (value: string) => void; inputMode?: 'tel'; autoComplete?: string }) {
  return <FormField id={id} label={<><span>{label}</span> <Optional /></>}>
    <Input maxLength={maxLength} value={value} onChange={event => onChange(event.target.value)} placeholder="Sin validar o cargar" inputMode={inputMode} autoComplete={autoComplete} />
  </FormField>
}

function ProfileDetails({ profile }: { profile: UpdateInstitutionalProfileInput }) {
  return <div className="space-y-8">
    <ProfileDetailSection title="Identificación legal" items={[['Nombre legal', profile.legalName], ['Cédula jurídica', profile.legalIdentification], ['Tipo de asociación', profile.organizationType === 'INTEGRAL' ? 'Integral' : profile.organizationType === 'SPECIFIC' ? 'Específica' : null]]} />
    <ProfileDetailSection title="Registro DINADECO" items={[["Código o registro DINADECO", profile.dinadecoRegistrationCode], ['Región o Dirección Regional', profile.dinadecoRegion]]} />
    <ProfileDetailSection title="Ubicación" items={[["Provincia", profile.province], ['Cantón', profile.canton], ['Distrito', profile.district], ['Localidad', profile.locality], ['Dirección de correspondencia', profile.correspondenceAddress]]} />
    <ProfileDetailSection title="Contacto institucional" items={[["Teléfono", profile.phone], ['Telefax', profile.telefax], ['Correo institucional', profile.email]]} />
  </div>
}

function ProfileDetailSection({ title, items }: { title: string; items: ReadonlyArray<readonly [string, string | null | undefined]> }) {
  return <section className="border-b border-border-subtle pb-8 last:border-b-0 last:pb-0" aria-labelledby={`${title}-heading`}>
    <h2 id={`${title}-heading`} className="text-heading-3 font-semibold text-foreground">{title}</h2>
    <dl className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
      {items.map(([label, value]) => <div key={label} className="min-w-0">
        <dt className="text-label font-semibold text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words text-body text-foreground">{value || <span className="text-muted-foreground">Sin validar o cargar</span>}</dd>
      </div>)}
    </dl>
  </section>
}
