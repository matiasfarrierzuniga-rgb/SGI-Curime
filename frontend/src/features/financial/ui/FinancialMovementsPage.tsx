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
  const list = useFinancialMovementsList(filters)
  const summary = useFinancialMovementSummary({ dateFrom: filters.dateFrom, dateTo: filters.dateTo })
  const hasActiveFilters = Boolean(filters.type || filters.dateFrom || filters.dateTo)
  const update = (change: Partial<FinancialMovementListFilters>) => setFilters(current => ({ ...current, ...change, page: 1 }))
  const mayCreate = hasCapability(user?.permissionCodes, 'fin.movements.create')
  return <section className="space-y-6">
    <PageHeader context="Gestión financiera" title="Movimientos financieros" description="Registre ingresos y egresos manuales, consulte su historial y balance." actions={mayCreate ? <Button type="button" onClick={() => setCreating(true)}>Registrar movimiento</Button> : undefined} />
    <FinancialSectionNav />
    <form className="grid gap-4 rounded-surface border border-border-default bg-surface-card p-4 shadow-surface sm:grid-cols-2 lg:grid-cols-4" onSubmit={event => event.preventDefault()}>
      <label className="grid gap-1 text-sm font-semibold" htmlFor="movement-filter-type">Tipo<select className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" id="movement-filter-type" value={filters.type ?? ''} onChange={event => update({ type: event.target.value ? event.target.value as FinancialMovementType : undefined })}><option value="">Todos los tipos</option>{FINANCIAL_MOVEMENT_TYPES.map(type => <option key={type} value={type}>{financialMovementTypeLabel(type)}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-semibold" htmlFor="movement-filter-from">Desde<input className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" id="movement-filter-from" type="date" value={filters.dateFrom ?? ''} onChange={event => update({ dateFrom: event.target.value || undefined })} /></label>
      <label className="grid gap-1 text-sm font-semibold" htmlFor="movement-filter-to">Hasta<input className="min-h-11 rounded-control border border-border-default bg-control px-3 text-base font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" id="movement-filter-to" type="date" value={filters.dateTo ?? ''} onChange={event => update({ dateTo: event.target.value || undefined })} /></label>
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
    {list.data?.data.length ? <><div className="@container overflow-x-auto rounded-surface border border-border-default bg-surface-card shadow-surface" tabIndex={0} aria-label="Listado de movimientos financieros"><table className="w-full min-w-[38rem] table-fixed text-left text-sm"><thead className="bg-surface-muted text-caption font-semibold text-text-secondary"><tr><th className="hidden w-32 px-3 py-3 @[42rem]:table-cell">Fecha</th><th className="w-24 px-3 py-3">Tipo</th><th className="px-3 py-3">Concepto</th><th className="w-32 px-3 py-3 text-right">Monto</th><th className="hidden w-36 px-3 py-3 @[54rem]:table-cell">Origen</th><th className="hidden w-28 px-3 py-3 @[64rem]:table-cell">Registró</th><th className="w-20 px-3 py-3 text-right">Acción</th></tr></thead><tbody>{list.data.data.map(movement => <tr key={movement.id} className="border-t border-border-default align-top transition-colors hover:bg-surface-muted/70"><td className="hidden whitespace-nowrap px-3 py-3 text-text-secondary @[42rem]:table-cell">{formatFinancialDate(movement.occurredAt)}</td><td className="px-3 py-3"><StatusBadge variant={movement.type === 'INCOME' ? 'success' : 'danger'}>{financialMovementTypeLabel(movement.type)}</StatusBadge></td><td className="px-3 py-3"><span className="block break-words font-medium text-text-primary">{movement.description}</span><span className="mt-1 block text-xs text-text-secondary @[42rem]:hidden">{formatFinancialDate(movement.occurredAt)} · {financialMovementSourceLabel(movement.source)}</span></td><td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-text-primary">{formatFinancialCurrency(movement.amount, movement.currency)}</td><td className="hidden px-3 py-3 text-text-secondary @[54rem]:table-cell">{financialMovementSourceLabel(movement.source)}</td><td className="hidden px-3 py-3 text-text-secondary @[64rem]:table-cell">{movement.recordedById ? `Usuario #${movement.recordedById}` : 'Sin registro'}</td><td className="px-3 py-3 text-right"><Button size="sm" type="button" variant="outline" onClick={() => setSelectedId(movement.id)}><Eye className="size-4" aria-hidden="true" /><span className="sr-only @[48rem]:not-sr-only @[48rem]:ml-1">Ver detalle</span></Button></td></tr>)}</tbody></table></div><Pagination page={list.data.page} total={list.data.total} limit={list.data.limit} onChange={page => setFilters(current => ({ ...current, page }))} /></> : null}
    {creating ? <FinancialMovementFormModal onClose={() => setCreating(false)} /> : null}
    {selectedId !== null ? <FinancialMovementDetailModal id={selectedId} onClose={() => { setSelectedId(null); const url = new URL(window.location.href); url.searchParams.delete('movementId'); window.history.replaceState(null, '', url) }} /> : null}
  </section>
}

function Summary({ label, value, icon, state }: { label: string; value: string; icon: ReactNode; state: 'success' | 'warning' | 'neutral' }) {
  return <MetricCard className="border-border-default transition-[border-color,box-shadow] hover:border-brand-primary/30 hover:shadow-md" label={label} value={value} icon={icon} state={state} stateLabel="Período filtrado" />
}
