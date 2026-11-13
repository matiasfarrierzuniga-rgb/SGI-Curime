import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
import { ArrowDownRight, ArrowUpRight, Eye, Scale } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useFinancialMovementSummary, useFinancialMovementsList } from '../hooks/useFinancial'
import { FINANCIAL_MOVEMENT_TYPES, type FinancialMovementListFilters, type FinancialMovementType } from '../model/financial.types'
import { FinancialMovementDetailModal } from './FinancialMovementDetailModal'
import { FinancialMovementFormModal } from './FinancialMovementFormModal'
import { FinancialSectionNav } from './FinancialSectionNav'
import { financialMovementSourceLabel, financialMovementTypeLabel, formatFinancialCurrency, formatFinancialDate } from './financialPresentation'

const initialFilters: FinancialMovementListFilters = { page: 1, limit: 20 }

export function FinancialMovementsPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<FinancialMovementListFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const id = Number(new URLSearchParams(window.location.search).get('movementId'))
    return Number.isInteger(id) && id > 0 ? id : null
  })
  const [creating, setCreating] = useState(false)
  const canReadMovements = hasCapability(user?.permissionCodes, 'fin.movements.read')
  const list = useFinancialMovementsList(filters, canReadMovements)
  const summary = useFinancialMovementSummary({ dateFrom: filters.dateFrom, dateTo: filters.dateTo }, canReadMovements)
  const hasActiveFilters = Boolean(filters.type || filters.dateFrom || filters.dateTo)
  const update = (change: Partial<FinancialMovementListFilters>) => setFilters(current => ({ ...current, ...change, page: 1 }))
  const mayCreate = hasCapability(user?.permissionCodes, 'fin.movements.create')
  if (!canReadMovements) return <ErrorState title="Acceso restringido" message="No tiene permiso para consultar movimientos financieros." />
  return <section className="space-y-6">
    <PageHeader context="Gestión financiera" title="Movimientos financieros" description="Registre ingresos y egresos manuales, consulte su historial y balance." actions={mayCreate ? <Button type="button" onClick={() => setCreating(true)}>Registrar movimiento</Button> : undefined} />
    <FinancialSectionNav />
     <form className="grid gap-4 rounded-surface border border-erp-border bg-erp-surface-raised p-5 shadow-elevation-0 sm:grid-cols-2 lg:grid-cols-4" onSubmit={event => event.preventDefault()}>
       <label className="grid gap-1 text-label font-semibold text-erp-text" htmlFor="movement-filter-type">Tipo<select className="min-h-11 rounded-control border border-erp-border bg-erp-surface-raised px-3 text-body font-normal text-erp-text focus-visible:border-erp-focus focus-visible:ring-3 focus-visible:ring-erp-focus/30" id="movement-filter-type" value={filters.type ?? ''} onChange={event => update({ type: event.target.value ? event.target.value as FinancialMovementType : undefined })}><option value="">Todos los tipos</option>{FINANCIAL_MOVEMENT_TYPES.map(type => <option key={type} value={type}>{financialMovementTypeLabel(type)}</option>)}</select></label>
       <label className="grid gap-1 text-label font-semibold text-erp-text" htmlFor="movement-filter-from">Desde<input className="min-h-11 rounded-control border border-erp-border bg-erp-surface-raised px-3 text-body font-normal text-erp-text focus-visible:border-erp-focus focus-visible:ring-3 focus-visible:ring-erp-focus/30" id="movement-filter-from" type="date" value={filters.dateFrom ?? ''} onChange={event => update({ dateFrom: event.target.value || undefined })} /></label>
       <label className="grid gap-1 text-label font-semibold text-erp-text" htmlFor="movement-filter-to">Hasta<input className="min-h-11 rounded-control border border-erp-border bg-erp-surface-raised px-3 text-body font-normal text-erp-text focus-visible:border-erp-focus focus-visible:ring-3 focus-visible:ring-erp-focus/30" id="movement-filter-to" type="date" value={filters.dateTo ?? ''} onChange={event => update({ dateTo: event.target.value || undefined })} /></label>
      <div className="flex items-end"><Button type="button" variant="outline" disabled={!hasActiveFilters} onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button></div>
    </form>
    <section aria-label="Resumen de movimientos" className="grid gap-4 sm:grid-cols-3">
      {summary.isPending ? <div className="sm:col-span-3"><LoadingState label="Calculando resumen financiero..." /></div> : null}
      {summary.isError ? <div className="sm:col-span-3"><ErrorState title="No fue posible cargar el resumen" message={getErrorMessage(summary.error)} action={<Button type="button" variant="outline" onClick={() => void summary.refetch()}>Reintentar</Button>} /></div> : null}
      {summary.data ? <><Summary label="Ingresos" value={formatFinancialCurrency(summary.data.totalIncome, summary.data.currency)} icon={<ArrowUpRight />} state="success" /><Summary label="Egresos" value={formatFinancialCurrency(summary.data.totalExpenses, summary.data.currency)} icon={<ArrowDownRight />} state="warning" /><Summary label="Balance" value={formatFinancialCurrency(summary.data.balance, summary.data.currency)} icon={<Scale />} state="neutral" /></> : null}
    </section>
    {list.isPending ? <LoadingState label="Cargando movimientos financieros..." /> : null}
    {list.isError ? <ErrorState title="No fue posible cargar los movimientos" message={getErrorMessage(list.error)} action={<Button type="button" variant="outline" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}
    {list.data?.data.length === 0 ? <EmptyState title="No hay movimientos financieros" description={hasActiveFilters ? 'No hay movimientos que coincidan con los filtros aplicados.' : 'Registre un ingreso o egreso manual para iniciar el historial.'} action={hasActiveFilters ? <Button type="button" variant="outline" onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button> : undefined} /> : null}
    {list.data?.data.length ? <><div className="@container overflow-x-auto rounded-surface border border-erp-border bg-erp-surface-raised shadow-elevation-0" tabIndex={0} aria-label="Listado de movimientos financieros"><DataTable className="w-full min-w-[38rem] table-fixed text-left text-sm"><DataTableHeader className="bg-erp-surface-subtle text-caption font-semibold text-erp-text-muted"><DataTableRow><DataTableHead className="hidden w-32 px-3 py-3 @[42rem]:table-cell">Fecha</DataTableHead><DataTableHead className="w-24 px-3 py-3">Tipo</DataTableHead><DataTableHead className="px-3 py-3">Concepto</DataTableHead><DataTableHead className="w-32 px-3 py-3 text-right">Monto</DataTableHead><DataTableHead className="hidden w-36 px-3 py-3 @[54rem]:table-cell">Origen</DataTableHead><DataTableHead className="hidden w-28 px-3 py-3 @[64rem]:table-cell">Registró</DataTableHead><DataTableHead className="w-20 px-3 py-3 text-right">Acción</DataTableHead></DataTableRow></DataTableHeader><DataTableBody>{list.data.data.map(movement => <DataTableRow key={movement.id} className="border-t border-erp-border align-top transition-colors hover:bg-erp-surface-subtle/70"><DataTableCell className="hidden whitespace-nowrap px-3 py-3 text-erp-text-muted @[42rem]:table-cell">{formatFinancialDate(movement.occurredAt)}</DataTableCell><DataTableCell className="px-3 py-3"><StatusBadge variant={movement.type === 'INCOME' ? 'success' : 'danger'}>{financialMovementTypeLabel(movement.type)}</StatusBadge></DataTableCell><DataTableCell className="px-3 py-3"><span className="block break-words font-medium text-erp-text">{movement.description}</span><span className="mt-1 block text-xs text-erp-text-muted @[42rem]:hidden">{formatFinancialDate(movement.occurredAt)} · {financialMovementSourceLabel(movement.source)}</span></DataTableCell><DataTableCell className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-erp-text">{formatFinancialCurrency(movement.amount, movement.currency)}</DataTableCell><DataTableCell className="hidden px-3 py-3 text-erp-text-muted @[54rem]:table-cell">{financialMovementSourceLabel(movement.source)}</DataTableCell><DataTableCell className="hidden px-3 py-3 text-erp-text-muted @[64rem]:table-cell">{movement.recordedById ? `Usuario #${movement.recordedById}` : 'Sin registro'}</DataTableCell><DataTableCell className="px-3 py-3 text-right"><Button size="sm" type="button" variant="outline" onClick={() => setSelectedId(movement.id)}><Eye className="size-4" aria-hidden="true" /><span className="sr-only @[48rem]:not-sr-only @[48rem]:ml-1">Ver detalle</span></Button></DataTableCell></DataTableRow>)}</DataTableBody></DataTable></div><Pagination page={list.data.page} total={list.data.total} limit={list.data.limit} onChange={page => setFilters(current => ({ ...current, page }))} /></> : null}
    {creating ? <FinancialMovementFormModal onClose={() => setCreating(false)} /> : null}
    {selectedId !== null ? <FinancialMovementDetailModal id={selectedId} onClose={() => { setSelectedId(null); const url = new URL(window.location.href); url.searchParams.delete('movementId'); window.history.replaceState(null, '', url) }} /> : null}
  </section>
}

function Summary({ label, value, icon, state }: { label: string; value: string; icon: ReactNode; state: 'success' | 'warning' | 'neutral' }) {
  return <MetricCard className="border-erp-border transition-[border-color,box-shadow] hover:border-brand-primary/30 hover:shadow-md" label={label} value={value} icon={icon} state={state} stateLabel="Período filtrado" />
}
