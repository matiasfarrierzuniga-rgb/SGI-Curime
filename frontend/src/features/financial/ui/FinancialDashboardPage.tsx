import { useQueries } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarCheck, ChevronRight, CircleDollarSign, FileText, Heart, Plus, ReceiptText, Scale, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { financialApi } from '../api/financial.api'
import { financialKeys, useFinancialMovementSummary, useFinancialMovementsList } from '../hooks/useFinancial'
import { type FinancialChargeStatus } from '../model/financial.types'
import { chartValue, currentFinancialMonth, financialMonthInterval, financialMonthSeries } from '../model/financialDashboard'
import { financialMovementSourceLabel, financialMovementTypeLabel, formatFinancialCurrency, formatFinancialDate } from './financialPresentation'

const chargeStates: { status: FinancialChargeStatus; label: string; color: string }[] = [
  { status: 'PENDING', label: 'Pendientes', color: '#e7c477' },
  { status: 'PAID', label: 'Pagados', color: '#287b7b' },
  { status: 'CANCELLED', label: 'Cancelados', color: '#7a8790' },
]

export function FinancialDashboardPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentFinancialMonth)
  const canReadMovements = hasCapability(user?.permissionCodes, 'fin.movements.read')
  const canReadCharges = hasCapability(user?.permissionCodes, 'fin.charges.read')
  const interval = financialMonthInterval(month)
  const summary = useFinancialMovementSummary({ dateFrom: interval.dateFrom, dateTo: interval.dateTo }, canReadMovements)
  const chargeStatus = useChargeStatus(canReadCharges)

  return <section className="@container space-y-5">
    <PageHeader context="Gestión financiera" title="Dashboard financiero" description="Resumen de movimientos registrados y estado actual de cargos." actions={<label className="grid gap-1 text-sm font-semibold text-text-primary" htmlFor="financial-dashboard-month">Mes de movimientos<input className="min-h-11 rounded-control border border-border-default bg-control px-3 font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" id="financial-dashboard-month" type="month" value={month} onChange={event => setMonth(event.target.value)} /></label>} />
    <section aria-label="Indicadores financieros" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 @[50rem]:grid-cols-4 [&>article]:min-w-0">
      {canReadMovements ? <SummaryMetrics summary={summary} /> : null}
      {canReadCharges ? <PendingMetric status={chargeStatus} /> : null}
    </section>
    <section className="grid min-w-0 gap-5 @[50rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {canReadMovements ? <TrendSection month={month} className={canReadCharges ? '' : '@[50rem]:col-span-2'} /> : null}
      {canReadCharges ? <ChargesDomain status={chargeStatus} className={canReadMovements ? '' : '@[50rem]:col-span-2'} /> : null}
    </section>
    <section className="grid min-w-0 gap-5 @[50rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {canReadMovements ? <RecentMovementsSection className="" /> : null}
      <QuickActions permissionCodes={user?.permissionCodes} className={canReadMovements ? '' : '@[50rem]:col-span-2'} />
    </section>
  </section>
}

function SummaryMetrics({ summary }: { summary: ReturnType<typeof useFinancialMovementSummary> }) {
  if (summary.isPending) return <div className="sm:col-span-2 xl:col-span-3"><LoadingState label="Calculando indicadores financieros..." /></div>
  if (summary.isError) return <div className="sm:col-span-2 xl:col-span-3"><ErrorState title="No fue posible cargar los indicadores" message={getErrorMessage(summary.error)} action={<Retry onClick={() => void summary.refetch()} />} /></div>
  if (!summary.data) return null
  return <><MetricCard className="min-h-[8.5rem] border-border-default p-5 transition-[border-color,box-shadow] hover:border-brand-primary/30 hover:shadow-md" label="Ingresos del período" value={formatFinancialCurrency(summary.data.totalIncome, summary.data.currency)} icon={<KpiIcon className="bg-status-success-surface text-status-success"><ArrowUpRight /></KpiIcon>} state="success" stateLabel="Mes seleccionado" /><MetricCard className="min-h-[8.5rem] border-border-default p-5 transition-[border-color,box-shadow] hover:border-status-danger/30 hover:shadow-md" label="Egresos del período" value={formatFinancialCurrency(summary.data.totalExpenses, summary.data.currency)} icon={<KpiIcon className="bg-status-danger-surface text-status-danger"><ArrowDownRight /></KpiIcon>} state="warning" stateLabel="Mes seleccionado" /><MetricCard className="min-h-[8.5rem] border-border-default p-5 transition-[border-color,box-shadow] hover:border-brand-accent/60 hover:shadow-md" label="Balance registrado" value={formatFinancialCurrency(summary.data.balance, summary.data.currency)} icon={<KpiIcon className="bg-brand-accent/20 text-brand-ink"><Scale /></KpiIcon>} state="neutral" stateLabel="Ingresos menos egresos" supportingText="No representa saldo disponible." /></>
}

