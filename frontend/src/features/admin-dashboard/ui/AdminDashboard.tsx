import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, CalendarCheck, CalendarDays, Clock3, FileClock, FileText, Landmark, Package, PackageX, RefreshCw, Sun, UserPlus, Users, UsersRound, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { userRequestsService } from '@/features/user-requests'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/skeleton'
import { hasCapability, type AccessCapability } from '@/shared/security/access'
import { useAdminDashboard } from '../hooks/useAdminDashboard'
import type { AdminDashboardData } from '../model/adminDashboard.types'

type AdminDashboardProps = { permissionCodes?: readonly string[]; userName?: string }
type Icon = typeof Users
type AccountRequestStatus = { isPending: boolean; isError: boolean; total?: number }

type QuickAction = { label: string; path: string; capability: AccessCapability; icon: Icon }

const quickActions: readonly QuickAction[] = [
  { label: 'Revisar solicitudes de cuenta', path: '/admin/user-requests', capability: 'usr.user-requests.read', icon: UserPlus },
  { label: 'Revisar solicitudes de afiliación', path: '/app/admin/requests', capability: 'adm.requests.read', icon: UsersRound },
  { label: 'Gestionar reservas', path: '/app/reservations', capability: 'res.reservations.read', icon: CalendarCheck },
  { label: 'Administrar usuarios', path: '/admin/users', capability: 'usr.users.read', icon: Users },
  { label: 'Inventario', path: '/inventory', capability: 'inv.inventory.read', icon: Package },
  { label: 'Reportes de inventario', path: '/inventory/reports', capability: 'inv.inventory.read', icon: FileText },
]

export function AdminDashboard({ permissionCodes, userName }: AdminDashboardProps) {
  const dashboard = useAdminDashboard()
  const canReadAccountRequests = hasCapability(permissionCodes, 'usr.user-requests.read')
  const accountRequests = useQuery({
    queryKey: ['user-requests', 'dashboard', 'pending'],
    queryFn: () => userRequestsService.list({ page: 1, limit: 1, status: 'PENDING' }),
    enabled: canReadAccountRequests,
    staleTime: 30_000,
  })

  if (dashboard.isPending) return <section aria-busy="true"><InstitutionalWelcome fullName={userName} /><DashboardSkeleton /></section>
  if (dashboard.isError) return <section><InstitutionalWelcome fullName={userName} /><ErrorState className="mt-5" title="No fue posible cargar los indicadores" message="Intente nuevamente para consultar el estado administrativo actual." action={<Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}><RefreshCw aria-hidden="true" />Reintentar</Button>} /></section>

  const { data, metadata } = dashboard.data
  if (!hasData(data)) return <section><InstitutionalWelcome fullName={userName} generatedAt={metadata.generatedAt} /><EmptyState className="mt-5" title="Aún no hay datos administrativos para mostrar." description="Los indicadores aparecerán cuando los módulos registren información." /></section>

  return <section className="space-y-3 sm:space-y-4">
    <InstitutionalWelcome fullName={userName} generatedAt={metadata.generatedAt} />
    <KpiRow data={data} permissionCodes={permissionCodes} accountRequests={{ isPending: accountRequests.isPending, isError: accountRequests.isError, total: accountRequests.data?.total }} canReadAccountRequests={canReadAccountRequests} />
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.85fr)_minmax(17rem,1fr)] lg:items-stretch">
      <AttentionPanel data={data} permissionCodes={permissionCodes} accountRequests={{ isPending: accountRequests.isPending, isError: accountRequests.isError, total: accountRequests.data?.total }} canReadAccountRequests={canReadAccountRequests} />
      <InstitutionalPanorama data={data} permissionCodes={permissionCodes} />
    </div>
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.85fr)_minmax(17rem,1fr)] lg:items-stretch">
      <RecentActivity />
      <QuickActions actions={quickActions.filter(action => hasCapability(permissionCodes, action.capability))} />
    </div>
  </section>
}

