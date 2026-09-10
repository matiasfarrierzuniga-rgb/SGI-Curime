import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { useRecordPayment } from '../hooks/useFinancial'
import { PAYMENT_METHODS, type FinancialCharge, type PaymentMethod } from '../model/financial.types'
import { formatFinancialCurrency, getFinancialErrorMessage, paymentMethodLabel } from './financialPresentation'

type PaymentValues = { amount: string; method: string; reference: string }
const paymentSchema = z.object({
  amount: z.string().trim().min(1, 'El monto es requerido.').regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'Ingrese un monto válido con hasta dos decimales.'),
  method: z.string().min(1, 'Seleccione un método de pago.'),
  reference: z.string().trim().max(255, 'La referencia no puede superar 255 caracteres.'),
})

type FinancialPaymentModalProps = { charge: FinancialCharge; onClose: () => void }

export function FinancialPaymentModal({ charge, onClose }: FinancialPaymentModalProps) {
  const record = useRecordPayment()
  const form = useForm<PaymentValues>({ resolver: zodResolver(paymentSchema), defaultValues: { amount: charge.amount, method: '', reference: '' } })
  const close = () => { if (!record.isPending) onClose() }
  async function submit(values: PaymentValues) {
    try {
      await record.mutateAsync({ id: charge.id, payload: { amount: values.amount.trim(), method: values.method as PaymentMethod, ...(values.reference.trim() ? { reference: values.reference.trim() } : {}) } })
      toast.success('Pago registrado correctamente.')
      onClose()
    } catch (error) {
      toast.error(getFinancialErrorMessage(error, 'No fue posible registrar el pago.'))
    }
  }
  return <Modal title={`Registrar pago · Cargo #${charge.id}`} onClose={close} busy={record.isPending}>
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={record.isPending}>
      <div className="rounded-xl border border-border bg-surface-muted p-3 text-sm"><span className="font-semibold text-foreground-muted">Monto del cargo: </span><span className="font-semibold">{formatFinancialCurrency(charge.amount, charge.currency)}</span></div>
      <Field invalid={Boolean(form.formState.errors.amount)}><FieldLabel htmlFor="payment-amount">Monto a pagar</FieldLabel><FieldDescription id="payment-amount-help">Debe ser exacto al monto del cargo.</FieldDescription><Input id="payment-amount" inputMode="decimal" autoFocus aria-invalid={Boolean(form.formState.errors.amount)} aria-describedby={form.formState.errors.amount ? 'payment-amount-help payment-amount-error' : 'payment-amount-help'} {...form.register('amount')} />{form.formState.errors.amount ? <FieldError id="payment-amount-error" role="alert" match>{form.formState.errors.amount.message}</FieldError> : null}</Field>
      <Field invalid={Boolean(form.formState.errors.method)}><FieldLabel htmlFor="payment-method">Método de pago</FieldLabel><Select id="payment-method" aria-invalid={Boolean(form.formState.errors.method)} aria-describedby={form.formState.errors.method ? 'payment-method-error' : undefined} {...form.register('method')}><option value="">Seleccione un método</option>{PAYMENT_METHODS.map(method => <option key={method} value={method}>{paymentMethodLabel(method)}</option>)}</Select>{form.formState.errors.method ? <FieldError id="payment-method-error" role="alert" match>{form.formState.errors.method.message}</FieldError> : null}</Field>
      <Field invalid={Boolean(form.formState.errors.reference)}><FieldLabel htmlFor="payment-reference">Referencia (opcional)</FieldLabel><FieldDescription id="payment-reference-help">Útil para transferencias bancarias, SINPE Móvil u otros.</FieldDescription><Input id="payment-reference" maxLength={255} aria-invalid={Boolean(form.formState.errors.reference)} aria-describedby={form.formState.errors.reference ? 'payment-reference-help payment-reference-error' : 'payment-reference-help'} {...form.register('reference')} />{form.formState.errors.reference ? <FieldError id="payment-reference-error" role="alert" match>{form.formState.errors.reference.message}</FieldError> : null}</Field>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" type="button" disabled={record.isPending} onClick={close}>Cancelar</Button><Button type="submit" disabled={record.isPending}>{record.isPending ? 'Registrando pago...' : 'Registrar pago'}</Button></div>
    </form>
  </Modal>
}
