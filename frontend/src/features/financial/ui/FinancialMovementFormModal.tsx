import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/shared/ui/button'
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/Modal'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { useCreateFinancialMovement } from '../hooks/useFinancial'
import { FINANCIAL_MOVEMENT_TYPES, type FinancialMovementType } from '../model/financial.types'
import { financialMovementTypeLabel, getFinancialErrorMessage } from './financialPresentation'

type MovementValues = { type: string; amount: string; description: string; reference: string; occurredAt: string }
const costaRicaDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const schema = z.object({
  type: z.string().refine(value => value === 'INCOME' || value === 'EXPENSE', 'Seleccione el tipo de movimiento.'),
  amount: z.string().trim().regex(/^(?=.*[1-9])(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'Ingrese un monto positivo con hasta dos decimales.'),
  description: z.string().trim().min(1, 'La descripción es requerida.'),
  reference: z.string().trim().max(255, 'La referencia no puede superar 255 caracteres.'),
  occurredAt: z.string().regex(costaRicaDateTime, 'Indique fecha y hora válidas.'),
})

export function FinancialMovementFormModal({ onClose }: { onClose: () => void }) {
  const create = useCreateFinancialMovement()
  const form = useForm<MovementValues>({ resolver: zodResolver(schema), defaultValues: { type: '', amount: '', description: '', reference: '', occurredAt: '' } })
  const close = () => { if (!create.isPending) onClose() }
  async function submit(values: MovementValues) {
    const occurredAt = new Date(`${values.occurredAt}:00-06:00`)
    if (Number.isNaN(occurredAt.getTime())) {
      form.setError('occurredAt', { message: 'Indique fecha y hora válidas.' })
      return
    }
    try {
      await create.mutateAsync({ type: values.type as FinancialMovementType, amount: values.amount.trim(), description: values.description.trim(), ...(values.reference.trim() ? { reference: values.reference.trim() } : {}), occurredAt: occurredAt.toISOString() })
      toast.success('Movimiento financiero registrado correctamente.')
      form.reset()
      onClose()
    } catch (error) {
      toast.error(getFinancialErrorMessage(error, 'No fue posible registrar el movimiento financiero.'))
    }
  }
  const field = (name: keyof MovementValues) => ({ 'aria-invalid': Boolean(form.formState.errors[name]), 'aria-describedby': form.formState.errors[name] ? `movement-${name}-error` : undefined })
  return <Modal title="Registrar movimiento financiero" onClose={close} busy={create.isPending}>
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={create.isPending}>
      <fieldset disabled={create.isPending} className="space-y-4">
        <Field invalid={Boolean(form.formState.errors.type)}><FieldLabel htmlFor="movement-type">Tipo</FieldLabel><Select id="movement-type" {...field('type')} {...form.register('type')}><option value="">Seleccione un tipo</option>{FINANCIAL_MOVEMENT_TYPES.map(type => <option key={type} value={type}>{financialMovementTypeLabel(type)}</option>)}</Select>{form.formState.errors.type ? <FieldError id="movement-type-error" role="alert" match>{form.formState.errors.type.message}</FieldError> : null}</Field>
        <Field invalid={Boolean(form.formState.errors.amount)}><FieldLabel htmlFor="movement-amount">Monto</FieldLabel><Input id="movement-amount" inputMode="decimal" autoFocus {...field('amount')} {...form.register('amount')} />{form.formState.errors.amount ? <FieldError id="movement-amount-error" role="alert" match>{form.formState.errors.amount.message}</FieldError> : null}</Field>
        <Field invalid={Boolean(form.formState.errors.description)}><FieldLabel htmlFor="movement-description">Concepto o descripción</FieldLabel><Textarea id="movement-description" maxLength={1000} {...field('description')} {...form.register('description')} />{form.formState.errors.description ? <FieldError id="movement-description-error" role="alert" match>{form.formState.errors.description.message}</FieldError> : null}</Field>
        <Field invalid={Boolean(form.formState.errors.occurredAt)}><FieldLabel htmlFor="movement-occurred-at">Fecha y hora</FieldLabel><Input id="movement-occurred-at" type="datetime-local" {...field('occurredAt')} {...form.register('occurredAt')} />{form.formState.errors.occurredAt ? <FieldError id="movement-occurredAt-error" role="alert" match>{form.formState.errors.occurredAt.message}</FieldError> : null}</Field>
        <Field invalid={Boolean(form.formState.errors.reference)}><FieldLabel htmlFor="movement-reference">Referencia (opcional)</FieldLabel><Input id="movement-reference" maxLength={255} {...field('reference')} {...form.register('reference')} />{form.formState.errors.reference ? <FieldError id="movement-reference-error" role="alert" match>{form.formState.errors.reference.message}</FieldError> : null}</Field>
      </fieldset>
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={create.isPending} onClick={close}>Cancelar</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Registrando...' : 'Registrar movimiento'}</Button></div>
    </form>
  </Modal>
}