function useChargeStatus(enabled: boolean) {
  return useQueries({ queries: chargeStates.map(item => {
    const filters = { status: item.status, page: 1, limit: 1 }
    return { queryKey: financialKeys.chargeList(filters), queryFn: () => financialApi.listCharges(filters), enabled }
  }) })
}

function PendingMetric({ status }: { status: ReturnType<typeof useChargeStatus> }) {
  const pending = status[0]
  if (pending.isPending) return <MetricCard className="min-h-[8.5rem] p-5" label="Cargos pendientes" value="—" icon={<KpiIcon className="bg-brand-accent/20 text-brand-ink"><ReceiptText /></KpiIcon>} state="warning" stateLabel="Cargando estado actual" />
  if (pending.isError) return <MetricCard className="min-h-[8.5rem] p-5" label="Cargos pendientes" value="—" icon={<KpiIcon className="bg-brand-accent/20 text-brand-ink"><ReceiptText /></KpiIcon>} state="warning" stateLabel="Estado no disponible" />
  return <MetricCard className="min-h-[8.5rem] p-5" label="Cargos pendientes" value={pending.data?.total ?? 0} icon={<KpiIcon className="bg-brand-accent/20 text-brand-ink"><ReceiptText /></KpiIcon>} state="warning" stateLabel="Estado actual" supportingText="Estado actual, independiente del período." />
}

function TrendSection({ month, className }: { month: string; className: string }) {
  const intervals = financialMonthSeries(month)
  const trends = useQueries({ queries: intervals.map(item => ({ queryKey: financialKeys.movementSummary({ dateFrom: item.dateFrom, dateTo: item.dateTo }), queryFn: () => financialApi.getMovementSummary({ dateFrom: item.dateFrom, dateTo: item.dateTo }) })) })
  const trendError = trends.some(query => query.isError)
  const trendLoading = trends.some(query => query.isPending)
  const trendData = trends.every(query => query.data) ? intervals.map((item, index) => ({ label: item.label, income: chartValue(trends[index].data!.totalIncome), expenses: chartValue(trends[index].data!.totalExpenses), incomeText: trends[index].data!.totalIncome, expensesText: trends[index].data!.totalExpenses, currency: trends[index].data!.currency })) : []
  const retryTrend = () => trends.forEach(query => void query.refetch())

  return <section className={`min-w-0 rounded-surface border border-border-default bg-surface-card p-4 shadow-surface sm:p-5 ${className}`} aria-labelledby="financial-trend-title"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-primary/10 text-brand-primary"><BarChart3 className="size-5" aria-hidden="true" /></span><div><h2 className="text-heading-3 font-semibold text-text-primary" id="financial-trend-title">Ingresos vs. egresos</h2><p className="mt-1 text-sm text-text-secondary">Últimos seis meses completos, en colones costarricenses.</p></div></div></div>
      {trendLoading ? <LoadingState label="Cargando evolución financiera..." /> : null}
      {trendError ? <ErrorState title="La evolución no está completa" message="No fue posible consultar uno o más períodos. Los demás bloques siguen disponibles." action={<Retry onClick={retryTrend} />} /> : null}
      {!trendLoading && !trendError && trendData.length ? <TrendChart data={trendData} /> : null}
  </section>
}

