import { CircleDollarSign, Clock3, Eye, ReceiptText } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useFinancialChargesList } from '../hooks/useFinancial'
import { FINANCIAL_CHARGE_STATUSES, type FinancialCharge, type FinancialChargeListFilters } from '../model/financial.types'
import { FinancialDetailModal } from './FinancialDetailModal'
import { FinancialPaymentModal } from './FinancialPaymentModal'
import { FinancialSectionNav } from './FinancialSectionNav'
import { financialChargeStatusLabel, financialChargeStatusVariant, formatFinancialCurrency, formatFinancialDate } from './financialPresentation'

const initialFilters: FinancialChargeListFilters = { page: 1, limit: 20 }

export function FinancialPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<FinancialChargeListFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [payingCharge, setPayingCharge] = useState<FinancialCharge | null>(null)
  const list = useFinancialChargesList(filters)
  const hasActiveFilters = filters.status !== undefined || filters.reservationId !== undefined

  const updateFilter = (update: Partial<Pick<FinancialChargeListFilters, 'status' | 'reservationId'>>) => setFilters(current => ({ ...current, ...update, page: 1 }))
  const clearFilters = () => setFilters(initialFilters)

  return <section className="space-y-6">
    <PageHeader context="Gestión financiera" title="Cargos de reservas" description="Consulte cargos de reserva, revise su detalle y registre pagos autorizados." />
    <FinancialSectionNav />
    {list.data ? <section aria-label="Indicadores de cargos" className="grid gap-4 sm:grid-cols-3">
      <MetricCard label="Cargos encontrados" value={list.data.total} icon={<ReceiptText />} supportingText="Resultado total según los filtros aplicados." />
      <MetricCard label="Pendientes en esta página" value={list.data.data.filter((charge) => charge.status === 'PENDING').length} icon={<Clock3 />} state="warning" stateLabel="Requieren seguimiento" />
      <MetricCard label="Monto visible" value={formatFinancialCurrency(list.data.data.reduce((total, charge) => total + Number(charge.amount), 0).toFixed(2))} icon={<CircleDollarSign />} supportingText="Suma de cargos mostrados; no representa el total paginado." />
    </section> : null}
    <form className="grid gap-4 rounded-surface border border-border-default bg-surface-card p-4 shadow-surface md:grid-cols-5" onSubmit={event => event.preventDefault()}>
      <FilterSelect label="Estado" value={filters.status ?? ''} onChange={value => updateFilter({ status: value ? value as FinancialCharge['status'] : undefined })}><option value="">Todos los estados</option>{FINANCIAL_CHARGE_STATUSES.map(status => <option key={status} value={status}>{financialChargeStatusLabel(status)}</option>)}</FilterSelect>
      <FilterInput label="ID de reserva" inputMode="numeric" value={filters.reservationId?.toString() ?? ''} onChange={value => updateFilter({ reservationId: value ? Number(value) : undefined })} />
      <div className="flex items-end"><Button variant="outline" type="button" disabled={!hasActiveFilters} onClick={clearFilters}>Limpiar filtros</Button></div>
    </form>
    {list.isPending ? <LoadingState label="Cargando cargos financieros..." /> : null}
    {list.isError ? <ErrorState title="No fue posible cargar los cargos financieros" message={getErrorMessage(list.error)} action={<Button variant="outline" type="button" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}
    {list.data && list.data.data.length === 0 ? <EmptyState title="No hay cargos financieros" description={hasActiveFilters ? 'No hay cargos que coincidan con los filtros aplicados. Ajuste o limpie los filtros.' : 'No se han registrado cargos financieros todavía.'} action={hasActiveFilters ? <Button variant="outline" type="button" onClick={clearFilters}>Limpiar filtros</Button> : undefined} /> : null}
    {list.data && list.data.data.length > 0 ? <>
      <div className="@container overflow-x-auto rounded-surface border border-border-default bg-surface-card shadow-surface" tabIndex={0} aria-label="Listado de cargos financieros">
        <table className="w-full min-w-[35rem] table-fixed text-left text-sm"><thead className="bg-surface-muted text-caption font-semibold text-text-secondary"><tr><th className="w-20 px-3 py-3">Cargo</th><th className="hidden w-24 px-3 py-3 @[42rem]:table-cell">Reserva</th><th className="px-3 py-3 text-right">Monto</th><th className="w-28 px-3 py-3">Estado</th><th className="hidden w-32 px-3 py-3 @[56rem]:table-cell">Creado</th><th className="w-32 px-3 py-3 text-right">Acciones</th></tr></thead><tbody>{list.data.data.map(charge => <tr key={charge.id} className="border-t border-border-default align-top transition-colors hover:bg-surface-muted/70"><td className="px-3 py-3 font-semibold text-text-primary">#{charge.id}<span className="mt-1 block text-xs font-normal text-text-secondary @[42rem]:hidden">Reserva #{charge.reservationId}</span></td><td className="hidden px-3 py-3 @[42rem]:table-cell">#{charge.reservationId}</td><td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-text-primary">{formatFinancialCurrency(charge.amount, charge.currency)}<span className="sr-only"> {charge.currency}</span></td><td className="px-3 py-3"><StatusBadge variant={financialChargeStatusVariant(charge.status)}>{financialChargeStatusLabel(charge.status)}</StatusBadge></td><td className="hidden whitespace-nowrap px-3 py-3 text-text-secondary @[56rem]:table-cell">{formatFinancialDate(charge.createdAt)}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" type="button" onClick={() => setSelectedId(charge.id)}><Eye className="size-4" aria-hidden="true" /><span className="sr-only @[50rem]:not-sr-only @[50rem]:ml-1">Ver detalle</span></Button>{charge.status === 'PENDING' && Number(charge.balance ?? charge.amount) > 0 && hasCapability(user?.permissionCodes, 'fin.payments.record') ? <Button size="sm" type="button" onClick={() => setPayingCharge(charge)}>Registrar pago</Button> : null}</div></td></tr>)}</tbody></table>
      </div>
      <Pagination page={list.data.page} total={list.data.total} limit={list.data.limit} onChange={page => setFilters(current => ({ ...current, page }))} />
    </> : null}
    {selectedId !== null ? <FinancialDetailModal id={selectedId} permissionCodes={user?.permissionCodes} onClose={() => setSelectedId(null)} onRecord={setPayingCharge} /> : null}
    {payingCharge !== null ? <FinancialPaymentModal charge={payingCharge} onClose={() => setPayingCharge(null)} /> : null}
  </section>
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = `financial-filter-${label.toLowerCase()}`
  return <label className="grid gap-1 text-sm font-semibold" htmlFor={id}>{label}<select className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</select></label>
}

function FilterInput({ label, inputMode, value, onChange }: { label: string; inputMode: 'numeric'; value: string; onChange: (value: string) => void }) {
  const id = `financial-filter-${label.toLowerCase()}`
  return <label className="grid gap-1 text-sm font-semibold" htmlFor={id}>{label}<input className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" id={id} type="text" inputMode={inputMode} value={value} onChange={event => onChange(event.target.value)} /></label>
}
