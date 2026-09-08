import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { useFinancialMovementDetail } from '../hooks/useFinancial'
import { financialMovementSourceLabel, financialMovementTypeLabel, formatFinancialCurrency, formatFinancialDate } from './financialPresentation'

export function FinancialMovementDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const detail = useFinancialMovementDetail(id)
  return <Modal title={`Movimiento financiero #${id}`} onClose={onClose} busy={false}>
    {detail.isPending ? <LoadingState label="Cargando detalle del movimiento..." /> : null}
    {detail.isError ? <ErrorState title="No fue posible cargar el movimiento" message="El movimiento solicitado no existe o no está disponible." action={<Button type="button" variant="outline" onClick={() => void detail.refetch()}>Reintentar</Button>} /> : null}
    {detail.data ? <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
      <Detail label="Tipo" value={financialMovementTypeLabel(detail.data.type)} />
      <Detail label="Monto" value={formatFinancialCurrency(detail.data.amount, detail.data.currency)} />
      <Detail label="Concepto" value={detail.data.description} />
      <Detail label="Fuente" value={financialMovementSourceLabel(detail.data.source)} />
      <Detail label="Fecha" value={formatFinancialDate(detail.data.occurredAt)} />
      <Detail label="Referencia" value={detail.data.reference ?? 'Sin referencia'} />
      <Detail label="Registrado por" value={detail.data.recordedBy?.fullName ?? (detail.data.recordedById ? `Usuario #${detail.data.recordedById}` : 'Sin registro')} />
      <Detail label="Actualizado" value={formatFinancialDate(detail.data.updatedAt)} />
    </dl> : null}
  </Modal>
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-semibold text-foreground-muted">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>
}
