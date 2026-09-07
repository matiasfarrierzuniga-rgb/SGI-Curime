import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/button'
import { useRecordPayment } from '../hooks/useFinancial'
import { PAYMENT_METHODS, type FinancialCharge, type PaymentMethod } from '../model/financial.types'
import { formatFinancialCurrency, getFinancialErrorMessage, paymentMethodLabel } from './financialPresentation'

type PaymentValues = { amount: string; method: string; reference: string }
const decimalAmountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
function toMinorUnits(value: string) {
  if (!decimalAmountPattern.test(value.trim())) return null
  const [whole, fraction = ''] = value.trim().split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}
function paymentSchema(balance: string) { return z.object({
  amount: z.string().trim().min(1, 'El monto es requerido.').regex(decimalAmountPattern, 'Ingrese un monto válido con hasta dos decimales.').refine(value => (toMinorUnits(value) ?? 0n) > 0n, 'El monto debe ser mayor que cero.').refine(value => { const amount = toMinorUnits(value); const required = toMinorUnits(balance); return amount !== null && required !== null && amount === required }, 'El monto debe coincidir exactamente con el saldo pendiente.'),
  method: z.string().min(1, 'Seleccione un método de pago.'),
  reference: z.string().trim().max(255, 'La referencia no puede superar 255 caracteres.'),
}) }

type FinancialPaymentModalProps = { charge: FinancialCharge; onClose: () => void }

export function FinancialPaymentModal({ charge, onClose }: FinancialPaymentModalProps) {
  const record = useRecordPayment()
  const form = useForm<PaymentValues>({ resolver: zodResolver(paymentSchema(charge.balance)), defaultValues: { amount: charge.balance, method: '', reference: '' } })
  const close = () => { if (!record.isPending) onClose() }
  async function submit(values: PaymentValues) {
    try {
      await record.mutateAsync({ id: charge.id, payload: { amount: values.amount.trim(), method: values.method as PaymentMethod, ...(values.reference.trim() ? { reference: values.reference.trim() } : {}) } })
      toast.success('Pago registrado correctamente.')
      onClose()
    } catch (error) {
      toast.error(getFinancialErrorMessage(error, 'No fue posible registrar el pago.'))
      if ((error as { response?: { status?: number } }).response?.status === 409) onClose()
    }
  }
  return <Modal title={`Registrar pago · Cargo #${charge.id}`} onClose={close} busy={record.isPending}>
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)} aria-busy={record.isPending}>
      <div className="rounded-xl border border-border bg-surface-muted p-3 text-sm"><span className="font-semibold text-foreground-muted">Monto del cargo: </span><span className="font-semibold">{formatFinancialCurrency(charge.amount, charge.currency)}</span></div>
      <div className="grid gap-2"><label htmlFor="payment-amount">Monto a liquidar</label><p id="payment-amount-help" className="text-xs text-foreground-muted">Saldo pendiente: {formatFinancialCurrency(charge.balance, charge.currency)}. Debe liquidarse en un único pago exacto.</p><input id="payment-amount" inputMode="decimal" autoFocus aria-invalid={Boolean(form.formState.errors.amount)} aria-describedby={form.formState.errors.amount ? 'payment-amount-help payment-amount-error' : 'payment-amount-help'} {...form.register('amount')} /></div>
      {form.formState.errors.amount ? <p id="payment-amount-error" role="alert" className="field-error">{form.formState.errors.amount.message}</p> : null}
      <label className="grid gap-2" htmlFor="payment-method">Método de pago<select id="payment-method" aria-invalid={Boolean(form.formState.errors.method)} aria-describedby={form.formState.errors.method ? 'payment-method-error' : undefined} {...form.register('method')}><option value="">Seleccione un método</option>{PAYMENT_METHODS.map(method => <option key={method} value={method}>{paymentMethodLabel(method)}</option>)}</select></label>
      {form.formState.errors.method ? <p id="payment-method-error" role="alert" className="field-error">{form.formState.errors.method.message}</p> : null}
      <div className="grid gap-2"><label htmlFor="payment-reference">Referencia (opcional)</label><p id="payment-reference-help" className="text-xs text-foreground-muted">Útil para transferencias bancarias, SINPE Móvil u otros.</p><input id="payment-reference" maxLength={255} aria-describedby={form.formState.errors.reference ? 'payment-reference-help payment-reference-error' : 'payment-reference-help'} {...form.register('reference')} /></div>
      {form.formState.errors.reference ? <p id="payment-reference-error" role="alert" className="field-error">{form.formState.errors.reference.message}</p> : null}
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" type="button" disabled={record.isPending} onClick={close}>Cancelar</Button><Button type="submit" disabled={record.isPending}>{record.isPending ? 'Registrando pago...' : 'Liquidar cargo'}</Button></div>
    </form>
  </Modal>
}
