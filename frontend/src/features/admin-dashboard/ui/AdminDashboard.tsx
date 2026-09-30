import { AlertTriangle, ArrowRight, Boxes, CalendarCheck, ChartNoAxesCombined, ClipboardList, FileClock, FileText, HandCoins, PackageX, RefreshCw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { Skeleton } from '@/shared/ui/skeleton'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { hasCapability, type AccessCapability } from '@/shared/security/access'
import type { AdminDashboardData } from '../model/adminDashboard.types'
import { useAdminDashboard } from '../hooks/useAdminDashboard'

type AdminDashboardProps = {
  permissionCodes?: readonly string[]
}

type QuickAction = {
  label: string
  description: string
  path: string
  capability: AccessCapability
  icon: typeof Users
}

const adminQuickActions: readonly QuickAction[] = [
  { label: 'Revisar solicitudes', description: 'Atienda solicitudes de afiliación pendientes.', path: '/app/admin/requests', capability: 'adm.requests.read', icon: ClipboardList },
  { label: 'Gestionar reservas', description: 'Consulte y atienda reservas comunitarias.', path: '/app/reservations', capability: 'res.reservations.read', icon: CalendarCheck },
  { label: 'Gestionar usuarios', description: 'Consulte y administre cuentas del sistema.', path: '/admin/users', capability: 'usr.users.read', icon: Users },
]

export function AdminDashboard({ permissionCodes }: AdminDashboardProps) {
  const dashboard = useAdminDashboard()

  if (dashboard.isPending) {
    return (
      <section aria-busy="true">
        <DashboardSummaryHeading />
        <div className="mt-6 space-y-6" aria-label="Cargando indicadores administrativos">
          <SkeletonGroup titleWidth="w-44" metrics={4} gridClassName="md:grid-cols-2 lg:grid-cols-4" />
          <div className="grid gap-6 xl:grid-cols-12">
            <SkeletonGroup titleWidth="w-36" metrics={1} gridClassName="xl:grid-cols-1" className="order-2 md:order-1 xl:col-span-8" />
            <SkeletonGroup titleWidth="w-48" metrics={4} gridClassName="xl:grid-cols-1" className="order-1 md:order-2 xl:col-span-4" />
          </div>
        </div>
      </section>
    )
  }

  if (dashboard.isError) {
    return (
      <section>
        <DashboardSummaryHeading />
        <ErrorState
          className="mt-6"
          title="No fue posible cargar los indicadores"
          message="Intente nuevamente para consultar el estado administrativo actual."
          action={<Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}><RefreshCw aria-hidden="true" /> Reintentar</Button>}
        />
      </section>
    )
  }

  const { data, metadata } = dashboard.data
  if (!hasData(data)) {
    return (
      <section>
        <DashboardSummaryHeading />
        <EmptyState
          className="mt-6"
          title="Aún no hay datos administrativos para mostrar."
          description="Los indicadores aparecerán cuando los módulos registren información."
        />
      </section>
    )
  }

  const quickActions = adminQuickActions.filter((action) => hasCapability(permissionCodes, action.capability))

  return (
    <section>
      <DashboardSummary data={data} generatedAt={metadata.generatedAt} />
      <div className="mt-10 space-y-12">
        <div className="grid gap-8 xl:grid-cols-12">
          <ActivityOverview className="order-2 md:order-1 xl:col-span-8" />
          <AttentionPanel data={data} permissionCodes={permissionCodes} className="order-1 md:order-2 xl:col-span-4" />
        </div>

        <div className="grid gap-8 xl:grid-cols-12 xl:items-start">
          <RecentActivity className={quickActions.length > 0 ? 'order-2 md:order-1 xl:col-span-8' : 'order-2 md:order-1 xl:col-span-12'} />
          {quickActions.length > 0 && <QuickActions actions={quickActions} />}
        </div>

        <InstitutionalPanorama data={data} />
      </div>
    </section>
  )
}

