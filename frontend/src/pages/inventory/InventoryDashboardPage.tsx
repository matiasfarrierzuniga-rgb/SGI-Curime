import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  Clock3,
  ExternalLink,
  HandCoins,
  PackageCheck,
  RefreshCw,
  Tags,
  TriangleAlert,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { inventoryAlertsService } from '../../services/inventoryAlertsService'
import { inventoryLoansService } from '../../services/inventoryLoansService'
import { inventoryMovementsService } from '../../services/inventoryMovementsService'
import { inventoryReportsService } from '../../services/inventoryReportsService'
import type {
  InventoryAlerts,
  InventoryLoan,
  InventoryLoansReport,
  InventoryMovement,
  InventoryMovementReport,
  InventoryReportSummary,
  InventoryStockRow,
} from '../../types/inventory'
import { loanStatusLabels, movementTypeLabels } from '../../types/inventory'
import { getErrorMessage } from '@/shared/lib/errors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { buttonVariants } from '@/shared/ui/button'
import { InventoryPageLayout } from './InventoryPageLayout'

const chartColors = ['#2f4a38', '#c98a2d', '#6f8a73', '#8e6f4d', '#b8c4b4', '#d8b35d']
const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
const formatQuantity = (value: number) => new Intl.NumberFormat('es-CR').format(value)

