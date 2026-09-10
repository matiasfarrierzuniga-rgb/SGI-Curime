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
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { useFinancialChargesList } from '../hooks/useFinancial'
import { FINANCIAL_CHARGE_STATUSES, type FinancialCharge, type FinancialChargeListFilters } from '../model/financial.types'
import { FinancialDetailModal } from './FinancialDetailModal'
import { FinancialPaymentModal } from './FinancialPaymentModal'
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
    <PageHeader context="Gestión financiera" title="Financiero" description="Consulte los cargos financieros de reservas y registre pagos manuales." />
    <form className="grid gap-4 rounded-xl border border-border bg-surface p-4 md:grid-cols-5" onSubmit={event => event.preventDefault()}>
      <FilterSelect label="Estado" value={filters.status ?? ''} onChange={value => updateFilter({ status: value ? value as FinancialCharge['status'] : undefined })}><option value="">Todos los estados</option>{FINANCIAL_CHARGE_STATUSES.map(status => <option key={status} value={status}>{financialChargeStatusLabel(status)}</option>)}</FilterSelect>
      <FilterInput label="ID de reserva" inputMode="numeric" value={filters.reservationId?.toString() ?? ''} onChange={value => updateFilter({ reservationId: value ? Number(value) : undefined })} />
      <div className="flex items-end"><Button variant="outline" type="button" disabled={!hasActiveFilters} onClick={clearFilters}>Limpiar filtros</Button></div>
    </form>
    {list.isPending ? <LoadingState label="Cargando cargos financieros..." /> : null}
    {list.isError ? <ErrorState title="No fue posible cargar los cargos financieros" message={getErrorMessage(list.error)} action={<Button variant="outline" type="button" onClick={() => void list.refetch()}>Reintentar</Button>} /> : null}
    {list.data && list.data.data.length === 0 ? <EmptyState title="No hay cargos financieros" description={hasActiveFilters ? 'No hay cargos que coincidan con los filtros aplicados. Ajuste o limpie los filtros.' : 'No se han registrado cargos financieros todavía.'} action={hasActiveFilters ? <Button variant="outline" type="button" onClick={clearFilters}>Limpiar filtros</Button> : undefined} /> : null}
    {list.data && list.data.data.length > 0 ? <>
      <div className="overflow-x-auto rounded-xl border border-border" tabIndex={0} aria-label="Listado de cargos financieros">
        <table className="min-w-[800px] w-full text-left text-sm"><thead className="bg-surface-muted text-foreground-muted"><tr><th className="p-3">Cargo</th><th className="p-3">Reserva</th><th className="p-3">Monto</th><th className="p-3">Moneda</th><th className="p-3">Estado</th><th className="p-3">Creado</th><th className="p-3">Acciones</th></tr></thead><tbody>{list.data.data.map(charge => <tr key={charge.id} className="border-t border-border align-top"><td className="p-3 font-semibold">#{charge.id}</td><td className="p-3">#{charge.reservationId}</td><td className="p-3 whitespace-nowrap">{formatFinancialCurrency(charge.amount, charge.currency)}</td><td className="p-3">{charge.currency}</td><td className="p-3"><StatusBadge variant={financialChargeStatusVariant(charge.status)}>{financialChargeStatusLabel(charge.status)}</StatusBadge></td><td className="p-3 whitespace-nowrap">{formatFinancialDate(charge.createdAt)}</td><td className="p-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" type="button" onClick={() => setSelectedId(charge.id)}>Ver detalle</Button>{charge.status === 'PENDING' && hasCapability(user?.role, 'fin.payments.record') ? <Button size="sm" type="button" onClick={() => setPayingCharge(charge)}>Registrar pago</Button> : null}</div></td></tr>)}</tbody></table>
      </div>
      <Pagination page={list.data.page} total={list.data.total} limit={list.data.limit} onChange={page => setFilters(current => ({ ...current, page }))} />
    </> : null}
    {selectedId !== null ? <FinancialDetailModal id={selectedId} role={user?.role} onClose={() => setSelectedId(null)} onRecord={setPayingCharge} /> : null}
    {payingCharge !== null ? <FinancialPaymentModal charge={payingCharge} onClose={() => setPayingCharge(null)} /> : null}
  </section>
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = `financial-filter-${label.toLowerCase()}`
  return <Label className="grid gap-1 font-semibold" htmlFor={id}>{label}<Select id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</Select></Label>
}

function FilterInput({ label, inputMode, value, onChange }: { label: string; inputMode: 'numeric'; value: string; onChange: (value: string) => void }) {
  const id = `financial-filter-${label.toLowerCase()}`
  return <Label className="grid gap-1 font-semibold" htmlFor={id}>{label}<Input id={id} type="text" inputMode={inputMode} value={value} onChange={event => onChange(event.target.value)} /></Label>
}