function InstitutionalWelcome({ fullName, generatedAt }: { fullName?: string; generatedAt?: string }) {
  const firstName = fullName?.trim().split(/\s+/)[0]
  const date = generatedAt ? formatDashboardDate(generatedAt) : null
  return <header className="overflow-hidden rounded-surface border border-erp-border bg-erp-surface-subtle shadow-elevation-0"><div className="grid gap-5 px-5 py-6 sm:px-7 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)] md:items-center md:py-7"><div className="flex min-w-0 gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-status-warning-surface text-erp-accent"><Sun className="size-7" aria-hidden="true" /></span><div className="min-w-0"><p className="text-caption font-bold uppercase tracking-[0.16em] text-erp-accent">Administración</p><h1 id="admin-indicators-title" className="mt-1 font-heading text-heading-1 font-bold tracking-[-0.02em] text-erp-text">Buenos días{firstName ? `, ${firstName}` : ''}</h1><p className="mt-1 text-body text-erp-text-muted">Aquí tiene el resumen de la gestión de la ADI Curime.</p>{date ? <p className="mt-3 flex items-center gap-2 text-body-small text-erp-text-muted"><CalendarDays className="size-4 shrink-0 text-erp-navigation" aria-hidden="true" /><time dateTime={generatedAt}>{date}</time></p> : null}</div></div><aside className="rounded-overlay border border-erp-border bg-erp-surface-raised/90 px-5 py-4 text-erp-text shadow-sm"><p className="font-heading text-heading-3 italic">Una comunidad organizada construye más oportunidades.</p><p className="mt-2 text-body-small text-erp-text-muted">ADI Curime</p></aside></div></header>
}

function KpiRow({ data, permissionCodes, accountRequests, canReadAccountRequests }: { data: AdminDashboardData; permissionCodes?: readonly string[]; accountRequests: AccountRequestStatus; canReadAccountRequests: boolean }) {
  const accountValue = !canReadAccountRequests ? null : accountRequests.isPending ? '—' : accountRequests.isError ? null : accountRequests.total ?? 0
  return <section aria-labelledby="admin-indicators-title" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <KpiCard title="Afiliados activos" subtitle="Registrados en el sistema" value={data.affiliates.active} icon={Users} tone="success" action={hasCapability(permissionCodes, 'adm.affiliates.read') ? { label: 'Ver afiliados', path: '/app/admin/affiliates' } : undefined} />
    <KpiCard title="Reservas pendientes" subtitle="Por confirmar" value={data.reservations.pending} icon={CalendarCheck} tone="info" action={hasCapability(permissionCodes, 'res.reservations.read') ? { label: 'Gestionar reservas', path: '/app/reservations' } : undefined} />
    <KpiCard title="Artículos en inventario" subtitle="Registrados en el sistema" value={data.inventory.totalItems} icon={Package} tone="warning" action={hasCapability(permissionCodes, 'inv.inventory.read') ? { label: 'Ver inventario', path: '/inventory' } : undefined} />
    <KpiCard title="Solicitudes de cuenta" subtitle={accountValue === null ? 'Información no disponible' : 'Pendientes de revisión'} value={accountValue} icon={UserPlus} tone="danger" action={canReadAccountRequests && !accountRequests.isError ? { label: 'Ver solicitudes', path: '/admin/user-requests' } : undefined} />
  </section>
}