export function InventoryDashboardPage() {
  const [summary, setSummary] = useState<InventoryReportSummary | null>(null)
  const [stock, setStock] = useState<InventoryStockRow[]>([])
  const [stockTotal, setStockTotal] = useState(0)
  const [movementReport, setMovementReport] = useState<InventoryMovementReport | null>(null)
  const [loanReport, setLoanReport] = useState<InventoryLoansReport | null>(null)
  const [alerts, setAlerts] = useState<InventoryAlerts | null>(null)
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([])
  const [recentLoans, setRecentLoans] = useState<InventoryLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [secondaryError, setSecondaryError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setSecondaryError(false)

    const optional = <T,>(request: (() => Promise<T>) | undefined): Promise<T | undefined> =>
      typeof request === 'function' ? request() : Promise.resolve(undefined)

    inventoryReportsService
      .summary()
      .then((data) => {
        if (!active) return
        setSummary(data)

        return Promise.allSettled([
          optional(typeof inventoryReportsService.stock === 'function' ? () => inventoryReportsService.stock({ page: 1, limit: 100 }) : undefined),
          optional(typeof inventoryReportsService.movements === 'function' ? () => inventoryReportsService.movements() : undefined),
          optional(typeof inventoryReportsService.loans === 'function' ? () => inventoryReportsService.loans() : undefined),
          optional(typeof inventoryAlertsService.get === 'function' ? () => inventoryAlertsService.get() : undefined),
          optional(typeof inventoryMovementsService.list === 'function' ? () => inventoryMovementsService.list({ page: 1, limit: 5 }) : undefined),
          optional(typeof inventoryLoansService.list === 'function' ? () => inventoryLoansService.list({ page: 1, limit: 5 }) : undefined),
        ]).then((results) => {
          if (!active) return
          const [stockResult, movementResult, loanResult, alertResult, recentMovementResult, recentLoanResult] = results
          let failed = false
          if (stockResult.status === 'fulfilled' && stockResult.value) {
            const response = stockResult.value as { data: InventoryStockRow[]; total: number }
            setStock(response.data)
            setStockTotal(response.total)
          } else if (stockResult.status === 'rejected') failed = true
          if (movementResult.status === 'fulfilled' && movementResult.value) setMovementReport(movementResult.value as InventoryMovementReport)
          else if (movementResult.status === 'rejected') failed = true
          if (loanResult.status === 'fulfilled' && loanResult.value) setLoanReport(loanResult.value as InventoryLoansReport)
          else if (loanResult.status === 'rejected') failed = true
          if (alertResult.status === 'fulfilled' && alertResult.value) setAlerts(alertResult.value as InventoryAlerts)
          else if (alertResult.status === 'rejected') failed = true
          if (recentMovementResult.status === 'fulfilled' && recentMovementResult.value) setRecentMovements((recentMovementResult.value as { data: InventoryMovement[] }).data)
          else if (recentMovementResult.status === 'rejected') failed = true
          if (recentLoanResult.status === 'fulfilled' && recentLoanResult.value) setRecentLoans((recentLoanResult.value as { data: InventoryLoan[] }).data)
          else if (recentLoanResult.status === 'rejected') failed = true
          setSecondaryError(failed)
        })
      })
      .catch((e) => {
        if (active) setError(getErrorMessage(e, 'No fue posible cargar el resumen de inventario.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const categoryData = useMemo(() => {
    const byCategory = new Map<string, { name: string; items: number; quantity: number }>()
    stock.forEach((item) => {
      const current = byCategory.get(item.category.name) ?? { name: item.category.name, items: 0, quantity: 0 }
      current.items += 1
      current.quantity += item.currentQuantity
      byCategory.set(item.category.name, current)
    })
    return [...byCategory.values()].sort((a, b) => b.items - a.items).slice(0, 8)
  }, [stock])

  const movementData = movementReport
    ? [
        { name: 'Entradas', count: movementReport.summary.entries.count, quantity: movementReport.summary.entries.quantity },
        { name: 'Salidas', count: movementReport.summary.exits.count, quantity: movementReport.summary.exits.quantity },
        { name: 'Ajustes', count: movementReport.summary.adjustments.count, quantity: movementReport.summary.adjustments.quantity },
      ]
    : []

  const loanData = loanReport
    ? [
        { name: loanStatusLabels.ACTIVE, value: loanReport.summary.active },
        { name: loanStatusLabels.RETURNED, value: loanReport.summary.returned },
        { name: loanStatusLabels.CANCELLED, value: loanReport.summary.cancelled },
      ].filter((item) => item.value > 0)
    : []

  const attentionCount = (summary?.lowStockCount ?? 0) + (summary?.outOfStockCount ?? 0) + (summary?.overdueLoans ?? 0)

  return (
    <InventoryPageLayout
      title="Centro de inventarios"
      description="Controlá existencias, movimientos y préstamos desde una vista operativa."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className={buttonVariants({ variant: 'primary', size: 'sm' })} to="/inventory/items">
            <PackageCheck aria-hidden="true" /> Artículos
          </Link>
          <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/inventory/alerts">
            <TriangleAlert aria-hidden="true" /> Alertas
          </Link>
        </div>
      }
    >
      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label="Cargando resumen de inventario…" />
      ) : !summary ? null : (
        <>
          <section className="overflow-hidden rounded-surface border border-brand-primary/20 bg-surface-card shadow-surface" aria-labelledby="inventory-overview-title">
            <div className="flex flex-wrap items-end justify-between gap-4 bg-brand-primary px-5 py-5 text-primary-foreground sm:px-6">
              <div>
                <p className="text-caption font-bold uppercase tracking-[0.14em] text-brand-sage">Lectura operativa</p>
                <h2 id="inventory-overview-title" className="mt-1 text-heading-2 font-bold">Estado actual del inventario</h2>
                <p className="mt-2 text-sm text-primary-foreground/80">Indicadores calculados por los reportes vigentes del módulo.</p>
              </div>
              <div className="flex items-center gap-2 rounded-control border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold">
                <Activity className="size-4" aria-hidden="true" /> {attentionCount > 0 ? `${attentionCount} puntos de atención` : 'Operación estable'}
              </div>
            </div>
            <div className="grid divide-y divide-border-default sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
              <Kpi icon={<Boxes />} label="Artículos" value={summary.totalItems} note={<><span>Activos</span>: {formatQuantity(summary.activeItems)} · <span>Inactivos</span>: {formatQuantity(summary.inactiveItems)}</>} />
              <Kpi icon={<AlertTriangle />} label="Stock bajo" value={summary.lowStockCount} note={`${summary.outOfStockCount} agotados`} tone={summary.lowStockCount > 0 ? 'warning' : 'neutral'} />
              <Kpi icon={<HandCoins />} label="Préstamos activos" value={summary.activeLoans} note="Existencias fuera de bodega" tone="success" />
              <Kpi icon={<Clock3 />} label="Préstamos vencidos" value={summary.overdueLoans} note="Requieren seguimiento" tone={summary.overdueLoans > 0 ? 'danger' : 'neutral'} />
            </div>
          </section>

          {secondaryError && <p className="flex items-center gap-2 rounded-control border border-status-warning-border bg-status-warning-surface px-3 py-2 text-sm text-status-warning-foreground" role="status"><RefreshCw className="size-4" aria-hidden="true" /> Algunos bloques no están disponibles; los indicadores principales siguen basados en datos reales.</p>}

          <section className="grid min-w-0 gap-5 xl:grid-cols-[1.15fr_0.85fr]" aria-label="Lecturas y distribución de inventario">
            <ChartCard title="Distribución por categoría" description={stockTotal > stock.length ? `Muestra de ${stock.length} artículos; total consultado: ${stockTotal}.` : 'Artículos registrados agrupados por categoría.'} icon={<Tags className="size-5" />}>
              {categoryData.length === 0 ? <EmptyState title="Sin datos de categorías" description="No hay existencias disponibles para construir esta lectura." /> : <CategoryChart data={categoryData} />}
            </ChartCard>
            <ChartCard title="Estado de préstamos" description="Distribución actual de préstamos registrados." icon={<HandCoins className="size-5" />}>
              {loanData.length === 0 ? <EmptyState title="Sin préstamos registrados" description="El reporte no contiene préstamos para distribuir." /> : <LoanChart data={loanData} total={loanReport?.summary.total ?? 0} />}
            </ChartCard>
          </section>

          <section className="grid min-w-0 gap-5 xl:grid-cols-[1.15fr_0.85fr]" aria-label="Actividad y atención">
            <ChartCard title="Actividad de movimientos" description="Cantidad de movimientos y unidades afectadas por tipo." icon={<ArrowRight className="size-5" />}>
              {movementData.length === 0 ? <EmptyState title="Sin movimientos registrados" description="No hay agregados de movimientos para este reporte." /> : <MovementChart data={movementData} />}
            </ChartCard>
            <AttentionPanel alerts={alerts} summary={summary} />
          </section>

          <RecentActivity movements={recentMovements} loans={recentLoans} />

          <section className="rounded-surface border border-border-default bg-surface-muted p-4 sm:p-5" aria-labelledby="inventory-actions-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-caption font-bold uppercase tracking-[0.12em] text-brand-primary">Siguiente acción</p><h2 id="inventory-actions-title" className="mt-1 text-heading-3 font-semibold text-text-primary">Mantené el inventario al día</h2><p className="mt-1 text-sm text-text-secondary">Consultá el detalle cuando un indicador requiera intervención.</p></div>
              <div className="flex flex-wrap gap-2">
                <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/inventory/reports">Reportes <ExternalLink aria-hidden="true" /></Link>
                <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/inventory/movements">Movimientos <ExternalLink aria-hidden="true" /></Link>
                <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/inventory/categories">Categorías <ExternalLink aria-hidden="true" /></Link>
                <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/inventory/loans">Préstamos <ExternalLink aria-hidden="true" /></Link>
              </div>
            </div>
          </section>
        </>
      )}
    </InventoryPageLayout>
  )
}