function DashboardSummary({ data, generatedAt }: { data: AdminDashboardData; generatedAt: string }) {
  return (
    <section aria-labelledby="admin-indicators-title">
      <DashboardSummaryHeading generatedAt={generatedAt} />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Solicitudes pendientes" value={data.affiliateRequests.pending} icon={Users} className="h-full min-h-36 border-l-2 border-l-brand-primary bg-surface-elevated p-5 shadow-none" />
        <Metric label="Justificaciones pendientes" value={data.justifications.pending} icon={FileText} className="h-full min-h-36 border-l-2 border-l-brand-primary bg-surface-elevated p-5 shadow-none" />
        <Metric label="Reservas pendientes" value={data.reservations.pending} icon={CalendarCheck} className="h-full min-h-36 border-l-2 border-l-brand-primary bg-surface-elevated p-5 shadow-none" />
        <Metric label="Afiliados activos" value={data.affiliates.active} icon={Users} className="h-full min-h-36 border-l-2 border-l-brand-primary bg-surface-elevated p-5 shadow-none" />
      </div>
    </section>
  )
}

function InstitutionalPanorama({ data }: { data: AdminDashboardData }) {
  return (
    <section aria-labelledby="admin-snapshot-title" className="border-t border-border-subtle pt-7">
      <div>
        <h3 id="admin-snapshot-title" className="font-sans text-body font-semibold text-text-primary">Panorama institucional</h3>
        <p className="mt-1 text-body-small text-foreground-muted">Totales y actividad registrada en los módulos institucionales.</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        <CompactMetric label="Afiliados" value={data.affiliates.total} icon={Users} />
        <CompactMetric label="Afiliados inactivos" value={data.affiliates.inactive} />
        <CompactMetric label="Reservas totales" value={data.reservations.total} icon={CalendarCheck} />
        <CompactMetric label="Reservas aprobadas" value={data.reservations.approved} />
        <CompactMetric label="Reservas confirmadas" value={data.reservations.confirmed} />
        <CompactMetric label="Artículos de inventario" value={data.inventory.totalItems} icon={Boxes} />
        <CompactMetric label="Préstamos activos" value={data.inventory.activeLoans} />
        <CompactMetric label="Asambleas programadas" value={data.assemblies.scheduled} />
        <CompactMetric label="Asambleas en progreso" value={data.assemblies.in_progress} />
        <CompactMetric label="Asambleas completadas" value={data.assemblies.completed} />
        <CompactMetric label="Donaciones registradas" value={data.donations.total} icon={HandCoins} />
        <CompactMetric label="Donaciones confirmadas" value={data.donations.confirmed} />
      </div>
    </section>
  )
}

function CompactMetric({ label, value, icon: Icon }: { label: string; value: number; icon?: typeof Users }) {
  return (
    <MetricCard
      label={label}
      value={<span className="text-heading-3">{value.toLocaleString('es-CR')}</span>}
      icon={Icon ? <Icon className="size-4" /> : undefined}
      className="border-l border-border-subtle bg-surface-muted p-3 shadow-none"
    />
  )
}

function RecentActivity({ className }: { className?: string }) {
  return (
    <section aria-labelledby="admin-recent-activity-title" className={className}>
      <GroupHeading id="admin-recent-activity-title" title="Actividad reciente" description="Eventos operativos registrados por los módulos administrativos." />
      <Card className="mt-4 border-dashed border-border-default bg-surface-muted shadow-none">
        <CardHeader className="pb-2">
          <CardTitle>Actividad reciente no disponible</CardTitle>
          <CardDescription>El resumen administrativo actual solo entrega indicadores consolidados; no incluye eventos operativos ni su cronología.</CardDescription>
        </CardHeader>
        <CardContent className="pt-1"><StatusBadge variant="info">Fuente de actividad pendiente</StatusBadge></CardContent>
      </Card>
    </section>
  )
}

function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <section aria-labelledby="admin-quick-actions-title" className="order-1 md:order-2 xl:col-span-4">
      <GroupHeading id="admin-quick-actions-title" title="Accesos rápidos" description="Tareas administrativas disponibles para su cuenta." />
      <nav aria-label="Accesos rápidos administrativos" className="mt-4 grid gap-2">
        {actions.map((action) => <QuickActionCard key={action.path} action={action} />)}
      </nav>
    </section>
  )
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon
  return (
    <Link to={action.path} className="group block rounded-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <Card size="sm" className="h-full border-border-subtle bg-surface-card shadow-none transition-colors group-hover:border-border-strong group-hover:bg-surface-elevated group-focus-visible:border-brand-primary">
        <CardContent className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-control border border-border-subtle bg-background-subtle text-foreground-brand"><Icon className="size-4" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1"><p className="font-semibold text-text-primary">{action.label}</p><p className="mt-1 text-body-small text-text-secondary">{action.description}</p></div>
          <ArrowRight className="size-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
        </CardContent>
      </Card>
    </Link>
  )
}