function RecentMovementsSection({ className }: { className: string }) {
  const recent = useFinancialMovementsList({ page: 1, limit: 5 })
  return <section className={`@container min-w-0 rounded-surface border border-border-default bg-surface-card p-4 shadow-surface sm:p-5 ${className}`} aria-labelledby="recent-movements-title"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-primary/10 text-brand-primary"><ReceiptText className="size-5" aria-hidden="true" /></span><div><h2 className="text-heading-3 font-semibold text-text-primary" id="recent-movements-title">Movimientos recientes</h2><p className="mt-1 text-sm text-text-secondary">Ordenados según el historial financiero.</p></div></div><Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" to="/app/financial/movements">Ver historial <ChevronRight className="size-4" aria-hidden="true" /></Link></div>
      {recent.isPending ? <LoadingState label="Cargando movimientos recientes..." /> : null}
      {recent.isError ? <ErrorState title="No fue posible cargar los movimientos" message={getErrorMessage(recent.error)} action={<Retry onClick={() => void recent.refetch()} />} /> : null}
      {recent.data?.data.length === 0 ? <EmptyState title="No hay movimientos recientes" description="El historial estará disponible cuando se registren movimientos." action={<Link className="text-sm font-semibold text-primary underline-offset-4 hover:underline" to="/app/financial/movements">Abrir historial</Link>} /> : null}
      {recent.data?.data.length ? <><div className="mt-4 hidden overflow-hidden rounded-control border border-border-default @[38rem]:block"><table className="w-full table-fixed text-left text-sm"><thead className="bg-surface-muted text-caption font-semibold text-text-secondary"><tr><th className="w-28 px-3 py-2.5">Fecha</th><th className="px-3 py-2.5">Descripción</th><th className="w-20 px-3 py-2.5">Tipo</th><th className="w-28 px-3 py-2.5">Origen</th><th className="w-28 px-3 py-2.5 text-right">Monto</th></tr></thead><tbody>{recent.data.data.map(movement => <tr className="border-t border-border-default transition-colors hover:bg-surface-muted/70" key={movement.id}><td className="whitespace-nowrap px-3 py-2.5 text-text-secondary">{formatFinancialDate(movement.occurredAt)}</td><td className="px-3 py-2.5"><Link className="block truncate font-medium text-text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" to={`/app/financial/movements?movementId=${movement.id}`}>{movement.description}</Link></td><td className="px-3 py-2.5"><StatusBadge className="max-w-full truncate" variant={movement.type === 'INCOME' ? 'success' : 'danger'}>{financialMovementTypeLabel(movement.type)}</StatusBadge></td><td className="truncate px-3 py-2.5 text-text-secondary"><span className="inline-flex max-w-full items-center gap-1.5 truncate"><MovementSourceIcon source={movement.source} />{financialMovementSourceLabel(movement.source)}</span></td><td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-text-primary">{formatFinancialCurrency(movement.amount, movement.currency)}</td></tr>)}</tbody></table></div><ul className="mt-4 divide-y divide-border-default rounded-control border border-border-default @[38rem]:hidden" aria-label="Movimientos recientes compactos">{recent.data.data.map(movement => <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-3 py-3 transition-colors hover:bg-surface-muted/70" key={movement.id}><div className="min-w-0"><Link className="block truncate font-medium text-text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" to={`/app/financial/movements?movementId=${movement.id}`}>{movement.description}</Link><span className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-text-secondary"><MovementSourceIcon source={movement.source} />{formatFinancialDate(movement.occurredAt)} · {financialMovementSourceLabel(movement.source)}</span></div><div className="flex shrink-0 flex-col items-end gap-1.5"><span className="whitespace-nowrap text-sm font-semibold tabular-nums text-text-primary">{formatFinancialCurrency(movement.amount, movement.currency)}</span><StatusBadge variant={movement.type === 'INCOME' ? 'success' : 'danger'}>{financialMovementTypeLabel(movement.type)}</StatusBadge></div></li>)}</ul></> : null}
  </section>
}

function ChargesDomain({ status: queries, className }: { status: ReturnType<typeof useChargeStatus>; className: string }) {
  const loading = queries.some(query => query.isPending)
  const error = queries.find(query => query.isError)
  const values = chargeStates.map((item, index) => ({ ...item, count: queries[index].data?.total ?? 0 }))
  const total = values.reduce((sum, item) => sum + item.count, 0)
  return <section className={`min-w-0 rounded-surface border border-border-default bg-surface-card p-4 shadow-surface sm:p-5 ${className}`} aria-labelledby="charge-status-title"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-primary/10 text-brand-primary"><WalletCards className="size-5" aria-hidden="true" /></span><div><h2 className="text-heading-3 font-semibold text-text-primary" id="charge-status-title">Estado actual de cargos</h2><p className="mt-1 text-sm text-text-secondary">Cantidades actuales; no se filtran por el mes de movimientos.</p></div></div></div>
    {loading ? <LoadingState label="Cargando estado de cargos..." /> : null}
    {error ? <ErrorState title="No fue posible cargar el estado de cargos" message={getErrorMessage(error.error)} action={<Retry onClick={() => queries.forEach(query => void query.refetch())} />} /> : null}
    {!loading && !error && total === 0 ? <EmptyState title="No hay cargos financieros" description="Cuando existan cargos, su distribución aparecerá aquí." /> : null}
    {!loading && !error && total > 0 ? <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.85fr)]"><div className="relative h-56 min-w-0"><ResponsiveContainer width="100%" height="100%"><PieChart margin={{ top: 6, right: 6, bottom: 6, left: 6 }}><Pie cx="50%" cy="50%" data={values} dataKey="count" nameKey="label" innerRadius="60%" outerRadius="78%" paddingAngle={2}>{values.map(item => <Cell key={item.status} fill={item.color} />)}</Pie><Tooltip cursor={false} formatter={(value, _name, item) => [`${value} cargos`, item.payload.label]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><span><strong className="block text-heading-2 leading-none tabular-nums text-text-primary">{total}</strong><span className="mt-1 block text-caption text-text-secondary">Total</span></span></div></div><ul className="grid content-center gap-3" aria-label="Distribución actual de cargos">{values.map(item => <li className="flex items-center justify-between gap-3" key={item.status}><span className="flex items-center gap-2 text-sm text-text-secondary"><span className="size-3 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span><span className="flex items-baseline gap-2"><strong className="tabular-nums text-text-primary">{item.count}</strong><span className="text-xs tabular-nums text-text-secondary">{formatPercentage(item.count, total)}</span></span></li>)}</ul></div> : null}
  </section>
}

