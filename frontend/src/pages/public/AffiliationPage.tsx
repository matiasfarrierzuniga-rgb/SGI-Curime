import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Check, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, ClipboardList, ContactRound, IdCard, LoaderCircle, UsersRound } from 'lucide-react'
import { useEffect, useRef, useState, type ReactElement, type ReactNode, type RefObject } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { affiliationSchema, mapAffiliationFormToRequest, type AffiliationFormValues } from '@/features/affiliate-requests'
import { userRequestsService, type IdentityLookupResult } from '@/features/user-requests'
import { getErrorMessage } from '@/shared/lib/errors'
import { digitsOnly, identificationMaxLength } from '@/shared/lib/formValidation'
import { Button } from '@/shared/ui/button'
import { DatePicker } from '@/shared/ui/date-picker/DatePicker'
import { FormField } from '@/shared/ui/FormField'
import { PhoneField } from '@/shared/ui/forms/PhoneField'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { affiliateRequestsService } from '../../services/affiliateRequestsService'
import { SectionContainer, Seo } from '../../components/public/PublicComponents'

const emptyValues: AffiliationFormValues = {
  identificationType: 'NATIONAL', identification: '', firstName: '', firstSurname: '', secondSurname: '', birthDate: '', gender: '',
  phoneCountryCode: '', phoneNationalNumber: '', email: '', address: '', occupation: '', workplace: '', affiliationReason: '',
}

const stepFields: Record<number, (keyof AffiliationFormValues)[]> = {
  1: ['identificationType', 'identification', 'firstName', 'firstSurname', 'secondSurname'],
  2: ['phoneCountryCode', 'phoneNationalNumber', 'email', 'address'],
  3: ['birthDate', 'gender', 'occupation', 'workplace', 'affiliationReason'],
}

const steps = [
  { number: 1, label: 'Identidad', detail: 'Cédula, nombres y apellidos' },
  { number: 2, label: 'Contacto', detail: 'Teléfono, correo y dirección' },
  { number: 3, label: 'Solicitud', detail: 'Información adicional' },
]

type LookupStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found' }
  | { kind: 'not-found' }
  | { kind: 'unavailable' }

type FieldControlProps = {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}

export function AffiliationPage() {
  const [step, setStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>({ kind: 'idle' })
  const submitLock = useRef(false)
  const lookupSequence = useRef(0)
  const lookupCache = useRef(new Map<string, Promise<IdentityLookupResult>>())
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const form = useForm<AffiliationFormValues>({
    resolver: zodResolver(affiliationSchema),
    defaultValues: emptyValues,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })
  const identificationType = form.watch('identificationType')
  const identification = form.watch('identification')

  useEffect(() => {
    const sequence = ++lookupSequence.current
    const isValidNationalIdentification = identificationType === 'NATIONAL' && /^[1-9]\d{8}$/.test(identification)
    if (!isValidNationalIdentification) {
      setLookupStatus({ kind: 'idle' })
      return
    }

    const timer = window.setTimeout(async () => {
      setLookupStatus({ kind: 'loading' })
      let request = lookupCache.current.get(identification)
      if (!request) {
        request = userRequestsService.lookupIdentity(identification)
        lookupCache.current.set(identification, request)
      }

      try {
        const result = await request
        if (sequence !== lookupSequence.current || form.getValues('identification') !== identification || form.getValues('identificationType') !== 'NATIONAL') return
        if (!result.found) {
          setLookupStatus({ kind: 'not-found' })
          return
        }
        form.setValue('firstName', result.suggestedNames.firstName, { shouldDirty: true, shouldValidate: true })
        form.setValue('firstSurname', result.suggestedNames.firstSurname, { shouldDirty: true, shouldValidate: true })
        form.setValue('secondSurname', result.suggestedNames.secondSurname, { shouldDirty: true, shouldValidate: true })
        setLookupStatus({ kind: 'found' })
      } catch {
        if (sequence !== lookupSequence.current) return
        setLookupStatus({ kind: 'unavailable' })
      }
    }, 500)

    return () => window.clearTimeout(timer)
  }, [form, identification, identificationType])

  function showStep(nextStep: number) {
    setStep(nextStep)
    window.requestAnimationFrame(() => stepHeadingRef.current?.focus())
  }

  async function continueToNextStep() {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true })
    if (valid) showStep(step + 1)
  }

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
    <SectionContainer spacing="compact" className="pt-4 pb-8 min-[375px]:pt-5 md:pt-6 md:pb-10 lg:pb-12">
      {success ? <Success /> : (
        <div className="mx-auto grid max-w-[68.75rem] gap-3 sm:gap-4">
          <AffiliationIntro />
          <form className="overflow-hidden rounded-surface border border-brand-sage/80 bg-card-white p-3 shadow-surface sm:p-4 lg:p-5" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={form.formState.isSubmitting}>
            <Stepper currentStep={step} />
            {requestError ? <p role="alert" className="mt-4 flex items-center gap-2 rounded-control border border-status-error-border bg-status-error-surface px-3 py-2 text-body-small font-medium text-status-error-foreground"><CircleAlert aria-hidden="true" className="size-4 shrink-0" />{requestError}</p> : null}
            <fieldset disabled={form.formState.isSubmitting} className="contents">
              <div className="mt-4 overflow-hidden rounded-surface border border-border-default bg-surface shadow-sm">
                <div className="p-4 md:p-6 lg:p-7">
                  {step === 1 ? <IdentityStep form={form} lookupStatus={lookupStatus} headingRef={stepHeadingRef} /> : null}
                  {step === 2 ? <ContactStep form={form} headingRef={stepHeadingRef} /> : null}
                  {step === 3 ? <ApplicationStep form={form} headingRef={stepHeadingRef} /> : null}
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-border-subtle bg-card-white px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-7">
                  {step === 1
                    ? <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-control border border-brand-deep px-4 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-deep/5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring md:w-auto" to="/">Cancelar</Link>
                    : <Button className="min-h-11 w-full md:w-auto" variant="outline" type="button" onClick={() => showStep(step - 1)}><ChevronLeft aria-hidden="true" />Anterior</Button>}
                  {step < 3
                    ? <Button className="min-h-11 w-full bg-interaction-primary-default text-primary-foreground md:w-auto" variant="primary" type="button" onClick={() => void continueToNextStep()}>Continuar<ChevronRight aria-hidden="true" /></Button>
                    : <Button className="min-h-11 w-full bg-interaction-primary-default text-primary-foreground md:w-auto" variant="primary" type="submit" loading={form.formState.isSubmitting}>Enviar solicitud</Button>}
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      )}
    </SectionContainer>
  </>
}