function KpiCard({ title, subtitle, value, icon: IconComponent, tone, action }: { title: string; subtitle: string; value: number | string | null; icon: Icon; tone: 'success' | 'warning' | 'danger' | 'info'; action?: { label: string; path: string; capability?: AccessCapability } }) {
  return <article className="flex min-h-35 flex-col rounded-surface border border-erp-border bg-erp-surface-raised p-4 shadow-elevation-0"><div className="flex items-start gap-3"><IconTile icon={IconComponent} tone={tone} /><div className="min-w-0"><h2 className="text-label font-semibold text-erp-text">{title}</h2><p className="mt-0.5 text-body-small text-erp-text-muted">{subtitle}</p></div></div><p className="mt-3 text-heading-1 leading-none font-bold tabular-nums text-erp-text">{value === null ? '—' : typeof value === 'number' ? value.toLocaleString('es-CR') : value}</p>{action ? <Link to={action.path} className="mt-auto inline-flex w-fit items-center gap-2 pt-3 text-body-small font-bold text-erp-navigation underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-erp-focus">{action.label}<ArrowRight className="size-4" aria-hidden="true" /></Link> : <p className="mt-auto pt-3 text-body-small text-erp-text-muted">Sin acceso o fuente disponible</p>}</article>
}

function InstitutionalPanorama({ data, permissionCodes }: { data: AdminDashboardData; permissionCodes?: readonly string[] }) {
  const modules: Array<{ title: string; icon: Icon; metrics: Array<[string, number]>; action: { label: string; path: string; capability: AccessCapability } }> = [
    { title: 'Afiliación', icon: Users, metrics: [['Afiliados activos', data.affiliates.active], ['Afiliados inactivos', data.affiliates.inactive]], action: { label: 'Ver afiliados', path: '/app/admin/affiliates', capability: 'adm.affiliates.read' } },
    { title: 'Reservas', icon: CalendarCheck, metrics: [['Reservas totales', data.reservations.total], ['Reservas aprobadas', data.reservations.approved], ['Reservas pendientes', data.reservations.pending]], action: { label: 'Ver reservas', path: '/app/reservations', capability: 'res.reservations.read' } },
    { title: 'Inventario', icon: Package, metrics: [['Artículos registrados', data.inventory.totalItems], ['Stock bajo', data.inventory.lowStockItems]], action: { label: 'Ver inventario', path: '/inventory', capability: 'inv.inventory.read' } },
    { title: 'Asambleas', icon: UsersRound, metrics: [['Programadas', data.assemblies.scheduled], ['En progreso', data.assemblies.in_progress]], action: { label: 'Ver asambleas', path: '/app/admin/assemblies', capability: 'adm.assemblies.read' } },
    { title: 'Donaciones', icon: FileText, metrics: [['Donaciones registradas', data.donations.total], ['Donaciones confirmadas', data.donations.confirmed]], action: { label: 'Ver donaciones', path: '/app/donations', capability: 'don.donations.read' } },
  ]
  return <section aria-labelledby="admin-snapshot-title"><Card className="h-full gap-0 border-border-subtle bg-surface-card py-4 shadow-elevation-0"><CardHeader className="grid-cols-[auto_1fr] gap-x-3"><IconTile icon={Landmark} /><h2 id="admin-snapshot-title" className="font-heading text-heading-3 font-semibold text-foreground">Panorama institucional</h2><CardDescription>Estado general de los principales módulos</CardDescription></CardHeader><CardContent className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{modules.map(module => <PanoramaGroup key={module.title} module={module} allowed={hasCapability(permissionCodes, module.action.capability)} />)}</CardContent></Card></section>
}

function PanoramaGroup({ module, allowed }: { module: { title: string; icon: Icon; metrics: Array<[string, number]>; action: { label: string; path: string } }; allowed: boolean }) {
  const IconComponent = module.icon
  return <article className="rounded-control border border-border-subtle bg-surface-muted/55 p-3"><div className="flex items-center gap-2"><IconTile icon={IconComponent} size="sm" /><h3 className="font-semibold text-text-primary">{module.title}</h3></div><dl className="mt-2 space-y-1 text-body-small">{module.metrics.map(([label, value]) => <div key={label} className="flex items-baseline justify-between gap-3"><dt className="text-text-secondary">{label}</dt><dd className="font-bold tabular-nums text-text-primary">{value.toLocaleString('es-CR')}</dd></div>)}</dl>{allowed ? <Link to={module.action.path} className="mt-3 inline-flex items-center gap-1.5 text-body-small font-bold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring">{module.action.label}<ArrowRight className="size-4" aria-hidden="true" /></Link> : null}</article>
}

