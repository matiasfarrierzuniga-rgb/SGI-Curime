import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useFinancialMovementSummary, useFinancialMovementsList } from '../hooks/useFinancial'
import { FINANCIAL_MOVEMENT_TYPES, type FinancialMovementListFilters, type FinancialMovementType } from '../model/financial.types'
import { FinancialMovementDetailModal } from './FinancialMovementDetailModal'
import { FinancialMovementFormModal } from './FinancialMovementFormModal'
import { financialMovementSourceLabel, financialMovementTypeLabel, formatFinancialCurrency, formatFinancialDate } from './financialPresentation'

const initialFilters: FinancialMovementListFilters = { page: 1, limit: 20 }

export function FinancialMovementsPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<FinancialMovementListFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const list = useFinancialMovementsList(filters)
  const summary = useFinancialMovementSummary({ dateFrom: filters.dateFrom, dateTo: filters.dateTo })
  const hasActiveFilters = Boolean(filters.type || filters.dateFrom || filters.dateTo)
  const update = (change: Partial<FinancialMovementListFilters>) => setFilters(current => ({ ...current, ...change, page: 1 }))
  const mayCreate = hasCapability(user?.role, 'fin.movements.create')
  return <section className="space-y-6">
    <PageHeader context="Gestión financiera" title="Movimientos financieros" description="Registre ingresos y egresos manuales, consulte su historial y balance." actions={mayCreate ? <Button type="button" onClick={() => setCreating(true)}>Registrar movimiento</Button> : undefined} />
    <form className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={event => event.preventDefault()}>
      <label className="grid gap-1 text-sm font-semibold" htmlFor="movement-filter-type">Tipo<select id="movement-filter-type" value={filters.type ?? ''} onChange={event => update({ type: event.target.value ? event.target.value as FinancialMovementType : undefined })}><option value="">Todos los tipos</option>{FINANCIAL_MOVEMENT_TYPES.map(type => <option key={type} value={type}>{financialMovementTypeLabel(type)}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-semibold" htmlFor="movement-filter-from">Desde<input id="movement-filter-from" type="date" value={filters.dateFrom ?? ''} onChange={event => update({ dateFrom: event.target.value || undefined })} /></label>
      <label className="grid gap-1 text-sm font-semibold" htmlFor="movement-filter-to">Hasta<input id="movement-filter-to" type="date" value={filters.dateTo ?? ''} onChange={event => update({ dateTo: event.target.value || undefined })} /></label>
      <div className="flex items-end"><Button type="button" variant="outline" disabled={!hasActiveFilters} onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button></div>
    </form>
    <section aria-label="Resumen de movimientos" className="grid gap-4 sm:grid-cols-3">
      {summary.isPending ? <div className="sm:col-span-3"><LoadingState label="Calculando resumen financiero..." /></div> : null}
      {summary.isError ? <div className="sm:col-span-3"><ErrorState title="No fue posible cargar el resumen" message={getErrorMessage(summary.error)} action={<Button type="button" variant="outline" onClick={() => void summary.refetch()}>Reintentar</Button>} /></div> : null}
      {summary.data ? <><Summary label="Ingresos" value={formatFinancialCurrency(summary.data.totalIncome, summary.data.currency)} /><Summary label="Egresos" value={formatFinancialCurrency(summary.data.totalExpenses, summary.data.currency)} /><Summary label="Balance" value={formatFinancialCurrency(summary.data.balance, summary.data.currency)} /></> : null}
    </section>
    {list.isPending ? <LoadingState label="Cargando movimientos financieros..." /> : null}
    {list.isError ? <ErrorState title="No fue posible cargar los movimientos" message={getErrorMessage(list.error)} action={<Button type="button" variant="outline" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}
    {list.data?.data.length === 0 ? <EmptyState title="No hay movimientos financieros" description={hasActiveFilters ? 'No hay movimientos que coincidan con los filtros aplicados.' : 'Registre un ingreso o egreso manual para iniciar el historial.'} action={hasActiveFilters ? <Button type="button" variant="outline" onClick={() => setFilters(initialFilters)}>Limpiar filtros</Button> : undefined} /> : null}
    {list.data?.data.length ? <><div className="overflow-x-auto rounded-xl border border-border" tabIndex={0} aria-label="Listado de movimientos financieros"><table className="min-w-[850px] w-full text-left text-sm"><thead className="bg-surface-muted text-foreground-muted"><tr><th className="p-3">Fecha</th><th className="p-3">Tipo</th><th className="p-3">Concepto</th><th className="p-3">Monto</th><th className="p-3">Fuente</th><th className="p-3">Registró</th><th className="p-3">Acciones</th></tr></thead><tbody>{list.data.data.map(movement => <tr key={movement.id} className="border-t border-border align-top"><td className="p-3 whitespace-nowrap">{formatFinancialDate(movement.occurredAt)}</td><td className="p-3"><StatusBadge variant={movement.type === 'INCOME' ? 'success' : 'warning'}>{financialMovementTypeLabel(movement.type)}</StatusBadge></td><td className="p-3 max-w-sm break-words">{movement.description}</td><td className="p-3 whitespace-nowrap font-semibold">{formatFinancialCurrency(movement.amount, movement.currency)}</td><td className="p-3">{financialMovementSourceLabel(movement.source)}</td><td className="p-3">{movement.recordedById ? `Usuario #${movement.recordedById}` : 'Sin registro'}</td><td className="p-3"><Button size="sm" type="button" variant="outline" onClick={() => setSelectedId(movement.id)}>Ver detalle</Button></td></tr>)}</tbody></table></div><Pagination page={list.data.page} total={list.data.total} limit={list.data.limit} onChange={page => setFilters(current => ({ ...current, page }))} /></> : null}
    {creating ? <FinancialMovementFormModal onClose={() => setCreating(false)} /> : null}
    {selectedId !== null ? <FinancialMovementDetailModal id={selectedId} onClose={() => setSelectedId(null)} /> : null}
  </section>
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-surface p-4"><p className="text-sm font-semibold text-foreground-muted">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>
}