function Kpi({ icon, label, value, note, tone = 'neutral' }: { icon: ReactNode; label: string; value: number; note: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const toneClass = tone === 'success' ? 'bg-status-success-surface text-status-success' : tone === 'warning' ? 'bg-status-warning-surface text-status-warning' : tone === 'danger' ? 'bg-status-danger-surface text-status-danger' : 'bg-brand-primary/10 text-brand-primary'
  return <div className="flex gap-3 p-5"><span className={`grid size-10 shrink-0 place-items-center rounded-control ${toneClass}`} aria-hidden="true">{icon}</span><div className="min-w-0"><p className="text-sm text-text-secondary">{label}</p><p className="mt-1 text-heading-2 font-bold tabular-nums text-text-primary">{formatQuantity(value)}</p><p className="mt-1 text-xs text-text-muted">{note}</p></div></div>
}

function ChartCard({ title, description, icon, children }: { title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return <Card className="min-w-0"><CardHeader className="border-b border-border-default bg-brand-primary/[0.04]"><CardTitle><span className="flex items-center gap-2 text-text-primary">{icon}{title}</span></CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="min-w-0 pt-4">{children}</CardContent></Card>
}

function CategoryChart({ data }: { data: { name: string; items: number; quantity: number }[] }) {
  return <div className="min-w-0"><div className="h-[280px] min-w-0" role="img" aria-label="Gráfico de artículos por categoría"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6ded2" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} /><YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="items" name="Artículos" fill="#2f4a38" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div><ul className="mt-3 grid gap-2 border-t border-border-default pt-3 text-xs text-text-secondary sm:grid-cols-2" aria-label="Detalle de artículos por categoría">{data.map((item) => <li className="flex justify-between gap-3" key={item.name}><span className="truncate">{item.name}</span><span className="shrink-0 font-semibold text-text-primary">{formatQuantity(item.items)} artículos · {formatQuantity(item.quantity)} unidades</span></li>)}</ul></div>
}

function MovementChart({ data }: { data: { name: string; count: number; quantity: number }[] }) {
  return <div className="min-w-0"><div className="h-[280px] min-w-0" role="img" aria-label="Gráfico de actividad de movimientos por tipo"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="#e6ded2" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="count" name="Movimientos" fill="#2f4a38" radius={[4, 4, 0, 0]} /><Bar dataKey="quantity" name="Unidades" fill="#c98a2d" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="mt-2 text-xs text-text-muted">La lectura diferencia cantidad de registros y unidades afectadas.</p></div>
}

function LoanChart({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  return <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(130px,0.75fr)] sm:items-center"><div className="h-[230px] min-w-0" role="img" aria-label="Gráfico circular del estado de préstamos"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={3}>{data.map((item, index) => <Cell key={item.name} fill={chartColors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Total actual</p><p className="mt-1 text-heading-2 font-bold tabular-nums text-text-primary">{formatQuantity(total)}</p><ul className="mt-3 space-y-2 text-sm">{data.map((item, index) => <li className="flex items-center justify-between gap-2" key={item.name}><span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index] }} aria-hidden="true" /><span className="truncate">{item.name}</span></span><span className="font-semibold tabular-nums">{formatQuantity(item.value)}</span></li>)}</ul></div></div>
}

function AttentionPanel({ alerts, summary }: { alerts: InventoryAlerts | null; summary: InventoryReportSummary }) {
  const lowStock = [...(alerts?.outOfStock ?? []), ...(alerts?.lowStock ?? [])].slice(0, 3)
  const overdue = (alerts?.overdueLoans ?? []).slice(0, 2)
  return <Card className="min-w-0 border-brand-maize/40 bg-[#fff8df]"><CardHeader className="border-b border-[#e7c477]"><CardTitle><span className="flex items-center gap-2 text-brand-ink"><TriangleAlert className="size-5" aria-hidden="true" /> Centro de atención</span></CardTitle><CardDescription className="text-brand-ink/75">Prioridades derivadas de alertas vigentes.</CardDescription></CardHeader><CardContent className="space-y-4 pt-4"><div><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-text-primary">Reposición</h3><StatusBadge variant={summary.lowStockCount + summary.outOfStockCount > 0 ? 'warning' : 'success'}>{summary.lowStockCount + summary.outOfStockCount}</StatusBadge></div>{lowStock.length === 0 ? <p className="mt-2 text-sm text-text-secondary">No hay artículos que requieran reposición.</p> : <ul className="mt-2 space-y-2">{lowStock.map((item) => <li className="flex items-center justify-between gap-3 rounded-control border border-[#e7c477] bg-white/60 p-2.5 text-sm" key={item.id}><span className="min-w-0 truncate text-text-primary">{item.name}</span><span className="shrink-0 font-semibold text-brand-ink">{formatQuantity(item.currentQuantity)} / {formatQuantity(item.minimumQuantity)}</span></li>)}</ul>}</div><div className="border-t border-[#e7c477] pt-3"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-text-primary">Préstamos vencidos</h3><StatusBadge variant={summary.overdueLoans > 0 ? 'danger' : 'success'}>{summary.overdueLoans}</StatusBadge></div>{overdue.length > 0 && <ul className="mt-2 space-y-2">{overdue.map((item) => <li className="flex items-center justify-between gap-3 text-sm" key={item.id}><span className="min-w-0 truncate text-text-primary">{item.item.name} · {item.borrowerName}</span><span className="shrink-0 text-text-secondary">{formatDate(item.expectedReturnDate)}</span></li>)}</ul>}</div><Link className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-full' })} to="/inventory/alerts">Abrir centro de alertas <ArrowRight aria-hidden="true" /></Link></CardContent></Card>
}

function RecentActivity({ movements, loans }: { movements: InventoryMovement[]; loans: InventoryLoan[] }) {
  return <section className="grid min-w-0 gap-5 lg:grid-cols-2" aria-labelledby="recent-activity-title"><div className="lg:col-span-2"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-border-default pb-3"><div><p className="text-caption font-bold uppercase tracking-[0.12em] text-brand-primary">Seguimiento</p><h2 id="recent-activity-title" className="mt-1 text-heading-3 font-semibold text-text-primary">Actividad reciente</h2><p className="mt-1 text-sm text-text-secondary">Últimos registros disponibles en movimientos y préstamos.</p></div><Link className={buttonVariants({ variant: 'link', size: 'sm' })} to="/inventory/movements">Ver historial <ArrowRight aria-hidden="true" /></Link></div></div><ActivityList title="Movimientos" icon={<ArrowUpFromLine className="size-5" />} movements={movements} /><LoanList loans={loans} /></section>
}

function ActivityList({ title, icon, movements }: { title: string; icon: ReactNode; movements: InventoryMovement[] }) {
  return <Card className="min-w-0"><CardHeader className="border-b border-border-default"><CardTitle><span className="flex items-center gap-2">{icon}{title}</span></CardTitle><CardDescription>Registros más recientes.</CardDescription></CardHeader><CardContent className="p-0">{movements.length === 0 ? <div className="p-5"><EmptyState title="Sin movimientos recientes" description="No hay registros para mostrar." /></div> : <ul className="divide-y divide-border-default">{movements.map((movement) => <li className="flex items-start justify-between gap-3 p-4" key={movement.id}><div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{movement.item.name}</p><p className="mt-1 text-xs text-text-secondary">{movementTypeLabels[movement.type]} · {formatDate(movement.createdAt)}</p></div><span className={`shrink-0 rounded-control px-2 py-1 text-xs font-bold ${movement.type === 'EXIT' ? 'bg-status-warning-surface text-status-warning' : 'bg-status-success-surface text-status-success'}`}>{movement.type === 'EXIT' ? <ArrowDownToLine className="mr-1 inline size-3" aria-hidden="true" /> : <ArrowUpFromLine className="mr-1 inline size-3" aria-hidden="true" />} {movement.quantity} {movement.item.unit}</span></li>)}</ul>}</CardContent></Card>
}

function LoanList({ loans }: { loans: InventoryLoan[] }) {
  return <Card className="min-w-0"><CardHeader className="border-b border-border-default"><CardTitle><span className="flex items-center gap-2"><ClipboardList className="size-5" aria-hidden="true" />Préstamos</span></CardTitle><CardDescription>Últimos préstamos y devoluciones.</CardDescription></CardHeader><CardContent className="p-0">{loans.length === 0 ? <div className="p-5"><EmptyState title="Sin préstamos recientes" description="No hay registros para mostrar." /></div> : <ul className="divide-y divide-border-default">{loans.map((loan) => <li className="flex items-start justify-between gap-3 p-4" key={loan.id}><div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{loan.item.name}</p><p className="mt-1 truncate text-xs text-text-secondary">{loan.borrowerName} · {formatDate(loan.loanDate)}</p></div><StatusBadge variant={loan.status === 'ACTIVE' ? 'success' : loan.isOverdue ? 'danger' : 'neutral'}>{loan.isOverdue ? 'Vencido' : loanStatusLabels[loan.status]}</StatusBadge></li>)}</ul>}</CardContent></Card>
}