function DashboardSummaryHeading({ generatedAt }: { generatedAt?: string }) {
  return <div className="border-b border-border-default pb-5"><h2 id="admin-indicators-title" className="font-sans text-heading-2 font-bold tracking-[-0.02em] text-text-primary">Resumen general</h2><p className="mt-2 max-w-3xl text-body-small text-text-secondary">Indicadores administrativos de solicitudes, reservas, afiliación y justificaciones.{generatedAt ? ` Actualizado ${new Date(generatedAt).toLocaleString('es-CR')}.` : ''}</p></div>
}

function GroupHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div><h3 id={id} className="font-sans text-heading-3 font-semibold text-brand-ink">{title}</h3><p className="mt-1 text-body-small text-foreground-muted">{description}</p></div>
}

function SkeletonGroup({ titleWidth, metrics, gridClassName = 'sm:grid-cols-3', className }: { titleWidth: string; metrics: number; gridClassName?: string; className?: string }) {
  return <div className={className}><Skeleton className={`h-6 ${titleWidth}`} /><Skeleton className="mt-2 h-4 w-64 max-w-full" /><div className={`mt-4 grid gap-3 ${gridClassName}`}>{Array.from({ length: metrics }, (_, index) => <Skeleton key={index} className="h-30" />)}</div></div>
}

type AttentionItemData = {
  label: string
  count: number
  detail: string
  icon: typeof Users
  status: 'warning' | 'danger'
  statusLabel: string
  action?: { label: string; path: string; capability: AccessCapability }
}

function AttentionPanel({ data, permissionCodes, className }: { data: AdminDashboardData; permissionCodes?: readonly string[]; className?: string }) {
  const candidates: Array<AttentionItemData | null> = [
    data.inventory.outOfStockItems > 0 ? { label: 'Artículos agotados', count: data.inventory.outOfStockItems, detail: 'Sin existencias', icon: PackageX, status: 'danger', statusLabel: 'Crítico', action: { label: 'Ver alertas', path: '/inventory/alerts', capability: 'inv.inventory.read' } } : null,
    data.inventory.overdueLoans > 0 ? { label: 'Préstamos vencidos', count: data.inventory.overdueLoans, detail: 'Préstamos fuera de plazo', icon: FileClock, status: 'danger', statusLabel: 'Vencido', action: { label: 'Ver préstamos', path: '/inventory/loans', capability: 'inv.inventory.read' } } : null,
    data.inventory.lowStockItems > 0 ? { label: 'Artículos con stock bajo', count: data.inventory.lowStockItems, detail: 'Existencias por revisar', icon: AlertTriangle, status: 'warning', statusLabel: 'Stock bajo', action: { label: 'Ver alertas', path: '/inventory/alerts', capability: 'inv.inventory.read' } } : null,
    data.affiliateRequests.pending > 0 ? { label: 'Solicitudes de afiliación', count: data.affiliateRequests.pending, detail: 'Pendientes de revisión', icon: Users, status: 'warning', statusLabel: 'Pendiente', action: { label: 'Revisar', path: '/app/admin/requests', capability: 'adm.requests.read' } } : null,
    data.justifications.pending > 0 ? { label: 'Justificaciones de ausencia', count: data.justifications.pending, detail: 'Pendientes de resolución', icon: FileText, status: 'warning', statusLabel: 'Pendiente', action: { label: 'Revisar', path: '/app/admin/absence-justifications', capability: 'adm.justifications.read' } } : null,
    data.reservations.pending > 0 ? { label: 'Reservas', count: data.reservations.pending, detail: 'Pendientes de atención', icon: CalendarCheck, status: 'warning', statusLabel: 'Pendiente', action: { label: 'Revisar', path: '/app/reservations', capability: 'res.reservations.read' } } : null,
  ]
  const items = candidates.filter((item): item is AttentionItemData => item !== null)

  return (
    <section aria-labelledby="admin-risks-title" className={className}>
      <GroupHeading id="admin-risks-title" title="Atención requerida" description="Pendientes y riesgos operativos que necesitan revisión." />
      <div className="mt-4 space-y-2">
        {items.length > 0 ? items.map((item) => <AttentionItem key={item.label} item={item} canAct={item.action !== undefined && hasCapability(permissionCodes, item.action.capability)} />) : (
          <EmptyState title="No hay pendientes de atención." description="No se registran solicitudes pendientes ni alertas operativas." className="py-5" />
        )}
      </div>
    </section>
  )
}

