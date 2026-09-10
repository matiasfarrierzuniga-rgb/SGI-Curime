import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
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
    <Label className="flex gap-2" htmlFor="donation-anonymous"><Checkbox id="donation-anonymous" name="anonymous" checked={anonymous} onCheckedChange={checked => form.setValue('anonymous', checked, { shouldDirty: true })} />Donación anónima</Label>
    <div className="grid gap-4 md:grid-cols-2">
      <Field invalid={Boolean(form.formState.errors.donorName)}><FieldLabel htmlFor="donation-donor-name">Nombre del donante</FieldLabel><Input id="donation-donor-name" disabled={anonymous || mutation.isPending} aria-invalid={Boolean(form.formState.errors.donorName)} aria-describedby={form.formState.errors.donorName ? 'donation-donor-name-error' : undefined} {...form.register('donorName')} />{form.formState.errors.donorName ? <FieldError id="donation-donor-name-error" role="alert" match>{form.formState.errors.donorName.message}</FieldError> : null}</Field>
      <Field invalid={Boolean(form.formState.errors.donorIdentification)}><FieldLabel htmlFor="donation-donor-identification">Identificación</FieldLabel><Input id="donation-donor-identification" disabled={anonymous || mutation.isPending} aria-invalid={Boolean(form.formState.errors.donorIdentification)} aria-describedby={form.formState.errors.donorIdentification ? 'donation-donor-identification-error' : undefined} {...form.register('donorIdentification')} />{form.formState.errors.donorIdentification ? <FieldError id="donation-donor-identification-error" role="alert" match>{form.formState.errors.donorIdentification.message}</FieldError> : null}</Field>
      <Field invalid={Boolean(form.formState.errors.amount)}><FieldLabel htmlFor="donation-amount">Monto (CRC)</FieldLabel><Input id="donation-amount" inputMode="decimal" placeholder="0.00" disabled={mutation.isPending} aria-invalid={Boolean(form.formState.errors.amount)} aria-describedby={form.formState.errors.amount ? 'donation-amount-error' : undefined} {...form.register('amount')} />{form.formState.errors.amount ? <FieldError id="donation-amount-error" role="alert" match>{form.formState.errors.amount.message}</FieldError> : null}</Field>
      <Field invalid={Boolean(form.formState.errors.method)}><FieldLabel htmlFor="donation-method">Método</FieldLabel><Select id="donation-method" disabled={mutation.isPending} aria-invalid={Boolean(form.formState.errors.method)} aria-describedby={form.formState.errors.method ? 'donation-method-error' : undefined} {...form.register('method')}>{donationMethods.map(method => <option key={method} value={method}>{donationMethodLabel(method)}</option>)}</Select>{form.formState.errors.method ? <FieldError id="donation-method-error" role="alert" match>{form.formState.errors.method.message}</FieldError> : null}</Field>
      <Field invalid={Boolean(form.formState.errors.receivedAt)}><FieldLabel htmlFor="donation-received-at">Fecha de recepción</FieldLabel><Input id="donation-received-at" type="datetime-local" disabled={mutation.isPending} aria-invalid={Boolean(form.formState.errors.receivedAt)} aria-describedby={form.formState.errors.receivedAt ? 'donation-received-at-error' : undefined} {...form.register('receivedAt')} />{form.formState.errors.receivedAt ? <FieldError id="donation-received-at-error" role="alert" match>{form.formState.errors.receivedAt.message}</FieldError> : null}</Field>
      <Field invalid={Boolean(form.formState.errors.reference)}><FieldLabel htmlFor="donation-reference">Referencia (opcional)</FieldLabel><Input id="donation-reference" disabled={mutation.isPending} aria-invalid={Boolean(form.formState.errors.reference)} aria-describedby={form.formState.errors.reference ? 'donation-reference-error' : undefined} {...form.register('reference')} />{form.formState.errors.reference ? <FieldError id="donation-reference-error" role="alert" match>{form.formState.errors.reference.message}</FieldError> : null}</Field>
    </div>
    <Field invalid={Boolean(form.formState.errors.description)}><FieldLabel htmlFor="donation-description">Descripción (opcional)</FieldLabel><Textarea id="donation-description" rows={3} disabled={mutation.isPending} aria-invalid={Boolean(form.formState.errors.description)} aria-describedby={form.formState.errors.description ? 'donation-description-error' : undefined} {...form.register('description')} />{form.formState.errors.description ? <FieldError id="donation-description-error" role="alert" match>{form.formState.errors.description.message}</FieldError> : null}</Field>
    <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando…' : donation ? 'Guardar cambios' : 'Registrar donación'}</Button></div>
  </form>
}