type AttentionItem = { label: string; detail: string; count: number; icon: Icon; tone: 'warning' | 'danger'; path: string; capability: AccessCapability }

function AttentionPanel({ data, permissionCodes, accountRequests, canReadAccountRequests }: { data: AdminDashboardData; permissionCodes?: readonly string[]; accountRequests: AccountRequestStatus; canReadAccountRequests: boolean }) {
  const items: AttentionItem[] = []
  if (canReadAccountRequests && !accountRequests.isPending && !accountRequests.isError && (accountRequests.total ?? 0) > 0) items.push({ label: 'Solicitudes de cuenta', detail: 'Pendientes de revisión', count: accountRequests.total ?? 0, icon: UserPlus, tone: 'warning', path: '/admin/user-requests', capability: 'usr.user-requests.read' })
  if (data.affiliateRequests.pending > 0) items.push({ label: 'Solicitudes de afiliación', detail: 'Pendientes de revisión', count: data.affiliateRequests.pending, icon: UsersRound, tone: 'warning', path: '/app/admin/requests', capability: 'adm.requests.read' })
  if (data.inventory.lowStockItems > 0) items.push({ label: 'Artículos con stock bajo', detail: 'Existencias por revisar', count: data.inventory.lowStockItems, icon: Package, tone: 'warning', path: '/inventory/alerts', capability: 'inv.inventory.read' })
  if (data.inventory.overdueLoans > 0) items.push({ label: 'Préstamos vencidos', detail: 'Préstamos fuera de plazo', count: data.inventory.overdueLoans, icon: FileClock, tone: 'danger', path: '/inventory/loans', capability: 'inv.inventory.read' })
  if (data.inventory.outOfStockItems > 0) items.push({ label: 'Artículos agotados', detail: 'Sin existencias', count: data.inventory.outOfStockItems, icon: PackageX, tone: 'danger', path: '/inventory/alerts', capability: 'inv.inventory.read' })
  return <section aria-labelledby="admin-risks-title"><Card className="h-full gap-0 border-border-subtle bg-surface-card py-4 shadow-elevation-0"><CardHeader className="grid-cols-[auto_1fr] gap-x-3"><IconTile icon={AlertTriangle} tone="danger" /><h2 id="admin-risks-title" className="font-heading text-heading-3 font-semibold text-foreground">Requiere atención</h2><CardDescription>Pendientes y riesgos operativos</CardDescription></CardHeader><CardContent className="mt-3 space-y-2">{items.length ? items.map(item => <AttentionRow key={item.label} item={item} allowed={hasCapability(permissionCodes, item.capability)} />) : <EmptyState className="py-5" title="No hay pendientes de atención." description="No se registran alertas operativas activas." />}</CardContent></Card></section>
}

function AttentionRow({ item, allowed }: { item: AttentionItem; allowed: boolean }) {
  const IconComponent = item.icon
  const content = <><IconTile icon={IconComponent} tone={item.tone} size="sm" /><div className="min-w-0 flex-1"><h3 className="text-label font-bold text-text-primary">{item.label}</h3><p className="mt-0.5 text-body-small text-text-secondary"><span className="font-bold tabular-nums text-text-primary">{item.count.toLocaleString('es-CR')}</span> {item.detail.toLocaleLowerCase()}</p></div><span className={`rounded-full px-2 py-0.5 text-caption font-bold ${item.tone === 'danger' ? 'bg-status-danger-surface text-status-danger' : 'bg-status-warning-surface text-status-warning'}`}>{item.count.toLocaleString('es-CR')}</span><ArrowRight className="size-4 shrink-0 text-text-muted" aria-hidden="true" /></>
  return allowed ? <Link to={item.path} className="flex items-center gap-3 rounded-control border border-border-subtle bg-surface-muted/45 p-2.5 transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">{content}</Link> : <div className="flex items-center gap-3 rounded-control border border-border-subtle bg-surface-muted/45 p-2.5">{content}</div>
}