function AffiliationIntro() {
  return <header className="grid gap-3 pb-0 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-center">
    <div>
      <p className="public-eyebrow text-brand-primary">ADI Curime · Solicitudes</p>
      <h1 className="public-heading mt-2 text-brand-ink">Solicitud de afiliación</h1>
      <p className="mt-2 max-w-2xl text-body leading-relaxed text-foreground-muted">Complete su información en tres pasos para que la Asociación revise su solicitud.</p>
    </div>
    <aside className="flex items-center gap-3 rounded-surface border border-brand-accent/25 bg-brand-accent/10 p-3.5 text-brand-ink sm:max-w-md lg:mb-0">
      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full border border-brand-accent/35 bg-brand-ivory text-brand-brown"><UsersRound className="size-6" /></span>
      <div><h2 className="text-body-small font-bold leading-tight">Forme parte de nuestra comunidad</h2><p className="mt-1 text-caption leading-snug text-foreground-secondary">Su participación fortalece el desarrollo de Curime.</p></div>
    </aside>
  </header>
}

function Stepper({ currentStep }: { currentStep: number }) {
  return <nav aria-label="Progreso de la solicitud" className="px-2 py-2 sm:px-3 sm:py-2 lg:px-5 lg:py-3">
    <ol className="grid grid-cols-3">
      {steps.map((item, index) => {
        const completed = item.number < currentStep
        const active = item.number === currentStep
        return <li key={item.number} className="relative flex min-w-0 flex-col items-center text-center" aria-current={active ? 'step' : undefined}>
          {index > 0 ? <span aria-hidden="true" className={`absolute top-4 right-1/2 h-0.5 w-full sm:top-[1.0625rem] lg:top-[1.125rem] ${item.number <= currentStep ? 'bg-brand-deep' : 'bg-border-default'}`} /> : null}
          <span className={`relative z-10 grid size-8 place-items-center rounded-full border text-caption font-bold sm:size-[2.125rem] lg:size-9 ${completed ? 'border-brand-deep bg-brand-deep text-white' : active ? 'border-brand-deep bg-brand-deep text-white ring-4 ring-brand-deep/10' : 'border-border-default bg-surface-muted text-muted-foreground'}`}>
            {completed ? <Check aria-hidden="true" className="size-4" /> : item.number}
          </span>
          <span className={`mt-1.5 text-body-small font-semibold ${active ? 'text-brand-deep' : 'text-foreground'}`}>{item.label}</span>
          <span className="mt-0.5 hidden text-caption leading-tight text-muted-foreground lg:block">{item.detail}</span>
        </li>
      })}
    </ol>
  </nav>
}

type StepProps = {
  form: UseFormReturn<AffiliationFormValues>
  headingRef: RefObject<HTMLHeadingElement | null>
}