function QuickActions({ permissionCodes, className }: { permissionCodes: readonly string[] | null | undefined; className: string }) {
  const actions = [
    hasCapability(permissionCodes, 'fin.movements.create') ? { label: 'Registrar movimiento', detail: 'Abrir registro existente', path: '/app/financial/movements', icon: Plus } : null,
    hasCapability(permissionCodes, 'fin.movements.read') ? { label: 'Consultar movimientos', detail: 'Historial financiero', path: '/app/financial/movements', icon: BarChart3 } : null,
    hasCapability(permissionCodes, 'fin.charges.read') ? { label: hasCapability(permissionCodes, 'fin.payments.record') ? 'Cargos y pagos' : 'Consultar cargos', detail: 'Listado existente', path: '/app/financial/charges', icon: CircleDollarSign } : null,
    hasCapability(permissionCodes, 'fin.dinadeco.read') ? { label: 'Consultar DINADECO', detail: 'Reporte anual', path: '/app/financial/dinadeco', icon: FileText } : null,
    hasCapability(permissionCodes, 'don.donations.read') ? { label: 'Consultar donaciones', detail: 'Módulo existente', path: '/app/donations', icon: ReceiptText } : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null)
  if (!actions.length) return null
  return <section className={`rounded-surface border border-border-default bg-surface-card p-4 shadow-surface sm:p-5 ${className}`} aria-labelledby="quick-actions-title"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-accent/20 text-brand-ink"><CircleDollarSign className="size-5" aria-hidden="true" /></span><div><h2 className="text-heading-3 font-semibold text-text-primary" id="quick-actions-title">Accesos rápidos</h2><p className="mt-1 text-sm text-text-secondary">Acciones disponibles según sus permisos.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{actions.map(action => { const Icon = action.icon; return <Link key={action.label} to={action.path} className="group flex min-h-15 items-center gap-3 rounded-control border border-border-default px-3.5 transition-[background-color,border-color,box-shadow] hover:border-brand-primary/45 hover:bg-brand-primary/5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-primary-foreground"><Icon className="size-[1.125rem]" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-text-primary">{action.label}</span><span className="mt-0.5 block truncate text-xs text-text-secondary">{action.detail}</span></span><ChevronRight className="size-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link> })}</div></section>
}

