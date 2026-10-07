import { AlertTriangle, ArrowRight, Boxes, CalendarCheck, CalendarDays, ClipboardList, FileClock, FileText, HandCoins, PackageX, RefreshCw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
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
        <div className="mt-5 space-y-6" aria-label="Cargando indicadores administrativos">
          <SkeletonGroup titleWidth="w-44" metrics={4} gridClassName="md:grid-cols-2 lg:grid-cols-4" />
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonGroup titleWidth="w-48" metrics={3} gridClassName="grid-cols-1" />
            <SkeletonGroup titleWidth="w-36" metrics={3} gridClassName="grid-cols-1" />
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
      <div className="mt-8 space-y-10">
        <div className={quickActions.length > 0 ? 'grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]' : undefined}>
          <AttentionPanel data={data} permissionCodes={permissionCodes} />
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
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Solicitudes pendientes" value={data.affiliateRequests.pending} icon={Users} className="h-full border-l-2 border-l-brand-primary bg-surface-elevated p-4 shadow-none" />
        <Metric label="Justificaciones pendientes" value={data.justifications.pending} icon={FileText} className="h-full border-l-2 border-l-brand-primary bg-surface-elevated p-4 shadow-none" />
        <Metric label="Reservas pendientes" value={data.reservations.pending} icon={CalendarCheck} className="h-full border-l-2 border-l-brand-primary bg-surface-elevated p-4 shadow-none" />
        <Metric label="Afiliados activos" value={data.affiliates.active} icon={Users} className="h-full border-l-2 border-l-brand-primary bg-surface-elevated p-4 shadow-none" />
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
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <PanoramaGroup
          title="Afiliación"
          icon={Users}
          metrics={[
            { label: 'Afiliados registrados', value: data.affiliates.total },
            { label: 'Afiliados inactivos', value: data.affiliates.inactive },
          ]}
        />
        <PanoramaGroup
          title="Reservas"
          icon={CalendarCheck}
          metrics={[
            { label: 'Total', value: data.reservations.total },
            { label: 'Aprobadas', value: data.reservations.approved },
            { label: 'Confirmadas', value: data.reservations.confirmed },
          ]}
        />
        <PanoramaGroup
          title="Inventario y préstamos"
          icon={Boxes}
          metrics={[
            { label: 'Artículos', value: data.inventory.totalItems },
            { label: 'Préstamos activos', value: data.inventory.activeLoans },
          ]}
        />
        <PanoramaGroup
          title="Asambleas"
          icon={CalendarDays}
          metrics={[
            { label: 'Programadas', value: data.assemblies.scheduled },
            { label: 'En progreso', value: data.assemblies.in_progress },
            { label: 'Completadas', value: data.assemblies.completed },
          ]}
        />
        <PanoramaGroup
          title="Donaciones"
          icon={HandCoins}
          metrics={[
            { label: 'Registradas', value: data.donations.total },
            { label: 'Confirmadas', value: data.donations.confirmed },
          ]}
        />
      </div>
    </section>
  )
}

function PanoramaGroup({ title, icon: Icon, metrics }: { title: string; icon: typeof Users; metrics: readonly { label: string; value: number }[] }) {
  return (
    <Card size="sm" className="border-border-subtle bg-surface-muted shadow-none">
      <CardContent>
        <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-brand-soft/20 text-brand-deep"><Icon className="size-4" aria-hidden="true" /></span>
          <h4 className="font-semibold text-text-primary">{title}</h4>
        </div>
        <dl className="mt-1 divide-y divide-border-subtle">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex min-h-9 items-center justify-between gap-4 py-1.5">
              <dt className="text-body-small text-text-secondary">{metric.label}</dt>
              <dd className="shrink-0 font-semibold tabular-nums text-text-primary">{metric.value.toLocaleString('es-CR')}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <section aria-labelledby="admin-quick-actions-title">
      <GroupHeading id="admin-quick-actions-title" title="Acciones prioritarias" description="Tareas administrativas que puede atender ahora." />
      <nav aria-label="Acciones prioritarias administrativas" className="mt-4 grid gap-2">
        {actions.map((action) => <QuickActionCard key={action.path} action={action} />)}
      </nav>
    </section>
  )
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon
  return (
    <Link to={action.path} className="group block rounded-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <Card size="sm" className="h-full min-h-16 border-border-subtle bg-surface-card shadow-none transition-colors group-hover:border-border-strong group-hover:bg-surface-elevated group-focus-visible:border-brand-primary">
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
      <CardContent className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
        <div className={item.status === 'danger' ? 'flex size-9 shrink-0 items-center justify-center rounded-control bg-status-danger-surface text-status-danger' : 'flex size-9 shrink-0 items-center justify-center rounded-control bg-status-warning-surface text-status-warning'}><Icon className="size-5" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h4 className="font-semibold text-text-primary">{item.label}</h4><StatusBadge variant={item.status}>{item.statusLabel}</StatusBadge></div>
          <p className="mt-1 text-body-small text-text-secondary"><span className="font-semibold tabular-nums text-text-primary">{item.count.toLocaleString('es-CR')}</span> {item.detail.toLocaleLowerCase()}</p>
        </div>
        {canAct && item.action && <Link to={item.action.path} className={buttonVariants({ variant: 'link', size: 'sm', className: 'min-h-11 shrink-0 self-start px-0 sm:min-h-9' })}>{item.action.label}</Link>}
      </CardContent>
    </Card>
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