function IdentityStep({ form, lookupStatus, headingRef }: StepProps & { lookupStatus: LookupStatus }) {
  return <section className="grid gap-4 md:gap-5 lg:gap-6" aria-labelledby="identity-title">
    <StepHeading ref={headingRef} id="identity-title" icon={<IdCard />} title="Datos de identidad" description="Al completar una cédula nacional válida, buscaremos información disponible para facilitar el registro." />
    <div className="grid gap-4 md:grid-cols-2 md:items-start md:gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
      <Field required label="Tipo de identificación" id="identificationType" error={form.formState.errors.identificationType?.message}><Select className="h-12" {...form.register('identificationType')}><option value="NATIONAL">Cédula nacional</option><option value="DIMEX">DIMEX</option></Select></Field>
      <Field required label="Número de identificación" id="identification" error={form.formState.errors.identification?.message} description={lookupStatus.kind === 'loading' ? <span className="inline-flex items-center gap-2 md:hidden"><LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />Buscando información…</span> : undefined}>
        <Input className="h-12" inputMode="numeric" autoComplete="off" maxLength={identificationMaxLength(form.watch('identificationType'))} {...form.register('identification', { onChange: (event) => { event.target.value = digitsOnly(event.target.value, identificationMaxLength(form.getValues('identificationType'))) } })} />
      </Field>
      <LookupFeedback status={lookupStatus} />
    </div>
    <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
      <Field label={<RequiredLabel>Nombre(s)</RequiredLabel>} id="firstName" error={form.formState.errors.firstName?.message}><Input className="h-12" autoComplete="given-name" maxLength={150} {...form.register('firstName')} /></Field>
      <Field label={<RequiredLabel>Primer apellido</RequiredLabel>} id="firstSurname" error={form.formState.errors.firstSurname?.message}><Input className="h-12" autoComplete="family-name" maxLength={150} {...form.register('firstSurname')} /></Field>
      <Field label="Segundo apellido" id="secondSurname" error={form.formState.errors.secondSurname?.message}><Input className="h-12" autoComplete="additional-name" maxLength={150} {...form.register('secondSurname')} /></Field>
    </div>
  </section>
}

function LookupFeedback({ status }: { status: LookupStatus }) {
  if (status.kind === 'idle') return <div className="hidden md:col-span-2 md:block lg:col-span-1" aria-hidden="true" />
  if (status.kind === 'loading') return <div role="status" className="hidden min-h-12 items-center gap-2 rounded-control border border-border-subtle bg-surface-muted px-3 text-caption text-foreground-muted md:col-span-2 md:flex lg:col-span-1 lg:self-end"><LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" /><span><strong className="block font-semibold">Buscando información…</strong><span>Esto puede tardar unos segundos.</span></span></div>
  if (status.kind === 'found') return <div role="status" className="flex min-h-12 items-center gap-2 rounded-control border border-status-success-border bg-status-success-surface px-3 py-2 text-caption text-status-success-foreground md:col-span-2 lg:col-span-1 lg:self-end"><CheckCircle2 aria-hidden="true" className="size-4 shrink-0" /><span><strong className="block">Datos encontrados</strong><span>Puede corregirlos antes de continuar.</span></span></div>
  if (status.kind === 'not-found') return <div role="status" className="flex min-h-12 items-center gap-2 rounded-control border border-status-warning-border bg-status-warning-surface px-3 py-2 text-caption text-status-warning-foreground md:col-span-2 lg:col-span-1 lg:self-end"><CircleAlert aria-hidden="true" className="size-4 shrink-0" /><span><strong className="block">No encontramos datos asociados</strong><span>Ingrese los datos manualmente.</span></span></div>
  return <div role="status" className="flex min-h-12 items-center gap-2 rounded-control border border-status-warning-border bg-status-warning-surface px-3 py-2 text-caption text-status-warning-foreground md:col-span-2 lg:col-span-1 lg:self-end"><CircleAlert aria-hidden="true" className="size-4 shrink-0" /><span><strong className="block">No pudimos consultar la información</strong><span>Puede ingresar los datos manualmente.</span></span></div>
}

