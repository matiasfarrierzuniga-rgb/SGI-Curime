import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Clock3, Landmark, Scale, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useTreasurySummary } from '../hooks/useFinancial'
import { currentFinancialMonth, financialMonthInterval } from '../model/financialDashboard'
import type { FinancialMovementSource, TreasuryTotals } from '../model/financial.types'
import { FinancialSectionNav } from './FinancialSectionNav'
import { financialMovementSourceLabel, formatFinancialCurrency } from './financialPresentation'

export function TreasuryPage() {
  const month = currentFinancialMonth()
  const interval = financialMonthInterval(month)
  const summary = useTreasurySummary({ dateFrom: interval.dateFrom, dateTo: interval.dateTo })

  return <section className="space-y-6">
    <PageHeader context="Gestión financiera" title="Tesorería institucional" description="Composición registrada del fondo único institucional en colones costarricenses." actions={<Link to="/app/financial/movements"><Button type="button" variant="outline">Ver historial</Button></Link>} />
    <FinancialSectionNav />
    {summary.isPending ? <LoadingState label="Calculando resumen de tesorería..." /> : null}
    {summary.isError ? <ErrorState title="No fue posible cargar Tesorería" message="Los datos financieros no pudieron consolidarse." action={<Button type="button" variant="outline" onClick={() => void summary.refetch()}>Reintentar</Button>} /> : null}
    {summary.data ? <>
      <div className="rounded-surface border border-status-warning/30 bg-status-warning-surface p-4 text-sm text-text-primary"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 size-5 shrink-0 text-status-warning" aria-hidden="true" /><div><strong className="block">Saldo inicial no establecido</strong><p className="mt-1 text-text-secondary">El resultado neto proviene del historial registrado. No se presenta como saldo disponible ni bancario conciliado.</p></div></div></div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen acumulado de tesorería">
        <MetricCard label="Saldo registrado" value="No establecido" icon={<Landmark />} state="warning" stateLabel="Requiere saldo inicial válido" />
        <MetricCard label="Ingresos acumulados" value={formatFinancialCurrency(summary.data.accumulated.income)} icon={<ArrowUpRight />} state="success" stateLabel="Todo el historial aplicable" />
        <MetricCard label="Egresos acumulados" value={formatFinancialCurrency(summary.data.accumulated.expenses)} icon={<ArrowDownRight />} state="warning" stateLabel="Todo el historial aplicable" />
        <MetricCard label="Neto acumulado registrado" value={formatFinancialCurrency(summary.data.accumulated.net)} icon={<Scale />} supportingText="Ingresos menos egresos; no equivale a saldo conciliado." />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={`Indicadores de ${interval.label}`}>
        <MetricCard label="Ingresos del período" value={formatFinancialCurrency(summary.data.currentPeriod.income)} icon={<ArrowUpRight />} state="success" stateLabel={interval.label} />
        <MetricCard label="Egresos del período" value={formatFinancialCurrency(summary.data.currentPeriod.expenses)} icon={<ArrowDownRight />} state="warning" stateLabel={interval.label} />
        <MetricCard label="Resultado neto del período" value={formatFinancialCurrency(summary.data.currentPeriod.net)} icon={<CircleDollarSign />} state="neutral" stateLabel={interval.label} />
        <MetricCard label="Cuentas por cobrar" value={formatFinancialCurrency(summary.data.receivables.pendingCharges)} icon={<Clock3 />} state="warning" stateLabel={`${summary.data.receivables.pendingChargeCount} cargo(s) pendiente(s)`} supportingText="No representa efectivo recibido." />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Composición acumulada" totals={summary.data.accumulated} />
        <Breakdown title={`Composición de ${interval.label}`} totals={summary.data.currentPeriod} />
      </section>
      <section className="rounded-surface border border-border-default bg-surface-card p-5 shadow-surface" aria-labelledby="treasury-integrity-title"><h2 className="text-heading-3 font-semibold text-text-primary" id="treasury-integrity-title">Trazabilidad del fondo</h2><p className="mt-1 text-sm text-text-secondary">Pagos confirmados registrados: {formatFinancialCurrency(summary.data.reconciliation.confirmedPayments)}.</p>{summary.data.reconciliation.issues.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-status-warning">{summary.data.reconciliation.issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p className="mt-3 text-sm text-status-success">No se detectaron enlaces faltantes entre pagos, donaciones y movimientos.</p>}<Link className="mt-4 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline" to="/app/financial/movements">Consultar movimientos que respaldan los importes</Link></section>
    </> : null}
  </section>
}

function Breakdown({ title, totals }: { title: string; totals: TreasuryTotals }) {
  const rows = Object.entries(totals.bySource) as Array<[FinancialMovementSource, { income: string; expenses: string; count: number }]>
  return <section className="rounded-surface border border-border-default bg-surface-card p-5 shadow-surface"><h2 className="text-heading-3 font-semibold text-text-primary">{title}</h2>{rows.length ? <ul className="mt-4 divide-y divide-border-default">{rows.map(([source, values]) => <li className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center" key={source}><span><strong className="block text-sm text-text-primary">{financialMovementSourceLabel(source)}</strong><span className="text-xs text-text-secondary">{values.count} movimiento(s)</span></span><span className="text-sm tabular-nums text-status-success">+ {formatFinancialCurrency(values.income)}</span><span className="text-sm tabular-nums text-status-danger">− {formatFinancialCurrency(values.expenses)}</span></li>)}</ul> : <p className="mt-4 text-sm text-text-secondary">Sin movimientos registrados en este alcance temporal.</p>}</section>
}
