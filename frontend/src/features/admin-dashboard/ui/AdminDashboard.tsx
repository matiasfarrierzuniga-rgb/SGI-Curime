import { AlertTriangle, ArrowRight, CalendarCheck, ChartNoAxesCombined, ClipboardList, Clock3, FileClock, FileText, Landmark, PackageX, RefreshCw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { Skeleton } from '@/shared/ui/skeleton'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { hasCapability, type AccessCapability } from '@/shared/security/access'
import { useAdminDashboard } from '../hooks/useAdminDashboard'
import type { AdminDashboardData } from '../model/adminDashboard.types'

type AdminDashboardProps = { permissionCodes?: readonly string[] }

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
    return <section aria-busy="true"><DashboardSummaryHeading /><DashboardSkeleton /></section>
  }

  if (dashboard.isError) {
    return (
      <section>
        <DashboardSummaryHeading />
        <ErrorState className="mt-6" title="No fue posible cargar los indicadores" message="Intente nuevamente para consultar el estado administrativo actual." action={<Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}><RefreshCw aria-hidden="true" /> Reintentar</Button>} />
      </section>
    )
  }

  const { data, metadata } = dashboard.data
  if (!hasData(data)) {
    return <section><DashboardSummaryHeading generatedAt={metadata.generatedAt} /><EmptyState className="mt-6" title="Aún no hay datos administrativos para mostrar." description="Los indicadores aparecerán cuando los módulos registren información." /></section>
  }

  const quickActions = adminQuickActions.filter((action) => hasCapability(permissionCodes, action.capability))

  return (
    <section>
      <DashboardSummary data={data} generatedAt={metadata.generatedAt} />
      <div className="mt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-stretch">
          <InstitutionalPanorama data={data} />
          <AttentionPanel data={data} permissionCodes={permissionCodes} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-start">
          <ActivityOverview />
          {quickActions.length > 0 && <QuickActions actions={quickActions} />}
        </div>

        <RecentActivity />
      </div>
    </section>
  )
}

function DashboardSummary({ data, generatedAt }: { data: AdminDashboardData; generatedAt: string }) {
  return (
    <section aria-labelledby="admin-indicators-title">
      <DashboardSummaryHeading generatedAt={generatedAt} />
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Solicitudes pendientes" value={data.affiliateRequests.pending} icon={ClipboardList} />
        <Metric label="Justificaciones pendientes" value={data.justifications.pending} icon={FileText} />
        <Metric label="Reservas pendientes" value={data.reservations.pending} icon={CalendarCheck} />
        <Metric label="Afiliados activos" value={data.affiliates.active} icon={Users} />
      </div>
    </section>
  )
}

function DashboardSummaryHeading({ generatedAt }: { generatedAt?: string }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border-default pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id="admin-indicators-title" className="font-sans text-heading-2 font-bold tracking-[-0.02em] text-text-primary">Panel administrativo</h2>
        <p className="mt-1 text-body text-text-secondary">Resumen de la gestión institucional</p>
      </div>
      {generatedAt && <p className="flex items-center gap-2 text-body-small text-foreground-muted"><Clock3 className="size-4 shrink-0" aria-hidden="true" /><span>Última actualización:</span> <time dateTime={generatedAt}>{formatTimestamp(generatedAt)}</time></p>}
    </header>
  )
}

function InstitutionalPanorama({ data }: { data: AdminDashboardData }) {
  return (
    <section aria-labelledby="admin-snapshot-title">
      <Card className="h-full border-border-default bg-surface-card shadow-none">
        <CardHeader className="grid-cols-[auto_1fr] gap-x-3">
          <IconTile icon={Landmark} />
          <h3 id="admin-snapshot-title" className="font-heading text-heading-3 font-semibold text-foreground">Panorama institucional</h3>
          <CardDescription>Afiliación, reservas, inventario, asambleas y donaciones registradas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <PanoramaGroup title="Afiliación"><CompactMetric label="Afiliados" value={data.affiliates.total} /><CompactMetric label="Afiliados inactivos" value={data.affiliates.inactive} /></PanoramaGroup>
          <PanoramaGroup title="Reservas"><CompactMetric label="Reservas totales" value={data.reservations.total} /><CompactMetric label="Reservas aprobadas" value={data.reservations.approved} /><CompactMetric label="Reservas confirmadas" value={data.reservations.confirmed} /></PanoramaGroup>
          <PanoramaGroup title="Inventario"><CompactMetric label="Artículos de inventario" value={data.inventory.totalItems} /><CompactMetric label="Préstamos activos" value={data.inventory.activeLoans} /></PanoramaGroup>
          <PanoramaGroup title="Asambleas"><CompactMetric label="Asambleas programadas" value={data.assemblies.scheduled} /><CompactMetric label="Asambleas en progreso" value={data.assemblies.in_progress} /><CompactMetric label="Asambleas completadas" value={data.assemblies.completed} /></PanoramaGroup>
          <PanoramaGroup title="Donaciones"><CompactMetric label="Donaciones registradas" value={data.donations.total} /><CompactMetric label="Donaciones confirmadas" value={data.donations.confirmed} /></PanoramaGroup>
        </CardContent>
      </Card>
    </section>
  )
}

function PanoramaGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section aria-label={title} className="rounded-surface border border-border-subtle bg-surface-muted p-3"><h4 className="text-label font-semibold text-text-primary">{title}</h4><div className="mt-2 space-y-2">{children}</div></section>
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return <MetricCard label={label} value={<span className="text-body font-semibold tabular-nums">{value.toLocaleString('es-CR')}</span>} className="border-0 bg-transparent p-0 shadow-none" />
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

function AttentionPanel({ data, permissionCodes }: { data: AdminDashboardData; permissionCodes?: readonly string[] }) {
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
    <section aria-labelledby="admin-risks-title">
      <Card className="h-full border-border-default bg-surface-card shadow-none">
        <CardHeader className="grid-cols-[auto_1fr] gap-x-3"><IconTile icon={AlertTriangle} tone="danger" /><h3 id="admin-risks-title" className="font-heading text-heading-3 font-semibold text-foreground">Requiere atención</h3><CardDescription>Pendientes y riesgos operativos que necesitan revisión.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {items.length > 0 ? items.map((item) => <AttentionItem key={item.label} item={item} canAct={item.action !== undefined && hasCapability(permissionCodes, item.action.capability)} />) : <EmptyState title="No hay pendientes de atención." description="No se registran solicitudes pendientes ni alertas operativas." className="py-5" />}
        </CardContent>
      </Card>
    </section>
  )
}

function AttentionItem({ item, canAct }: { item: AttentionItemData; canAct: boolean }) {
  const Icon = item.icon
  return <Card size="sm" className="border-border-subtle bg-surface-muted shadow-none"><CardContent className="flex items-start gap-3"><IconTile icon={Icon} tone={item.status} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h4 className="font-semibold text-text-primary">{item.label}</h4><StatusBadge variant={item.status}>{item.statusLabel}</StatusBadge></div><p className="mt-1 text-body-small text-text-secondary"><span className="font-semibold tabular-nums text-text-primary">{item.count.toLocaleString('es-CR')}</span> {item.detail.toLocaleLowerCase()}</p></div>{canAct && item.action && <Link to={item.action.path} className={buttonVariants({ variant: 'link', size: 'sm', className: 'h-auto shrink-0 px-0 text-right' })}>{item.action.label}</Link>}</CardContent></Card>
}

function ActivityOverview() {
  return <section aria-labelledby="admin-activity-overview-title"><Card className="h-full border-dashed border-border-default bg-surface-muted shadow-none"><CardHeader className="grid-cols-[auto_1fr] gap-x-3"><IconTile icon={ChartNoAxesCombined} tone="info" /><h3 id="admin-activity-overview-title" className="font-heading text-heading-3 font-semibold text-foreground">Actividad</h3><CardDescription>Seguimiento temporal de la operación institucional.</CardDescription></CardHeader><CardContent><Card className="border-border-subtle bg-surface-card shadow-none"><CardHeader><h4 className="font-heading text-heading-3 font-semibold text-foreground">Serie temporal no disponible</h4><CardDescription>El resumen administrativo actual entrega totales consolidados, sin eventos recientes ni datos por período.</CardDescription></CardHeader><CardContent><StatusBadge variant="info">Información pendiente de fuente</StatusBadge></CardContent></Card></CardContent></Card></section>
}

