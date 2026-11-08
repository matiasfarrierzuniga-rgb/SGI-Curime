import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { PublicPageContent, PublicPageHeader } from '@/shared/ui/PublicPageLayout'
import { Select } from '@/shared/ui/select'
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
    <PublicPageContent className="max-w-4xl" spacing="spacious">
      {confirmation ? <section role="status" className="rounded-surface border border-brand-sage bg-card-white p-6 shadow-surface"><h2 className="font-heading text-heading-2 text-brand-ink">Solicitud recibida</h2><p className="mt-3 text-foreground-muted">Su solicitud quedó pendiente de revisión. Esto no confirma una donación ni un pago.</p><p className="mt-3 break-all text-sm text-foreground-muted">Referencia: {confirmation}</p><Button className="mt-5" type="button" onClick={() => setConfirmation(null)}>Enviar otra solicitud</Button></section> :
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(15rem,0.8fr)]">
        <form onSubmit={form.handleSubmit(submit)} className="space-y-6 rounded-surface border border-brand-sage/70 bg-card-white p-5 shadow-surface sm:p-8">
          <div><h2 className="font-heading text-heading-2 text-brand-ink">Cuéntenos cómo desea ayudar</h2><p className="mt-2 text-sm text-foreground-muted">Los campos con * son obligatorios. No solicitamos cédula ni documentos.</p></div>
          <FormField id="donor-name" label="Nombre" required error={form.formState.errors.donorName?.message}><Input autoComplete="name" maxLength={160} {...form.register('donorName')} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2"><FormField id="donor-email" label="Correo electrónico" error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" maxLength={254} {...form.register('email')} /></FormField><FormField id="donor-phone" label="Teléfono" error={form.formState.errors.phone?.message}><Input type="tel" autoComplete="tel" maxLength={32} {...form.register('phone')} /></FormField></div>
          <p className="-mt-4 text-sm text-foreground-muted">Indique al menos uno de los dos contactos.</p>
          <div className="grid gap-4 sm:grid-cols-2"><FormField id="donation-kind" label="Tipo de aporte" required><Select {...form.register('kind', { onChange: event => { form.setValue('modality', event.target.value === 'IN_KIND' ? 'IN_PERSON' : 'DIGITAL'); form.setValue('paymentPreference', 'SINPE') } })}><option value="MONETARY">Dinero</option><option value="IN_KIND">Bienes</option></Select></FormField><FormField id="donation-modality" label="Modalidad" required><Select {...form.register('modality')} key={kind}><option value="IN_PERSON">Presencial</option>{kind === 'IN_KIND' ? <option value="COORDINATED">Coordinada</option> : <option value="DIGITAL">Digital</option>}</Select></FormField></div>
          {kind === 'MONETARY' ? <><FormField id="donation-amount" label="Monto aproximado en CRC" required error={form.formState.errors.approximateAmount?.message}><Input type="text" inputMode="decimal" placeholder="Por ejemplo, 10000" {...form.register('approximateAmount')} /></FormField>{modality === 'DIGITAL' ? <FormField id="payment-preference" label="Canal digital preferido" required><Select {...form.register('paymentPreference')}><option value="SINPE">SINPE Móvil</option><option value="BANK_TRANSFER">Transferencia bancaria</option></Select></FormField> : null}</> : <FormField id="goods-description" label="Descripción de los bienes" required error={form.formState.errors.goodsDescription?.message}><Textarea maxLength={2000} {...form.register('goodsDescription')} /></FormField>}
          <FormField id="donation-comments" label="Comentarios (opcional)" error={form.formState.errors.comments?.message}><Textarea maxLength={2000} {...form.register('comments')} /></FormField>
          <label className="flex items-start gap-3 text-sm text-foreground-muted"><input type="checkbox" className="mt-1 size-4 accent-primary" {...form.register('anonymousPublic')} /><span>Deseo que mi nombre no se muestre públicamente. El personal autorizado podrá verlo para gestionar esta solicitud.</span></label>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Enviando solicitud…' : 'Enviar solicitud'}</Button>
        </form>
        <aside className="space-y-4 text-sm text-foreground-muted"><div className="rounded-surface bg-brand-ivory p-5"><h2 className="font-heading text-heading-3 text-brand-ink">Antes de continuar</h2><p className="mt-3">Este formulario registra una intención de donar. No procesa pagos ni confirma recepción de bienes.</p><p className="mt-3">Si elige SINPE o transferencia, la ADI deberá coordinar el canal autorizado con usted. No envíe dinero a números o cuentas no verificados.</p></div></aside>
      </div>}
    </PublicPageContent>
  </>
}
