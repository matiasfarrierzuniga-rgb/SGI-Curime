import { CircleDollarSign, CreditCard, ReceiptText } from 'lucide-react'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useFinancialChargeDetail } from '../hooks/useFinancial'
import type { FinancialCharge } from '../model/financial.types'
import { financialChargeStatusLabel, financialChargeStatusVariant, formatFinancialCurrency, formatFinancialDate, paymentMethodLabel, paymentStatusLabel } from './financialPresentation'

type FinancialDetailModalProps = { id: number; permissionCodes: readonly string[] | null | undefined; onClose: () => void; onRecord: (charge: FinancialCharge) => void }

export function FinancialDetailModal({ id, permissionCodes, onClose, onRecord }: FinancialDetailModalProps) {
  const detail = useFinancialChargeDetail(id)
  const status = (detail.error as { response?: { status?: number } } | null)?.response?.status
  const balance = detail.data?.balance ?? (detail.data?.status === 'PENDING' ? detail.data.amount : '0.00')
  const mayRecord = detail.data?.status === 'PENDING' && Number(balance) > 0 && hasCapability(permissionCodes, 'fin.payments.record')
  return <Modal title={`Cargo financiero #${id}`} onClose={onClose} busy={false}>
    {detail.isPending ? <LoadingState label="Cargando detalle del cargo..." /> : null}
    {detail.isError ? <ErrorState title={status === 404 ? 'Cargo financiero no encontrado' : 'No fue posible cargar el cargo'} message={status === 404 ? 'El cargo solicitado no existe o fue eliminado.' : 'Ocurrió un error al consultar el detalle del cargo.'} action={<button type="button" onClick={() => void detail.refetch()}>Reintentar</button>} /> : null}
    {detail.data ? <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2"><ReceiptText className="size-5 text-brand-primary" aria-hidden="true" /><span className="text-sm font-semibold text-text-primary">Reserva #{detail.data.reservationId}</span></span><StatusBadge variant={financialChargeStatusVariant(detail.data.status)}>{financialChargeStatusLabel(detail.data.status)}</StatusBadge></div>
      <div className="grid gap-3 rounded-control border border-brand-accent/40 bg-brand-accent/10 p-4 sm:grid-cols-2"><span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-control bg-surface-card text-brand-ink"><CircleDollarSign aria-hidden="true" /></span><span><span className="block text-xs font-semibold text-text-secondary">Monto original</span><strong className="block text-heading-3 tabular-nums text-text-primary">{formatFinancialCurrency(detail.data.amount, detail.data.currency)}</strong></span></span><span><span className="block text-xs font-semibold text-text-secondary">Balance pendiente</span><strong className="block text-heading-3 tabular-nums text-text-primary">{formatFinancialCurrency(balance, detail.data.currency)}</strong></span></div>
      <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <Detail label="ID de cargo" value={`#${detail.data.id}`} />
        <Detail label="ID de reserva" value={`#${detail.data.reservationId}`} />
        <Detail label="Monto original" value={formatFinancialCurrency(detail.data.amount, detail.data.currency)} />
        <Detail label="Balance" value={formatFinancialCurrency(detail.data.balance ?? (detail.data.status === 'PENDING' ? detail.data.amount : '0.00'), detail.data.currency)} />
        <Detail label="Moneda" value={detail.data.currency} />
        <Detail label="Estado" value={financialChargeStatusLabel(detail.data.status)} />
        <Detail label="Vencimiento" value={formatFinancialDate(detail.data.dueAt)} />
        <Detail label="Actualizado" value={formatFinancialDate(detail.data.updatedAt)} />
      </dl>
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary"><CreditCard className="size-4 text-brand-primary" aria-hidden="true" />Pagos registrados</h3>
        {detail.data.payments.length === 0 ? <p className="rounded-control bg-surface-muted p-3 text-sm text-text-secondary">Sin pagos registrados</p> : <ol className="space-y-2">{detail.data.payments.map(payment => <li key={payment.id} className="rounded-control border border-border-default bg-surface-muted p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold tabular-nums text-text-primary">{formatFinancialCurrency(payment.amount, detail.data.currency)}</span><StatusBadge variant={paymentStatusVariant(payment.status)}>{paymentStatusLabel(payment.status)}</StatusBadge></div><dl className="mt-2 grid gap-x-6 gap-y-1 text-text-secondary sm:grid-cols-2"><div><dt className="inline font-semibold">Método: </dt><dd className="inline">{paymentMethodLabel(payment.method)}</dd></div><div><dt className="inline font-semibold">Referencia: </dt><dd className="inline">{payment.reference ?? 'Sin referencia'}</dd></div><div><dt className="inline font-semibold">Pagado: </dt><dd className="inline">{formatFinancialDate(payment.paidAt)}</dd></div><div><dt className="inline font-semibold">Registrado por: </dt><dd className="inline">Usuario #{payment.recordedById}</dd></div></dl></li>)}</ol>}
      </div>
      {mayRecord ? <div className="flex flex-wrap justify-end"><Button size="sm" type="button" onClick={() => onRecord(detail.data)}>Registrar pago</Button></div> : null}
    </div> : null}
  </Modal>
}

function paymentStatusVariant(status: string) {
  return ({ PENDING: 'warning', CONFIRMED: 'success', CANCELLED: 'neutral' }[status as 'PENDING' | 'CONFIRMED' | 'CANCELLED'] ?? 'neutral') as 'warning' | 'success' | 'neutral'
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-semibold text-foreground-muted">{label}</dt><dd className="mt-1">{value}</dd></div>
}
