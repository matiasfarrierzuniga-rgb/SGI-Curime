import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Info } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { PublicPageContent, PublicPageHeader } from '@/shared/ui/PublicPageLayout'
import { Select } from '@/shared/ui/select'
import { StatusMessage } from '@/shared/ui/StatusMessage'
import { Textarea } from '@/shared/ui/textarea'
import { donationRequestsApi, type DonationRequestInput } from '../api/donationRequests.api'

const schema = z.object({
  donorName: z.string().trim().min(2, 'Indique su nombre.').max(160),
  email: z.string(), phone: z.string(),
  kind: z.enum(['MONETARY', 'IN_KIND']),
  modality: z.enum(['DIGITAL', 'IN_PERSON', 'COORDINATED']),
  paymentPreference: z.enum(['SINPE', 'BANK_TRANSFER']).optional(),
  approximateAmount: z.string(), goodsDescription: z.string(), comments: z.string().max(2000),
  anonymousPublic: z.boolean(),
}).superRefine((value, ctx) => {
  if (!value.email.trim() && !value.phone.trim()) ctx.addIssue({ code: 'custom', path: ['email'], message: 'Indique un correo o un teléfono.' })
  if (value.email.trim() && !z.email().safeParse(value.email.trim()).success) ctx.addIssue({ code: 'custom', path: ['email'], message: 'Indique un correo válido.' })
  if (value.phone.trim() && !/^\+?[0-9 ()-]{8,32}$/.test(value.phone.trim())) ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Indique un teléfono válido.' })
  if (value.kind === 'MONETARY' && (!/^\d{1,12}(?:\.\d{1,2})?$/.test(value.approximateAmount) || Number(value.approximateAmount) <= 0)) ctx.addIssue({ code: 'custom', path: ['approximateAmount'], message: 'Indique un monto aproximado en colones.' })
  if (value.kind === 'IN_KIND' && !value.goodsDescription.trim()) ctx.addIssue({ code: 'custom', path: ['goodsDescription'], message: 'Describa los bienes.' })
})

type Values = z.infer<typeof schema>
const blank: Values = { donorName: '', email: '', phone: '', kind: 'MONETARY', modality: 'DIGITAL', paymentPreference: 'SINPE', approximateAmount: '', goodsDescription: '', comments: '', anonymousPublic: false }