function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return <section aria-labelledby="admin-quick-actions-title"><Card className="border-border-default bg-surface-card shadow-none"><CardHeader><h3 id="admin-quick-actions-title" className="font-heading text-heading-3 font-semibold text-foreground">Accesos rápidos</h3><CardDescription>Tareas administrativas disponibles para su cuenta.</CardDescription></CardHeader><CardContent><nav aria-label="Accesos rápidos administrativos" className="grid gap-2">{actions.map((action) => <QuickActionCard key={action.path} action={action} />)}</nav></CardContent></Card></section>
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon
  return <Link to={action.path} className="group block rounded-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"><Card size="sm" className="h-full border-border-subtle bg-surface-muted shadow-none transition-colors group-hover:border-border-strong group-hover:bg-surface-elevated group-focus-visible:border-brand-primary"><CardContent className="flex items-center gap-3"><IconTile icon={Icon} /><div className="min-w-0 flex-1"><p className="font-semibold text-text-primary">{action.label}</p><p className="mt-1 text-body-small text-text-secondary">{action.description}</p></div><ArrowRight className="size-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" /></CardContent></Card></Link>
}

function RecentActivity() {
  return <section aria-labelledby="admin-recent-activity-title"><Card className="border-dashed border-border-default bg-surface-muted shadow-none"><CardHeader className="grid-cols-[auto_1fr] gap-x-3"><IconTile icon={Clock3} tone="info" /><h3 id="admin-recent-activity-title" className="font-heading text-heading-3 font-semibold text-foreground">Actividad reciente</h3><CardDescription>Eventos operativos registrados por los módulos administrativos.</CardDescription></CardHeader><CardContent><Card className="border-border-subtle bg-surface-card shadow-none"><CardHeader><h4 className="font-heading text-heading-3 font-semibold text-foreground">Actividad reciente no disponible</h4><CardDescription>El resumen administrativo actual solo entrega indicadores consolidados; no incluye eventos operativos ni su cronología.</CardDescription></CardHeader><CardContent><StatusBadge variant="info">Fuente de actividad pendiente</StatusBadge></CardContent></Card></CardContent></Card></section>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <MetricCard label={label} value={<span className="text-3xl leading-none tracking-[-0.03em]">{value.toLocaleString('es-CR')}</span>} icon={<IconTile icon={Icon} />} className="h-full min-h-34 border-l-2 border-l-brand-primary bg-surface-elevated p-5 shadow-none" />
}

function IconTile({ icon: Icon, tone = 'brand' }: { icon: typeof Users; tone?: 'brand' | 'warning' | 'danger' | 'info' }) {
  const tones = { brand: 'border-border-subtle bg-background-subtle text-foreground-brand', warning: 'bg-status-warning-surface text-status-warning', danger: 'bg-status-danger-surface text-status-danger', info: 'bg-status-info-surface text-status-info' }
  return <span className={`flex size-9 shrink-0 items-center justify-center rounded-control ${tones[tone]}`}><Icon className="size-4" aria-hidden="true" /></span>
}

function DashboardSkeleton() {
  return <div className="mt-6 space-y-6" aria-label="Cargando indicadores administrativos"><SkeletonGroup metrics={4} gridClassName="md:grid-cols-2 xl:grid-cols-4" /><div className="grid gap-6 lg:grid-cols-2"><SkeletonGroup metrics={3} /><SkeletonGroup metrics={4} /></div></div>
}

function SkeletonGroup({ metrics, gridClassName = 'sm:grid-cols-2' }: { metrics: number; gridClassName?: string }) {
  return <div><Skeleton className="h-6 w-44" /><Skeleton className="mt-2 h-4 w-64 max-w-full" /><div className={`mt-4 grid gap-3 ${gridClassName}`}>{Array.from({ length: metrics }, (_, index) => <Skeleton key={index} className="h-30" />)}</div></div>
}

function formatTimestamp(generatedAt: string) {
  const date = new Date(generatedAt)
  return Number.isNaN(date.getTime()) ? generatedAt : date.toLocaleString('es-CR')
}

function hasData(data: AdminDashboardData) {
  return data.affiliates.total > 0 || data.affiliateRequests.pending > 0 || data.reservations.total > 0 || data.donations.total > 0 || data.inventory.totalItems > 0 || data.assemblies.total > 0 || data.justifications.pending > 0
}