function ContactStep({ form, headingRef }: StepProps) {
  return <section className="grid gap-4 md:gap-5 lg:gap-6" aria-labelledby="contact-title">
    <StepHeading ref={headingRef} id="contact-title" icon={<ContactRound />} title="Información de contacto" description="Indique cómo puede comunicarse la Asociación con usted." />
    <div className="grid gap-4 md:grid-cols-2 md:gap-5">
      <PhoneField className="[&_.PhoneInput]:h-12 [&_.PhoneInput]:rounded-control [&_.PhoneInput]:border-border-default" id="phoneNationalNumber" label="Teléfono" value={{ countryCode: form.watch('phoneCountryCode'), nationalNumber: form.watch('phoneNationalNumber') }} error={form.formState.errors.phoneNationalNumber?.message} description="Seleccione el país e ingrese el número." onChange={({ countryCode, nationalNumber }) => { form.setValue('phoneCountryCode', countryCode ?? '', { shouldDirty: true, shouldTouch: true, shouldValidate: true }); form.setValue('phoneNationalNumber', nationalNumber ?? '', { shouldDirty: true, shouldTouch: true, shouldValidate: true }) }} />
      <Field label="Correo electrónico" id="email" error={form.formState.errors.email?.message}><Input className="h-12" type="email" autoComplete="email" maxLength={254} {...form.register('email')} /></Field>
    </div>
    <Field required label="Dirección" id="address" error={form.formState.errors.address?.message} description="Incluya referencias que faciliten su ubicación."><Textarea autoComplete="street-address" maxLength={300} {...form.register('address')} /></Field>
  </section>
}

function ApplicationStep({ form, headingRef }: StepProps) {
  return <section className="grid gap-4 md:gap-5 lg:gap-6" aria-labelledby="application-title">
    <StepHeading ref={headingRef} id="application-title" icon={<ClipboardList />} title="Información de la solicitud" description="Complete la información adicional para finalizar su solicitud." />
    <div className="grid gap-4 md:grid-cols-2 md:gap-5">
      <Field label={<RequiredLabel>Fecha de nacimiento</RequiredLabel>} id="birthDate" error={form.formState.errors.birthDate?.message}><DatePicker value={form.watch('birthDate')} max={new Date().toISOString().slice(0, 10)} onChange={(value) => form.setValue('birthDate', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })} /></Field>
      <Field label="Género" id="gender" error={form.formState.errors.gender?.message}><Select className="h-12" {...form.register('gender')}><option value="">Seleccione una opción</option><option value="Femenino">Femenino</option><option value="Masculino">Masculino</option><option value="Otro">Otro</option><option value="Prefiere no indicar">Prefiere no indicar</option></Select></Field>
      <Field label="Ocupación" id="occupation" error={form.formState.errors.occupation?.message}><Input className="h-12" maxLength={100} {...form.register('occupation')} /></Field>
      <Field label="Lugar de trabajo" id="workplace" error={form.formState.errors.workplace?.message}><Input className="h-12" maxLength={150} {...form.register('workplace')} /></Field>
    </div>
    <Field required label="¿Por qué desea afiliarse?" id="affiliationReason" error={form.formState.errors.affiliationReason?.message}><Textarea minLength={3} maxLength={1000} {...form.register('affiliationReason')} /></Field>
  </section>
}

function StepHeading({ id, icon, title, description, ref }: { id: string; icon: ReactElement; title: string; description: string; ref: RefObject<HTMLHeadingElement | null> }) {
  return <div className="flex items-start gap-3 border-b border-border-subtle pb-4"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-red text-white shadow-sm [&_svg]:size-5">{icon}</span><div><h2 ref={ref} tabIndex={-1} id={id} className="font-heading text-heading-3 text-brand-ink outline-none">{title}</h2><p className="mt-0.5 text-body-small leading-relaxed text-muted-foreground">{description}</p></div></div>
}

function Success() { return <section className="mx-auto max-w-2xl rounded-surface border border-success/40 bg-success-bg p-6 shadow-sm sm:p-8" aria-labelledby="affiliation-success-title"><h2 id="affiliation-success-title" className="font-heading text-heading-2">Recibimos su solicitud</h2><p className="mt-3 text-body leading-relaxed">La Asociación se comunicará con usted. No necesita enviar otra solicitud.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link className="inline-flex min-h-11 items-center justify-center rounded-control bg-brand-deep px-4 font-bold text-brand-ivory transition-colors hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/">Volver al inicio</Link><Link className="inline-flex min-h-11 items-center justify-center rounded-control border border-brand-deep px-4 font-bold text-brand-deep transition-colors hover:bg-brand-ivory focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/contacto">Contactar a la Asociación</Link></div></section> }

function RequiredLabel({ children }: { children: ReactNode }) { return <><span className="inline-flex items-center gap-1">{children}<span className="text-destructive" aria-hidden="true">*</span></span><span className="sr-only"> (requerido)</span></> }

function Field({ className, label, id, error, description, required, children }: { className?: string; label: ReactNode; id: string; error?: string; description?: ReactNode; required?: boolean; children: ReactElement<FieldControlProps> }) { return <FormField className={className} id={id} label={label} error={error} description={description} required={required}>{children}</FormField> }
