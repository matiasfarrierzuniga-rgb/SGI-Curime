import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/shared/ui/button'
import { useCreateDonation, useUpdateDonation } from '../hooks/donations.queries'
import type { Donation, DonationMethod } from '../model/donations.types'
import { donationMethods, donationMethodLabel, getDonationErrorMessage } from './donationPresentation'

type DonationFormValues = {
  donorName: string
  donorIdentification: string
  amount: string
  method: DonationMethod
  reference: string
  receivedAt: string
  description: string
  anonymous: boolean
}

const schema = z.object({
  donorName: z.string().max(255),
  donorIdentification: z.string().max(100),
  amount: z.string().trim().regex(/^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'Ingrese un monto positivo con máximo dos decimales.'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'SINPE_MOVIL', 'OTHER']),
  reference: z.string().max(255),
  receivedAt: z.string().min(1, 'La fecha de recepción es requerida.'),
  description: z.string().max(1000),
  anonymous: z.boolean(),
})

function toDateTimeLocal(value: string) {
  return value.slice(0, 16)
}

function optional(value: string) {
  const normalized = value.trim()
  return normalized || undefined
}

export function DonationForm({ donation, onClose }: { donation?: Donation; onClose: () => void }) {
  const create = useCreateDonation()
  const update = useUpdateDonation()
  const mutation = donation ? update : create
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      donorName: donation?.donorName ?? '',
      donorIdentification: donation?.donorIdentification ?? '',
      amount: donation?.amount ?? '',
      method: donation?.method ?? 'CASH',
      reference: donation?.reference ?? '',
      receivedAt: donation ? toDateTimeLocal(donation.receivedAt) : toDateTimeLocal(new Date().toISOString()),
      description: donation?.description ?? '',
      anonymous: !donation?.donorName && !donation?.donorIdentification,
    },
  })
  const anonymous = form.watch('anonymous')

  useEffect(() => {
    if (anonymous) {
      form.setValue('donorName', '')
      form.setValue('donorIdentification', '')
    }
  }, [anonymous, form])

  async function submit(values: DonationFormValues) {
    const input = {
      ...(values.anonymous ? {} : { donorName: optional(values.donorName), donorIdentification: optional(values.donorIdentification) }),
      amount: values.amount.trim(),
      method: values.method,
      reference: optional(values.reference),
      description: optional(values.description),
      receivedAt: new Date(values.receivedAt).toISOString(),
    }
    try {
      if (donation) await update.mutateAsync({ id: donation.id, input })
      else await create.mutateAsync(input)
      toast.success(donation ? 'Donación actualizada correctamente.' : 'Donación registrada correctamente.')
      onClose()
    } catch (error) {
      toast.error(getDonationErrorMessage(error, 'No fue posible guardar la donación.'))
    }
  }

  return <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={mutation.isPending}>
    <label className="flex items-center gap-2 text-sm font-medium" htmlFor="donation-anonymous"><input id="donation-anonymous" type="checkbox" {...form.register('anonymous')} />Donación anónima</label>
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Nombre del donante" id="donation-donor-name" error={form.formState.errors.donorName?.message}><input id="donation-donor-name" disabled={anonymous || mutation.isPending} {...form.register('donorName')} /></Field>
      <Field label="Identificación" id="donation-donor-identification" error={form.formState.errors.donorIdentification?.message}><input id="donation-donor-identification" disabled={anonymous || mutation.isPending} {...form.register('donorIdentification')} /></Field>
      <Field label="Monto (CRC)" id="donation-amount" error={form.formState.errors.amount?.message}><input id="donation-amount" inputMode="decimal" placeholder="0.00" disabled={mutation.isPending} {...form.register('amount')} /></Field>
      <label className="grid gap-1 text-sm font-medium" htmlFor="donation-method">Método<select id="donation-method" disabled={mutation.isPending} {...form.register('method')}>{donationMethods.map(method => <option key={method} value={method}>{donationMethodLabel(method)}</option>)}</select></label>
      <Field label="Fecha de recepción" id="donation-received-at" error={form.formState.errors.receivedAt?.message}><input id="donation-received-at" type="datetime-local" disabled={mutation.isPending} {...form.register('receivedAt')} /></Field>
      <Field label="Referencia (opcional)" id="donation-reference" error={form.formState.errors.reference?.message}><input id="donation-reference" disabled={mutation.isPending} {...form.register('reference')} /></Field>
    </div>
    <Field label="Descripción (opcional)" id="donation-description" error={form.formState.errors.description?.message}><textarea id="donation-description" rows={3} disabled={mutation.isPending} {...form.register('description')} /></Field>
    <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando…' : donation ? 'Guardar cambios' : 'Registrar donación'}</Button></div>
  </form>
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return <div className="grid gap-1"><label className="text-sm font-medium" htmlFor={id}>{label}</label>{children}{error ? <p role="alert" className="field-error">{error}</p> : null}</div>
}
