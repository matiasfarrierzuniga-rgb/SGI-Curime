import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
import { useQueries } from '@tanstack/react-query'
import { CircleDollarSign, Clock3, Eye, Filter, ReceiptText } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { financialApi } from '../api/financial.api'
import { financialKeys, useFinancialChargesList } from '../hooks/useFinancial'
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
  const statusTotals = useChargeStatusTotals(filters.reservationId)
  const hasActiveFilters = filters.status !== undefined || filters.reservationId !== undefined

  const updateFilter = (update: Partial<Pick<FinancialChargeListFilters, 'status' | 'reservationId'>>) => setFilters(current => ({ ...current, ...update, page: 1 }))
  const clearFilters = () => setFilters(initialFilters)

  return <section className="space-y-6">
    <PageHeader context="Gestión financiera · Gestión transaccional" title="Cargos y pagos" description="Consulte cargos de reserva, revise su detalle y registre pagos autorizados." />
    <FinancialSectionNav />
    <ChargeOperationsSummary queries={statusTotals} />
    <form className="rounded-surface border border-border-default bg-surface-card shadow-surface" onSubmit={event => event.preventDefault()}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default bg-surface-muted/60 px-4 py-3"><div className="flex items-center gap-2"><Filter className="size-4 text-brand-primary" aria-hidden="true" /><h2 className="text-sm font-bold text-text-primary">Filtrar cargos</h2></div><p className="text-xs text-text-secondary">Los resultados y montos se actualizan según filtros.</p></div><div className="grid gap-4 p-4 md:grid-cols-5">
      <FilterSelect label="Estado" value={filters.status ?? ''} onChange={value => updateFilter({ status: value ? value as FinancialCharge['status'] : undefined })}><option value="">Todos los estados</option>{FINANCIAL_CHARGE_STATUSES.map(status => <option key={status} value={status}>{financialChargeStatusLabel(status)}</option>)}</FilterSelect>
      <FilterInput label="ID de reserva" inputMode="numeric" value={filters.reservationId?.toString() ?? ''} onChange={value => updateFilter({ reservationId: value ? Number(value) : undefined })} />
      <div className="flex items-end"><Button variant="outline" type="button" disabled={!hasActiveFilters} onClick={clearFilters}>Limpiar filtros</Button></div>
    </div></form>
    {list.isPending ? <LoadingState label="Cargando cargos financieros..." /> : null}
    {list.isError ? <ErrorState title="No fue posible cargar los cargos financieros" message={getErrorMessage(list.error)} action={<Button variant="outline" type="button" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}
    {list.data && list.data.data.length === 0 ? <EmptyState title="No hay cargos financieros" description={hasActiveFilters ? 'No hay cargos que coincidan con los filtros aplicados. Ajuste o limpie los filtros.' : 'No se han registrado cargos financieros todavía.'} action={hasActiveFilters ? <Button variant="outline" type="button" onClick={clearFilters}>Limpiar filtros</Button> : undefined} /> : null}
    {list.data && list.data.data.length > 0 ? <>
      <div className="@container overflow-x-auto rounded-surface border border-border-default bg-surface-card shadow-surface" tabIndex={0} aria-label="Listado de cargos financieros">
        <DataTable className="w-full min-w-[35rem] table-fixed text-left text-sm"><DataTableHeader className="bg-surface-muted text-caption font-semibold text-text-secondary"><DataTableRow><DataTableHead className="w-20 px-3 py-3">Cargo</DataTableHead><DataTableHead className="hidden w-24 px-3 py-3 @[42rem]:table-cell">Reserva</DataTableHead><DataTableHead className="px-3 py-3 text-right">Monto</DataTableHead><DataTableHead className="w-28 px-3 py-3">Estado</DataTableHead><DataTableHead className="hidden w-32 px-3 py-3 @[64rem]:table-cell">Creado</DataTableHead><DataTableHead className="w-44 px-3 py-3 text-right">Acciones</DataTableHead></DataTableRow></DataTableHeader><DataTableBody>{list.data.data.map(charge => <DataTableRow key={charge.id} className="border-t border-border-default align-top transition-colors hover:bg-surface-muted/70"><DataTableCell className="px-3 py-3 font-semibold text-text-primary">#{charge.id}<span className="mt-1 block text-xs font-normal text-text-secondary @[42rem]:hidden">Reserva #{charge.reservationId}</span></DataTableCell><DataTableCell className="hidden px-3 py-3 @[42rem]:table-cell">#{charge.reservationId}</DataTableCell><DataTableCell className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-text-primary">{formatFinancialCurrency(charge.amount, charge.currency)}<span className="sr-only"> {charge.currency}</span></DataTableCell><DataTableCell className="px-3 py-3"><StatusBadge variant={financialChargeStatusVariant(charge.status)}>{financialChargeStatusLabel(charge.status)}</StatusBadge></DataTableCell><DataTableCell className="hidden whitespace-nowrap px-3 py-3 text-text-secondary @[64rem]:table-cell">{formatFinancialDate(charge.createdAt)}</DataTableCell><DataTableCell className="px-3 py-3"><div className="flex flex-col items-end gap-2 @[70rem]:flex-row @[70rem]:justify-end"><Button size="sm" variant="outline" type="button" onClick={() => setSelectedId(charge.id)}><Eye className="size-4" aria-hidden="true" /><span className="sr-only @[50rem]:not-sr-only @[50rem]:ml-1">Ver detalle</span></Button>{charge.status === 'PENDING' && Number(charge.balance ?? charge.amount) > 0 && hasCapability(user?.permissionCodes, 'fin.payments.record') ? <Button size="sm" type="button" onClick={() => setPayingCharge(charge)}>Registrar pago</Button> : null}</div></DataTableCell></DataTableRow>)}</DataTableBody></DataTable>
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

function useChargeStatusTotals(reservationId: number | undefined) { return useQueries({ queries: FINANCIAL_CHARGE_STATUSES.map(status => { const filters = { status, reservationId, page: 1, limit: 1 }; return { queryKey: financialKeys.chargeList(filters), queryFn: () => financialApi.listCharges(filters) } }) }) }

function ChargeOperationsSummary({ queries }: { queries: ReturnType<typeof useChargeStatusTotals> }) {
  const values = FINANCIAL_CHARGE_STATUSES.map((status, index) => ({ status, total: queries[index].data?.total ?? 0 }))
  const total = values.reduce((sum, item) => sum + item.total, 0)
  const pending = values.find(item => item.status === 'PENDING')!.total
  const paid = values.find(item => item.status === 'PAID')!.total
  const cancelled = values.find(item => item.status === 'CANCELLED')!.total
  const loading = queries.some(query => query.isPending)
  const error = queries.some(query => query.isError)
  return <section className="overflow-hidden rounded-surface border border-border-default bg-surface-card shadow-surface" aria-labelledby="charge-queue-title"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default bg-brand-primary/[0.06] px-4 py-3"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-control bg-brand-primary text-primary-foreground"><ReceiptText className="size-4" aria-hidden="true" /></span><div><h2 className="text-sm font-bold text-text-primary" id="charge-queue-title">Control de cobros</h2><p className="text-xs text-text-secondary">Estado actual de cargos por reserva y sus pagos.</p></div></div><span className="text-xs text-text-secondary">{loading ? 'Actualizando estados…' : error ? 'Estado parcial disponible' : 'Distribución actual'}</span></div><div className="grid divide-y divide-border-default sm:grid-cols-4 sm:divide-x sm:divide-y-0"><ChargeDatum icon={<ReceiptText />} label="Total de cargos" value={loading ? '—' : total} /><ChargeDatum icon={<CircleDollarSign />} label="Pagados" value={loading ? '—' : paid} tone="success" /><ChargeDatum icon={<Clock3 />} label="Pendientes" value={loading ? '—' : pending} tone="warning" /><ChargeDatum icon={<Eye />} label="Cancelados" value={loading ? '—' : cancelled} tone="neutral" /></div>{!loading && total > 0 ? <div className="flex h-2 bg-surface-muted" aria-label={`Distribución: ${paid} pagados, ${pending} pendientes y ${cancelled} cancelados`}><span className="bg-status-success" style={{ width: `${paid / total * 100}%` }} /><span className="bg-[#e7c477]" style={{ width: `${pending / total * 100}%` }} /><span className="bg-status-neutral" style={{ width: `${cancelled / total * 100}%` }} /></div> : null}</section>
}

function ChargeDatum({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string | number; tone?: 'success' | 'warning' | 'neutral' }) { const color = tone === 'success' ? 'bg-status-success-surface text-status-success' : tone === 'warning' ? 'bg-[#fff0c9] text-brand-ink' : tone === 'neutral' ? 'bg-surface-muted text-text-secondary' : 'bg-brand-primary/10 text-brand-primary'; return <div className="flex gap-3 p-4"><span className={`grid size-9 shrink-0 place-items-center rounded-control ${color}`} aria-hidden="true">{icon}</span><div><dt className="text-sm text-text-secondary">{label}</dt><dd className="mt-0.5 text-heading-3 font-bold tabular-nums text-text-primary">{value}</dd></div></div> }