function AttentionItem({ item, canAct }: { item: AttentionItemData; canAct: boolean }) {
  const Icon = item.icon
  return (
    <Card size="sm" className="border-border-default bg-surface-card shadow-none">
      <CardContent className="flex items-start gap-3">
        <div className={item.status === 'danger' ? 'flex size-9 shrink-0 items-center justify-center rounded-control bg-status-danger-surface text-status-danger' : 'flex size-9 shrink-0 items-center justify-center rounded-control bg-status-warning-surface text-status-warning'}><Icon className="size-5" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h4 className="font-semibold text-text-primary">{item.label}</h4><StatusBadge variant={item.status}>{item.statusLabel}</StatusBadge></div>
          <p className="mt-1 text-body-small text-text-secondary"><span className="font-semibold tabular-nums text-text-primary">{item.count.toLocaleString('es-CR')}</span> {item.detail.toLocaleLowerCase()}</p>
        </div>
        {canAct && item.action && <Link to={item.action.path} className={buttonVariants({ variant: 'link', size: 'sm', className: 'h-auto shrink-0 px-0 text-right' })}>{item.action.label}</Link>}
      </CardContent>
    </Card>
  )
}

function ActivityOverview({ className }: { className?: string }) {
  return (
    <section aria-labelledby="admin-activity-overview-title" className={`${className ?? ''} xl:flex xl:flex-col`}>
      <GroupHeading id="admin-activity-overview-title" title="Actividad" description="Seguimiento temporal de la operación institucional." />
      <Card className="mt-4 border-dashed border-border-default bg-surface-muted shadow-none xl:flex-1">
        <CardHeader className="grid-cols-[auto_1fr] gap-x-3">
          <div className="row-span-2 flex size-9 items-center justify-center rounded-control bg-status-info-surface text-status-info"><ChartNoAxesCombined className="size-5" aria-hidden="true" /></div>
          <CardTitle>Serie temporal no disponible</CardTitle>
          <CardDescription>El resumen administrativo actual entrega totales consolidados, sin eventos recientes ni datos por período.</CardDescription>
        </CardHeader>
        <CardContent><StatusBadge variant="info">Información pendiente de fuente</StatusBadge></CardContent>
      </Card>
    </section>
  )
}

function Metric({ label, value, icon: Icon, state, stateLabel, className }: { label: string; value: string | number; icon?: typeof Users; state?: 'warning' | 'danger'; stateLabel?: string; className?: string }) {
  const metricValue = typeof value === 'number' ? value.toLocaleString('es-CR') : value
  const icon = Icon ? <span className="flex size-9 items-center justify-center rounded-control border border-border-subtle bg-background-subtle text-foreground-brand"><Icon className="size-4" /></span> : undefined
  const metricValueNode = <span className="text-3xl leading-none tracking-[-0.03em]">{metricValue}</span>
  return state ? <MetricCard label={label} value={metricValueNode} icon={icon} state={state} stateLabel={stateLabel ?? ''} className={className} /> : <MetricCard label={label} value={metricValueNode} icon={icon} className={className} />
}

function hasData(data: AdminDashboardData) {
  return data.affiliates.total > 0 || data.affiliateRequests.pending > 0 || data.reservations.total > 0 || data.donations.total > 0 || data.inventory.totalItems > 0 || data.assemblies.total > 0 || data.justifications.pending > 0 || Number(data.financial.totalIncome) !== 0 || Number(data.financial.totalExpenses) !== 0
}
