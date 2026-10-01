import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/shared/ui/button'
import { useCreateDonation, useUpdateDonation } from '../hooks/donations.queries'
import type { Donation, DonationMethod } from '../model/donations.types'
import { donationMethods, donationMethodLabel, getDonationErrorMessage } from './donationPresentation'
import { toDateTimeLocal } from './donationDateTime'

type DonationFormValues = { donorName: string; donorIdentification: string; amount: string; method: DonationMethod; reference: string; receivedAt: string; description: string; anonymous: boolean }

const schema = z.object({ donorName: z.string().max(150), donorIdentification: z.string().max(50), amount: z.string().trim().regex(/^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'Ingrese un monto positivo con máximo dos decimales.'), method: z.enum(['CASH', 'BANK_TRANSFER', 'SINPE_MOVIL', 'OTHER']), reference: z.string().max(100), receivedAt: z.string().min(1, 'La fecha de recepción es requerida.'), description: z.string().max(1000), anonymous: z.boolean() })
const controlClassName = 'min-h-11 w-full rounded-control border border-border-default bg-control px-3 text-base text-text-primary shadow-sm outline-none transition placeholder:text-text-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-control-disabled disabled:text-text-muted'

function optional(value: string) { const normalized = value.trim(); return normalized || undefined }

export function DonationForm({ donation, onClose }: { donation?: Donation; onClose: () => void }) {
  const create = useCreateDonation()
  const update = useUpdateDonation()
  const mutation = donation ? update : create
  const form = useForm<DonationFormValues>({ resolver: zodResolver(schema), defaultValues: { donorName: donation?.donorName ?? '', donorIdentification: donation?.donorIdentification ?? '', amount: donation?.amount ?? '', method: donation?.method ?? 'CASH', reference: donation?.reference ?? '', receivedAt: donation ? toDateTimeLocal(donation.receivedAt) : toDateTimeLocal(new Date().toISOString()), description: donation?.description ?? '', anonymous: !donation?.donorName && !donation?.donorIdentification } })
  const anonymous = form.watch('anonymous')

  useEffect(() => { if (anonymous) { form.setValue('donorName', ''); form.setValue('donorIdentification', '') } }, [anonymous, form])

  async function submit(values: DonationFormValues) {
    const input = { donorName: values.anonymous ? '' : optional(values.donorName), donorIdentification: values.anonymous ? '' : optional(values.donorIdentification), amount: values.amount.trim(), method: values.method, reference: optional(values.reference), description: optional(values.description), receivedAt: new Date(values.receivedAt).toISOString() }
    try { if (donation) await update.mutateAsync({ id: donation.id, input }); else await create.mutateAsync(input); toast.success(donation ? 'Donación actualizada correctamente.' : 'Donación registrada correctamente.'); onClose() } catch (error) { toast.error(getDonationErrorMessage(error, 'No fue posible guardar la donación.')) }
  }

  return <form className="space-y-6" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={mutation.isPending}>
    <p className="rounded-control border border-info/25 bg-info-bg px-3 py-2 text-body-small text-info">Los campos de donante son opcionales. Marque donación anónima para omitirlos del registro.</p>
    <label className="flex min-h-11 items-center gap-3 rounded-control border border-border-default bg-surface-muted px-3 text-label font-semibold text-text-primary" htmlFor="donation-anonymous"><input className="size-4 accent-primary" id="donation-anonymous" type="checkbox" disabled={mutation.isPending} {...form.register('anonymous')} />Donación anónima</label>
    <fieldset className="grid gap-4 md:grid-cols-2"><legend className="mb-3 text-heading-3 font-semibold text-text-primary">Información de la donación</legend><Field label="Nombre del donante" id="donation-donor-name" error={form.formState.errors.donorName?.message}><input className={controlClassName} id="donation-donor-name" disabled={anonymous || mutation.isPending} {...form.register('donorName')} /></Field><Field label="Identificación" id="donation-donor-identification" error={form.formState.errors.donorIdentification?.message}><input className={controlClassName} id="donation-donor-identification" disabled={anonymous || mutation.isPending} {...form.register('donorIdentification')} /></Field><Field label="Monto (CRC)" id="donation-amount" error={form.formState.errors.amount?.message}><input className={controlClassName} id="donation-amount" inputMode="decimal" placeholder="0.00" disabled={mutation.isPending} aria-describedby="donation-amount-hint" {...form.register('amount')} /><p id="donation-amount-hint" className="text-caption text-text-secondary">Use hasta dos decimales.</p></Field><Field label="Método" id="donation-method" error={form.formState.errors.method?.message}><select className={controlClassName} id="donation-method" disabled={mutation.isPending} {...form.register('method')}>{donationMethods.map(method => <option key={method} value={method}>{donationMethodLabel(method)}</option>)}</select></Field><Field label="Fecha de recepción" id="donation-received-at" error={form.formState.errors.receivedAt?.message}><input className={controlClassName} id="donation-received-at" type="datetime-local" disabled={mutation.isPending} {...form.register('receivedAt')} /></Field><Field label="Referencia (opcional)" id="donation-reference" error={form.formState.errors.reference?.message}><input className={controlClassName} id="donation-reference" disabled={mutation.isPending} {...form.register('reference')} /></Field></fieldset>
    <Field label="Descripción (opcional)" id="donation-description" error={form.formState.errors.description?.message}><textarea className={`${controlClassName} min-h-28 py-2`} id="donation-description" rows={3} disabled={mutation.isPending} {...form.register('description')} /></Field>
    <div className="flex flex-col-reverse gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button><Button type="submit" loading={mutation.isPending}>{donation ? 'Guardar cambios' : 'Registrar donación'}</Button></div>
  </form>
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) { return <div className="grid gap-1"><label className="text-label font-semibold text-text-primary" htmlFor={id}>{label}</label>{children}{error ? <p role="alert" className="field-error">{error}</p> : null}</div> }