function RecentActivity() {
  return <section aria-labelledby="admin-recent-activity-title"><Card className="h-full gap-0 border-border-subtle bg-surface-card py-4 shadow-elevation-0"><CardHeader className="grid-cols-[auto_1fr] gap-x-3"><IconTile icon={Clock3} tone="info" /><h2 id="admin-recent-activity-title" className="font-heading text-heading-3 font-semibold text-foreground">Actividad reciente</h2><CardDescription>Últimos eventos registrados en los módulos administrativos</CardDescription></CardHeader><CardContent className="mt-3"><div className="rounded-control border border-dashed border-border-default bg-surface-muted/45 px-4 py-5 text-center"><p className="font-semibold text-text-primary">Actividad reciente no disponible</p><p className="mx-auto mt-1 max-w-md text-body-small text-text-secondary">Aún no existe una fuente consolidada y autorizada de eventos administrativos.</p></div></CardContent></Card></section>
}

function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  if (!actions.length) return null
  return <section aria-labelledby="admin-quick-actions-title"><Card className="h-full gap-0 border-border-subtle bg-surface-card py-4 shadow-elevation-0"><CardHeader className="grid-cols-[auto_1fr] gap-x-3"><IconTile icon={Zap} tone="warning" /><h2 id="admin-quick-actions-title" className="font-heading text-heading-3 font-semibold text-foreground">Accesos rápidos</h2><CardDescription>Tareas administrativas más comunes</CardDescription></CardHeader><CardContent className="mt-3"><nav aria-label="Accesos rápidos administrativos" className="grid gap-2 sm:grid-cols-2">{actions.map(action => <QuickAction key={action.path} action={action} />)}</nav></CardContent></Card></section>
}

function QuickAction({ action }: { action: QuickAction }) {
  const IconComponent = action.icon
  return <Link to={action.path} className="group flex min-h-13 items-center gap-3 rounded-control border border-border-subtle bg-surface-muted/40 px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"><IconTile icon={IconComponent} size="sm" /><span className="min-w-0 flex-1 text-body-small font-semibold text-text-primary">{action.label}</span><ArrowRight className="size-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" /></Link>
}

function IconTile({ icon: IconComponent, tone = 'brand', size = 'default' }: { icon: Icon; tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info'; size?: 'default' | 'sm' }) {
  const tones = { brand: 'bg-status-success-surface text-foreground-brand', success: 'bg-status-success-surface text-status-success', warning: 'bg-status-warning-surface text-status-warning', danger: 'bg-status-danger-surface text-status-danger', info: 'bg-status-info-surface text-status-info' }
  return <span className={`flex shrink-0 items-center justify-center rounded-control ${size === 'sm' ? 'size-8' : 'size-10'} ${tones[tone]}`}><IconComponent className={size === 'sm' ? 'size-4' : 'size-5'} aria-hidden="true" /></span>
}

function DashboardSkeleton() {
  return <div className="mt-4 space-y-3" aria-label="Cargando indicadores administrativos"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-35" />)}</div><div className="grid gap-3 lg:grid-cols-[minmax(0,1.85fr)_minmax(17rem,1fr)]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div></div>
}

function formatDashboardDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-CR', { dateStyle: 'full', timeZone: 'America/Costa_Rica' }).format(date) }
function hasData(data: AdminDashboardData) { return data.affiliates.total > 0 || data.affiliateRequests.pending > 0 || data.reservations.total > 0 || data.donations.total > 0 || data.inventory.totalItems > 0 || data.assemblies.total > 0 || data.justifications.pending > 0 }