function TrendChart({ data }: { data: { label: string; income: number | null; expenses: number | null; incomeText: string; expensesText: string; currency: string }[] }) {
  const hasUnsafeValue = data.some(item => item.income === null || item.expenses === null)
  const hasMovements = data.some(item => item.income !== 0 || item.expenses !== 0)
  return <>{hasUnsafeValue ? <p className="mt-4 text-sm text-text-secondary">Los montos exceden el rango seguro del gráfico. Consulte la tabla de valores exactos.</p> : !hasMovements ? <EmptyState className="mt-4" title="Sin movimientos en los últimos seis meses" description="La evolución aparecerá cuando existan ingresos o egresos registrados." /> : <div className="mt-4 h-64" role="img" aria-label="Gráfico de barras de ingresos y egresos por mes"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} barGap={6} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e2e8e5" strokeDasharray="3 3" /><XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d7ddd9' }} /><YAxis tickLine={false} axisLine={false} tickFormatter={formatCompactCrc} width={58} /><Tooltip cursor={false} contentStyle={{ borderColor: '#d7ddd9', borderRadius: '10px', boxShadow: '0 8px 20px rgba(18,59,71,0.12)' }} formatter={(_value, name, item) => [formatFinancialCurrency(name === 'Ingresos' ? item.payload.incomeText : item.payload.expensesText, item.payload.currency), name]} /><Legend iconType="circle" iconSize={9} wrapperStyle={{ paddingTop: 8 }} /><Bar dataKey="income" name="Ingresos" fill="#287b7b" radius={[4, 4, 0, 0]} /><Bar dataKey="expenses" name="Egresos" fill="#e7c477" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}<div className={hasUnsafeValue ? 'mt-4 overflow-x-auto' : 'sr-only'}><table><caption className={hasUnsafeValue ? 'mb-2 text-left text-sm text-text-secondary' : undefined}>Valores de ingresos y egresos por mes</caption><thead><tr><th>Mes</th><th>Ingresos</th><th>Egresos</th></tr></thead><tbody>{data.map(item => <tr key={item.label}><th>{item.label}</th><td>{formatFinancialCurrency(item.incomeText, item.currency)}</td><td>{formatFinancialCurrency(item.expensesText, item.currency)}</td></tr>)}</tbody></table></div></>
}

function Retry({ onClick }: { onClick: () => void }) { return <Button type="button" variant="outline" onClick={onClick}>Reintentar</Button> }
function KpiIcon({ children, className }: { children: React.ReactNode; className: string }) { return <span className={`grid size-11 place-items-center rounded-control ${className}`} aria-hidden="true">{children}</span> }
function formatCompactCrc(value: number) { return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', notation: 'compact', maximumFractionDigits: 1 }).format(value) }
function formatPercentage(value: number, total: number) { return `${Math.round((value / total) * 100)}%` }
function MovementSourceIcon({ source }: { source: 'MANUAL' | 'RESERVATION_PAYMENT' | 'DONATION' }) { const Icon = source === 'DONATION' ? Heart : source === 'RESERVATION_PAYMENT' ? CalendarCheck : ReceiptText; return <Icon className="size-3.5 shrink-0 text-brand-primary" aria-hidden="true" /> }