export function PublicDonationRequestPage() {
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = useRef(crypto.randomUUID())
  const lock = useRef(false)
  const form = useForm<Values>({ defaultValues: blank, resolver: zodResolver(schema), mode: 'onTouched' })
  const kind = form.watch('kind')
  const modality = form.watch('modality')
  const mutation = useMutation({ mutationFn: (input: DonationRequestInput) => donationRequestsApi.create(input, key.current) })

  async function submit(value: Values) {
    if (lock.current) return
    lock.current = true
    setError(null)
    const input: DonationRequestInput = {
      donorName: value.donorName.trim(), email: value.email.trim().toLowerCase() || undefined,
      phone: value.phone.trim() || undefined, kind: value.kind, modality: value.modality,
      paymentPreference: value.kind === 'MONETARY' && value.modality === 'DIGITAL' ? value.paymentPreference : undefined,
      approximateAmount: value.kind === 'MONETARY' ? value.approximateAmount : undefined,
      goodsDescription: value.kind === 'IN_KIND' ? value.goodsDescription.trim() : undefined,
      comments: value.comments.trim() || undefined, anonymousPublic: value.anonymousPublic,
    }
    try {
      const result = await mutation.mutateAsync(input)
      setConfirmation(result.id)
      key.current = crypto.randomUUID()
      form.reset(blank)
    } catch (cause) { setError(getErrorMessage(cause, 'No fue posible enviar la solicitud. Inténtelo nuevamente.')) }
    finally { lock.current = false }
  }

  return <>
    <PublicPageHeader title="Donaciones" intro="Comparta su intención de aportar a la comunidad. La ADI revisará su solicitud y se pondrá en contacto con usted." breadcrumb="Donaciones" />
    <PublicPageContent className="max-w-6xl" spacing="spacious">
      {confirmation ? <section role="status" aria-live="polite" aria-atomic="true" className="mx-auto w-full max-w-3xl rounded-surface border border-status-success/30 bg-status-success-surface/50 p-5 shadow-surface sm:p-7">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4"><CheckCircle2 aria-hidden="true" className="mt-1 size-6 shrink-0 text-status-success" /><div className="min-w-0"><p className="public-eyebrow text-status-success">Solicitud registrada</p><h2 className="mt-1 font-heading text-heading-2 text-text-primary">Solicitud recibida</h2></div></div>
        <p className="mt-4 text-body leading-relaxed text-text-primary/80">Su solicitud quedó pendiente de revisión. Esto no confirma una donación ni un pago.</p>
        <p className="mt-3 break-all text-body-small text-foreground-muted"><span className="font-semibold text-text-primary">Referencia:</span> {confirmation}</p>
        <Button className="mt-5 w-full sm:w-auto" type="button" variant="outline" onClick={() => setConfirmation(null)}>Enviar otra solicitud</Button>
      </section> :
      <div className="grid min-w-0 items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.75fr)] lg:gap-8 xl:gap-10">
        <form onSubmit={form.handleSubmit(submit)} className="min-w-0 space-y-6 rounded-surface border border-border/70 bg-surface-card p-4 shadow-surface sm:p-6 lg:p-7">
          <header className="min-w-0 border-b border-border pb-5">
            <p className="public-eyebrow text-brand-primary">Solicitud de donación</p>
            <h2 className="mt-1 font-heading text-heading-2 text-text-primary">Cuéntenos cómo desea ayudar</h2>
            <p className="mt-2 text-body-small leading-relaxed text-foreground-muted">Este formulario registra una intención de aporte; no procesa un pago inmediato.</p>
            <p className="mt-3 text-caption leading-relaxed text-foreground-muted">Los campos con * son obligatorios. No solicitamos cédula ni documentos.</p>
          </header>

          <FormField id="donor-name" label="Nombre" required error={form.formState.errors.donorName?.message}><Input autoComplete="name" maxLength={160} {...form.register('donorName')} /></FormField>

          <section aria-labelledby="donation-contact-heading" className="grid min-w-0 gap-4 border-t border-border pt-5">
            <div><h3 id="donation-contact-heading" className="font-heading text-heading-3 font-semibold text-text-primary">Datos de contacto</h3><p className="mt-1 text-body-small leading-relaxed text-foreground-muted">Indique al menos uno de los dos contactos.</p></div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2"><FormField id="donor-email" label="Correo electrónico" optional error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" maxLength={254} {...form.register('email')} /></FormField><FormField id="donor-phone" label="Teléfono" optional error={form.formState.errors.phone?.message}><Input type="tel" autoComplete="tel" maxLength={32} {...form.register('phone')} /></FormField></div>
          </section>

          <section aria-labelledby="donation-details-heading" className="grid min-w-0 gap-4 border-t border-border pt-5">
            <div><h3 id="donation-details-heading" className="font-heading text-heading-3 font-semibold text-text-primary">Información del aporte</h3><p className="mt-1 text-body-small leading-relaxed text-foreground-muted">Elija si desea aportar dinero o bienes y la modalidad.</p></div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2"><FormField id="donation-kind" label="Tipo de aporte" required><Select {...form.register('kind', { onChange: event => { form.setValue('modality', event.target.value === 'IN_KIND' ? 'IN_PERSON' : 'DIGITAL'); form.setValue('paymentPreference', 'SINPE') } })}><option value="MONETARY">Dinero</option><option value="IN_KIND">Bienes</option></Select></FormField><FormField id="donation-modality" label="Modalidad" required><Select {...form.register('modality')} key={kind}><option value="IN_PERSON">Presencial</option>{kind === 'IN_KIND' ? <option value="COORDINATED">Coordinada</option> : <option value="DIGITAL">Digital</option>}</Select></FormField></div>
            {kind === 'MONETARY' ? <div className="grid min-w-0 gap-4 sm:grid-cols-2"><FormField id="donation-amount" label="Monto aproximado en CRC" required error={form.formState.errors.approximateAmount?.message}><Input type="text" inputMode="decimal" placeholder="Por ejemplo, 10000" {...form.register('approximateAmount')} /></FormField>{modality === 'DIGITAL' ? <FormField id="payment-preference" label="Canal digital preferido" required><Select {...form.register('paymentPreference')}><option value="SINPE">SINPE Móvil</option><option value="BANK_TRANSFER">Transferencia bancaria</option></Select></FormField> : null}</div> : <FormField id="goods-description" label="Descripción de los bienes" required error={form.formState.errors.goodsDescription?.message}><Textarea maxLength={2000} {...form.register('goodsDescription')} /></FormField>}
          </section>

          <section aria-labelledby="donation-extra-heading" className="grid min-w-0 gap-4 border-t border-border pt-5">
            <div><h3 id="donation-extra-heading" className="font-heading text-heading-3 font-semibold text-text-primary">Información adicional</h3><p className="mt-1 text-body-small leading-relaxed text-foreground-muted">Agregue comentarios o indique su preferencia de privacidad.</p></div>
            <FormField id="donation-comments" label="Comentarios (opcional)" error={form.formState.errors.comments?.message}><Textarea maxLength={2000} {...form.register('comments')} /></FormField>
            <label className="flex min-w-0 items-start gap-3 rounded-control border border-border bg-surface-page p-3 text-body-small leading-relaxed text-foreground-muted sm:p-4"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" {...form.register('anonymousPublic')} /><span>Deseo que mi nombre no se muestre públicamente. El personal autorizado podrá verlo para gestionar esta solicitud.</span></label>
          </section>

          {error ? <StatusMessage error={error} className="p-3 text-body-small leading-relaxed" /> : null}
          <div className="border-t border-border pt-5"><Button className="w-full sm:w-auto" type="submit" loading={mutation.isPending}>{mutation.isPending ? 'Enviando solicitud…' : 'Enviar solicitud'}</Button></div>
        </form>

        <aside aria-labelledby="donation-guidance-heading" className="min-w-0 lg:sticky lg:top-28">
          <div className="rounded-surface border border-brand-accent/30 bg-surface-page p-5 sm:p-6">
            <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-accent/20 text-brand-deep"><Info aria-hidden="true" className="size-5" /></span><div className="min-w-0"><p className="public-eyebrow text-brand-primary">Antes de continuar</p><h2 id="donation-guidance-heading" className="mt-1 font-heading text-heading-3 font-semibold text-text-primary">La solicitud no procesa un pago</h2></div></div>
            <p className="mt-4 text-body-small leading-relaxed text-text-primary/80">Este formulario registra una intención de donar. No procesa pagos ni confirma recepción de bienes.</p>
            <div className="mt-4 border-t border-border/70 pt-4"><p className="text-label font-semibold text-text-primary">Sobre el canal digital</p><p className="mt-2 text-body-small leading-relaxed text-foreground-muted">Si elige SINPE o transferencia, la ADI deberá coordinar el canal autorizado con usted. No envíe dinero a números o cuentas no verificados.</p></div>
          </div>
        </aside>
      </div>}
    </PublicPageContent>
  </>
}
