import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, CircleAlert, ClipboardList, FileClock, FileText, Heart, Package, PackageX, RefreshCw, Sun, UserPlus, Users, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePublicEvents } from '@/features/events'
import type { PublicEvent } from '@/features/events'
import { useAssemblies } from '@/features/assemblies'
import type { Assembly } from '@/features/assemblies'
import { useReservationsList } from '@/features/reservations'
import type { AdminReservation } from '@/features/reservations'
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
type Tone = 'success' | 'warning' | 'danger' | 'info' | 'violet'
type QuickAction = { label: string; path: string; capability: AccessCapability; icon: Icon; tone: Tone }
type CalendarCategory = 'reservations' | 'assemblies' | 'events'
type CalendarActivity = { category: CalendarCategory; startAt: string }

const quickActions: readonly QuickAction[] = [
  { label: 'Gestionar afiliados', path: '/app/admin/affiliates', capability: 'adm.affiliates.read', icon: Users, tone: 'success' },
  { label: 'Gestionar reservas', path: '/app/reservations', capability: 'res.reservations.read', icon: CalendarCheck, tone: 'info' },
  { label: 'Inventario', path: '/inventory', capability: 'inv.inventory.read', icon: Package, tone: 'success' },
  { label: 'Convocar asamblea', path: '/app/admin/assemblies', capability: 'adm.assemblies.read', icon: UsersRound, tone: 'warning' },
  { label: 'Registrar donación', path: '/app/donations', capability: 'don.donations.read', icon: Heart, tone: 'violet' },
  { label: 'Ver reportes', path: '/inventory/reports', capability: 'inv.inventory.read', icon: FileText, tone: 'info' },
]

export function AdminDashboard({ permissionCodes, userName }: AdminDashboardProps) {
  const dashboard = useAdminDashboard()
  const events = usePublicEvents()
  const [calendarMonth, setCalendarMonth] = useState(() => currentCostaRicaMonth())
  const canReadAccountRequests = hasCapability(permissionCodes, 'usr.user-requests.read')
  const canReadReservations = hasCapability(permissionCodes, 'res.reservations.read')
  const canReadAssemblies = hasCapability(permissionCodes, 'adm.assemblies.read')
  const reservationCalendar = useReservationsList(calendarMonthFilters(calendarMonth), canReadReservations)
  const assembliesCalendar = useAssemblies(canReadAssemblies)
  const accountRequests = useQuery({ queryKey: ['user-requests', 'dashboard', 'pending'], queryFn: () => userRequestsService.list({ page: 1, limit: 1, status: 'PENDING' }), enabled: canReadAccountRequests, staleTime: 30_000 })

  if (dashboard.isPending) return <section aria-busy="true"><InstitutionalWelcome fullName={userName} /><DashboardSkeleton /></section>
  if (dashboard.isError) return <section><InstitutionalWelcome fullName={userName} /><ErrorState className="mt-5" title="No fue posible cargar los indicadores" message="Intente nuevamente para consultar el estado administrativo actual." action={<Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}><RefreshCw aria-hidden="true" />Reintentar</Button>} /></section>

  const { data, metadata } = dashboard.data
  if (!hasData(data)) return <section><InstitutionalWelcome fullName={userName} generatedAt={metadata.generatedAt} /><EmptyState className="mt-5" title="Aún no hay datos administrativos para mostrar." description="Los indicadores aparecerán cuando los módulos registren información." /></section>

  const accountStatus = { isPending: accountRequests.isPending, isError: accountRequests.isError, total: accountRequests.data?.total }
  return <section className="space-y-4">
    <InstitutionalWelcome fullName={userName} generatedAt={metadata.generatedAt} />
    <KpiRow data={data} permissionCodes={permissionCodes} accountRequests={accountStatus} canReadAccountRequests={canReadAccountRequests} />
    <div className="grid min-w-0 gap-3 min-[1200px]:grid-cols-[minmax(0,1.32fr)_minmax(0,1fr)_minmax(0,0.9fr)] min-[1200px]:items-stretch">
      <AttentionPanel data={data} permissionCodes={permissionCodes} accountRequests={accountStatus} canReadAccountRequests={canReadAccountRequests} />
      <QuickActions actions={quickActions.filter(action => hasCapability(permissionCodes, action.capability))} />
      <InstitutionalCalendar month={calendarMonth} onMonthChange={setCalendarMonth} events={events.data} reservations={reservationCalendar.data?.data} assemblies={assembliesCalendar.data} includeReservations={canReadReservations} includeAssemblies={canReadAssemblies} isPending={events.isPending || (canReadReservations && reservationCalendar.isPending) || (canReadAssemblies && assembliesCalendar.isPending)} isError={events.isError || (canReadReservations && reservationCalendar.isError) || (canReadAssemblies && assembliesCalendar.isError)} onRetry={() => { void events.refetch(); if (canReadReservations) void reservationCalendar.refetch(); if (canReadAssemblies) void assembliesCalendar.refetch() }} />
    </div>
    <div className="grid min-w-0 gap-3 min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,1.12fr)] min-[1200px]:items-stretch">
      <ModuleSummary data={data} permissionCodes={permissionCodes} />
      <ProcessStatus />
      <UpcomingActivities events={events.data} isPending={events.isPending} isError={events.isError} onRetry={() => void events.refetch()} />
    </div>
  </section>
}

function InstitutionalWelcome({ fullName, generatedAt }: { fullName?: string; generatedAt?: string }) {
  const firstName = fullName?.trim().split(/\s+/)[0]
  const date = generatedAt ? formatDashboardDate(generatedAt) : null
  return <header className="relative isolate min-h-42 overflow-hidden border-y border-erp-border bg-erp-surface-subtle xl:-mx-6 xl:-mt-9"><img src="/images/public/home/hero-curime-wide.webp" alt="" className="absolute inset-0 -z-20 size-full object-cover object-center" /><div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fffdf7] via-[#fffdf7]/90 to-[#fffdf7]/35" /><div className="grid min-h-42 gap-5 px-5 py-6 sm:px-7 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)] md:items-center md:px-10 md:py-5"><div className="flex min-w-0 gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-status-warning-surface text-erp-accent"><Sun className="size-7" aria-hidden="true" /></span><div className="min-w-0"><p className="text-caption font-bold uppercase tracking-[0.16em] text-erp-accent">Administración</p><h1 id="admin-indicators-title" className="mt-1 font-sans text-heading-1 font-bold leading-tight tracking-[-0.025em] text-[#073f31]">Buenos días{firstName ? `, ${firstName}` : ''}</h1><p className="mt-1 text-body text-erp-text">Aquí tiene el resumen de la gestión de la ADI Curime.</p>{date ? <p className="mt-3 flex items-center gap-2 text-body-small text-erp-text"><CalendarDays className="size-4 shrink-0 text-erp-navigation" aria-hidden="true" /><time dateTime={generatedAt}>{date}</time></p> : null}</div></div><aside className="rounded-surface border border-white/70 bg-[#fffdf7]/90 px-5 py-4 text-[#073f31] shadow-lg backdrop-blur-sm"><p className="font-sans text-heading-3 font-semibold leading-snug tracking-[-0.01em]">Una comunidad organizada construye más oportunidades.</p><p className="mt-2 text-body-small text-erp-text-muted">ADI Curime</p></aside></div></header>
}

function KpiRow({ data, permissionCodes, accountRequests, canReadAccountRequests }: { data: AdminDashboardData; permissionCodes?: readonly string[]; accountRequests: AccountRequestStatus; canReadAccountRequests: boolean }) {
  const accountValue = !canReadAccountRequests ? null : accountRequests.isPending ? '—' : accountRequests.isError ? null : accountRequests.total ?? 0
  return <section aria-labelledby="admin-indicators-title" className="grid min-w-0 gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-4">
    <KpiCard title="Afiliados activos" subtitle="Registrados en el sistema" value={data.affiliates.active} icon={Users} tone="success" action={hasCapability(permissionCodes, 'adm.affiliates.read') ? { label: 'Ver afiliados', path: '/app/admin/affiliates' } : undefined} />
    <KpiCard title="Reservas pendientes" subtitle="Por confirmar" value={data.reservations.pending} icon={CalendarCheck} tone="info" action={hasCapability(permissionCodes, 'res.reservations.read') ? { label: 'Gestionar reservas', path: '/app/reservations' } : undefined} />
    <KpiCard title="Artículos en inventario" subtitle="Registrados en el sistema" value={data.inventory.totalItems} icon={Package} tone="warning" action={hasCapability(permissionCodes, 'inv.inventory.read') ? { label: 'Ver inventario', path: '/inventory' } : undefined} />
    <KpiCard title="Solicitudes pendientes" subtitle={accountValue === null ? 'Información no disponible' : 'Pendientes de revisión'} value={accountValue} icon={UserPlus} tone="danger" action={canReadAccountRequests && !accountRequests.isError ? { label: 'Ver solicitudes', path: '/admin/user-requests' } : undefined} />
  </section>
}

function KpiCard({ title, subtitle, value, icon: IconComponent, tone, action }: { title: string; subtitle: string; value: number | string | null; icon: Icon; tone: Tone; action?: { label: string; path: string } }) {
  return <article className="flex min-h-34 flex-col rounded-surface border border-erp-border bg-erp-surface-raised p-4 shadow-elevation-0"><div className="flex items-start gap-3"><IconTile icon={IconComponent} tone={tone} /><div className="min-w-0 pt-0.5"><h2 className="text-label font-semibold leading-snug text-erp-text">{title}</h2><p className="mt-0.5 text-caption text-erp-text-muted">{subtitle}</p></div></div><div className="mt-3 flex items-end justify-between gap-3"><p className="text-heading-1 leading-none font-bold tabular-nums tracking-[-0.025em] text-erp-text">{displayCount(value)}</p>{action ? <Link to={action.path} aria-label={action.label} className="grid size-8 place-items-center rounded-full text-erp-navigation transition-colors hover:bg-status-success-surface focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-erp-focus"><ArrowRight className="size-4" aria-hidden="true" /></Link> : null}</div><p className="mt-auto pt-2 text-caption text-erp-text-muted">Actualizado con datos del sistema</p></article>
}

type AttentionItem = { label: string; detail: string; count: number; icon: Icon; tone: Tone; path: string; capability: AccessCapability }
function AttentionPanel({ data, permissionCodes, accountRequests, canReadAccountRequests }: { data: AdminDashboardData; permissionCodes?: readonly string[]; accountRequests: AccountRequestStatus; canReadAccountRequests: boolean }) {
  const items: AttentionItem[] = []
  if (canReadAccountRequests && !accountRequests.isPending && !accountRequests.isError && (accountRequests.total ?? 0) > 0) items.push({ label: 'Solicitudes de cuenta', detail: 'Pendientes de revisión', count: accountRequests.total ?? 0, icon: UserPlus, tone: 'danger', path: '/admin/user-requests', capability: 'usr.user-requests.read' })
  if (hasCapability(permissionCodes, 'adm.requests.read') && data.affiliateRequests.pending > 0) items.push({ label: 'Solicitudes de afiliación', detail: 'Pendientes de revisión', count: data.affiliateRequests.pending, icon: UsersRound, tone: 'warning', path: '/app/admin/requests', capability: 'adm.requests.read' })
  if (hasCapability(permissionCodes, 'inv.inventory.read') && data.inventory.lowStockItems > 0) items.push({ label: 'Artículos con stock bajo', detail: 'Existencias por revisar', count: data.inventory.lowStockItems, icon: Package, tone: 'warning', path: '/inventory/alerts', capability: 'inv.inventory.read' })
  if (hasCapability(permissionCodes, 'inv.inventory.read') && data.inventory.overdueLoans > 0) items.push({ label: 'Préstamos vencidos', detail: 'Préstamos fuera de plazo', count: data.inventory.overdueLoans, icon: FileClock, tone: 'danger', path: '/inventory/loans', capability: 'inv.inventory.read' })
  if (hasCapability(permissionCodes, 'inv.inventory.read') && data.inventory.outOfStockItems > 0) items.push({ label: 'Artículos agotados', detail: 'Sin existencias', count: data.inventory.outOfStockItems, icon: PackageX, tone: 'danger', path: '/inventory/alerts', capability: 'inv.inventory.read' })
  return <section aria-label="Atención requerida"><DashboardCard title="Atención requerida" description="Pendientes y riesgos operativos" icon={AlertTriangle} tone="danger" count={items.reduce((total, item) => total + item.count, 0)}>{items.length ? <div className="divide-y divide-erp-border">{items.map(item => <AttentionRow key={item.label} item={item} />)}</div> : <EmptyState className="py-8" title="No hay pendientes de atención." description="No se registran alertas operativas activas." />}</DashboardCard></section>
}

function AttentionRow({ item }: { item: AttentionItem }) { const IconComponent = item.icon; return <Link to={item.path} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"><IconTile icon={IconComponent} tone={item.tone} size="sm" /><div className="min-w-0 flex-1"><h3 className="text-body-small font-bold leading-snug text-erp-text">{displayCount(item.count)} {item.label.toLocaleLowerCase('es')}</h3><p className="mt-0.5 text-caption text-erp-text-muted">{item.detail}</p></div><ChevronRight className="size-4 shrink-0 text-erp-text-muted" aria-hidden="true" /></Link> }

function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return <section aria-label="Accesos rápidos"><DashboardCard title="Accesos rápidos" icon={ClipboardList} tone="info">{actions.length ? <nav aria-label="Accesos rápidos administrativos" className="grid grid-cols-3 gap-2">{actions.map(action => <QuickAction key={action.path} action={action} />)}</nav> : <EmptyState className="py-8" title="No hay accesos disponibles." description="No cuenta con acciones administrativas autorizadas." />}</DashboardCard></section>
}
function QuickAction({ action }: { action: QuickAction }) { const IconComponent = action.icon; return <Link to={action.path} className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-control border border-erp-border bg-erp-surface-subtle/70 p-2 text-center transition-colors hover:border-erp-border-strong hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"><IconTile icon={IconComponent} tone={action.tone} /><span className="text-body-small font-semibold leading-snug text-erp-text">{action.label}</span></Link> }

function InstitutionalCalendar({ month, onMonthChange, events, reservations, assemblies, includeReservations, includeAssemblies, isPending, isError, onRetry }: { month: Date; onMonthChange: (month: Date) => void; events?: PublicEvent[]; reservations?: AdminReservation[]; assemblies?: Assembly[]; includeReservations: boolean; includeAssemblies: boolean; isPending: boolean; isError: boolean; onRetry: () => void }) {
  const activities = useMemo(() => calendarActivities(events, reservations, assemblies, includeReservations, includeAssemblies), [assemblies, events, includeAssemblies, includeReservations, reservations])
  const activitiesByDay = useMemo(() => groupActivitiesByDay(activities, month), [activities, month])
  const calendar = getCalendarDays(month)
  const monthLabel = new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric', timeZone: COSTA_RICA_TIME_ZONE }).format(month)

  return <section aria-label="Calendario institucional"><DashboardCard title="Calendario institucional" icon={CalendarDays} tone="info"><div className="mb-3 flex items-center justify-between"><Button type="button" variant="ghost" size="icon-sm" aria-label="Mes anterior" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft aria-hidden="true" /></Button><p className="text-body-small font-bold capitalize text-erp-text">{monthLabel}</p><Button type="button" variant="ghost" size="icon-sm" aria-label="Mes siguiente" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight aria-hidden="true" /></Button></div>{isPending ? <Skeleton className="h-48" /> : isError ? <InlineRetry message="No fue posible cargar actividades institucionales." onRetry={onRetry} /> : <><div className="grid grid-cols-7 gap-y-1 text-center text-caption font-semibold text-erp-text-muted" aria-hidden="true">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => <span key={day}>{day}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-y-1" role="grid" aria-label="Días del mes">{calendar.map(day => <CalendarDay key={day.key} day={day} activities={activitiesByDay.get(day.key) ?? []} />)}</div><CalendarLegend includeReservations={includeReservations} includeAssemblies={includeAssemblies} /></>}</DashboardCard></section>
}

function CalendarDay({ day, activities }: { day: CalendarDayData; activities: readonly CalendarActivity[] }) {
  const categories = (['reservations', 'assemblies', 'events'] as const).filter(category => activities.some(activity => activity.category === category))
  const singleCategory = categories.length === 1 ? categories[0] : null
  const style = singleCategory ? calendarCategoryStyles[singleCategory] : null
  const activityLabel = activities.length ? `, ${activities.length} ${activities.length === 1 ? 'actividad' : 'actividades'}: ${categories.map(category => calendarCategoryStyles[category].label).join(', ')}` : ''
  return <span role="gridcell" aria-label={`${formatCalendarDay(day.key)}${activityLabel}`} className={`relative mx-auto grid size-8 place-items-center rounded-full text-caption font-medium ${day.current ? 'text-erp-text' : 'text-erp-text-muted/60'} ${style ? style.surface : ''}`}><span>{day.date.getDate()}</span>{categories.length ? <span aria-hidden="true" className="absolute bottom-0.5 flex gap-0.5">{categories.map(category => <span key={category} className={`size-1 rounded-full ${calendarCategoryStyles[category].dot}`} />)}</span> : null}</span>
}

function CalendarLegend({ includeReservations, includeAssemblies }: { includeReservations: boolean; includeAssemblies: boolean }) {
  return <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-caption text-erp-text-muted"><CalendarLegendItem category="reservations" unavailable={!includeReservations} /><CalendarLegendItem category="assemblies" unavailable={!includeAssemblies} /><CalendarLegendItem category="events" /><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#8d56dc]" aria-hidden="true" />Otros <span className="sr-only">: sin fuente autorizada</span></span></div>
}

function CalendarLegendItem({ category, unavailable = false }: { category: CalendarCategory; unavailable?: boolean }) { const style = calendarCategoryStyles[category]; return <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${style.dot}`} aria-hidden="true" />{style.label}{unavailable ? <span className="sr-only">: sin acceso</span> : null}</span> }

const calendarCategoryStyles: Record<CalendarCategory, { label: string; dot: string; surface: string }> = {
  reservations: { label: 'Reservas', dot: 'bg-[#2878f0]', surface: 'bg-[#e9f2ff] text-[#145ecb]' },
  assemblies: { label: 'Asambleas', dot: 'bg-[#279b72]', surface: 'bg-[#e6f6ee] text-[#0c7350]' },
  events: { label: 'Eventos', dot: 'bg-[#d69b2d]', surface: 'bg-[#fdf3df] text-[#9b6610]' },
}
function ModuleSummary({ data, permissionCodes }: { data: AdminDashboardData; permissionCodes?: readonly string[] }) {
  const modules: Array<{ title: string; value: string; icon: Icon; tone: Tone; path: string; capability: AccessCapability }> = [
    { title: 'Afiliados', value: `${displayCount(data.affiliates.active)} activos`, icon: Users, tone: 'success', path: '/app/admin/affiliates', capability: 'adm.affiliates.read' },
    { title: 'Reservas', value: `${displayCount(data.reservations.total)} total`, icon: CalendarCheck, tone: 'info', path: '/app/reservations', capability: 'res.reservations.read' },
    { title: 'Inventario', value: `${displayCount(data.inventory.totalItems)} artículos`, icon: Package, tone: 'warning', path: '/inventory', capability: 'inv.inventory.read' },
    { title: 'Asambleas', value: `${displayCount(data.assemblies.scheduled)} programadas`, icon: UsersRound, tone: 'success', path: '/app/admin/assemblies', capability: 'adm.assemblies.read' },
    { title: 'Donaciones', value: `${displayCount(data.donations.total)} registradas`, icon: Heart, tone: 'danger', path: '/app/donations', capability: 'don.donations.read' },
  ]
  return <section aria-labelledby="admin-summary-title"><DashboardCard title="Resumen por módulo" icon={ClipboardList} tone="success"> <div className="divide-y divide-erp-border">{modules.map(module => <ModuleRow key={module.title} module={module} allowed={hasCapability(permissionCodes, module.capability)} />)}</div></DashboardCard></section>
}
function ModuleRow({ module, allowed }: { module: { title: string; value: string; icon: Icon; tone: Tone; path: string }; allowed: boolean }) { const IconComponent = module.icon; const content = <><IconTile icon={IconComponent} tone={module.tone} size="sm" /><span className="min-w-0 flex-1 text-body-small font-semibold text-erp-text">{module.title}</span><span className="text-caption text-erp-text-muted">{module.value}</span>{allowed ? <ChevronRight className="size-4 shrink-0 text-erp-text-muted" aria-hidden="true" /> : null}</>; return allowed ? <Link to={module.path} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus">{content}</Link> : <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">{content}</div> }

function ProcessStatus() { return <section aria-labelledby="admin-process-title"><DashboardCard title="Estado de procesos" icon={CircleAlert} tone="warning"><div className="flex min-h-36 items-center gap-4 rounded-control border border-dashed border-erp-border bg-erp-surface-subtle/50 px-4 py-4"><div className="grid size-20 shrink-0 place-items-center rounded-full border-8 border-dashed border-erp-border bg-erp-surface-raised text-center"><div><p className="text-heading-3 font-bold leading-none text-erp-text">—</p><p className="mt-1 text-caption text-erp-text-muted">Sin cálculo</p></div></div><div><div className="flex items-center gap-2 text-body-small font-bold text-erp-text"><CircleAlert className="size-4 text-erp-accent" aria-hidden="true" />Información no disponible</div><p className="mt-1.5 text-caption leading-relaxed text-erp-text-muted">No existe una definición institucional verificable para calcular un porcentaje global de procesos.</p></div></div></DashboardCard></section> }

function UpcomingActivities({ events, isPending, isError, onRetry }: { events?: PublicEvent[]; isPending: boolean; isError: boolean; onRetry: () => void }) {
  const upcoming = useMemo(() => (Array.isArray(events) ? events : []).filter(event => event.status === 'SCHEDULED' && new Date(event.startAt).getTime() >= startOfToday().getTime()).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).slice(0, 4), [events])
  return <section aria-labelledby="admin-upcoming-title"><DashboardCard title="Próximas actividades" icon={CalendarDays} tone="info">{isPending ? <Skeleton className="h-52" /> : isError ? <InlineRetry message="No fue posible cargar actividades." onRetry={onRetry} /> : upcoming.length ? <div className="divide-y divide-erp-border">{upcoming.map(event => <UpcomingEvent key={event.publicId} event={event} />)}</div> : <EmptyState className="py-8" title="No hay actividades próximas." description="Los eventos públicos programados aparecerán aquí." />}</DashboardCard></section>
}
function UpcomingEvent({ event }: { event: PublicEvent }) { const date = new Date(event.startAt); return <Link to={`/eventos/${event.publicId}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-erp-surface-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-erp-focus"><time dateTime={event.startAt} className="grid size-11 shrink-0 place-items-center rounded-control bg-status-info-surface text-center text-caption font-bold leading-tight text-status-info"><span>{new Intl.DateTimeFormat('es-CR', { month: 'short', timeZone: 'America/Costa_Rica' }).format(date).replace('.', '').toUpperCase()}</span><span className="text-body-small">{new Intl.DateTimeFormat('es-CR', { day: '2-digit', timeZone: 'America/Costa_Rica' }).format(date)}</span></time><div className="min-w-0 flex-1"><h3 className="truncate text-body-small font-bold text-erp-text">{event.title}</h3><p className="mt-0.5 truncate text-caption text-erp-text-muted">{formatEventTime(event.startAt)}{event.location ? ` · ${event.location}` : ''}</p></div><ChevronRight className="size-4 shrink-0 text-erp-text-muted" aria-hidden="true" /></Link> }

function DashboardCard({ title, description, icon: _IconComponent, tone: _tone, count, children }: { title: string; description?: string; icon: Icon; tone: Tone; count?: number; children: ReactNode }) { const id = `admin-${title.toLowerCase().replaceAll(' ', '-')}-title`; return <Card className="h-full gap-0 border-erp-border bg-erp-surface-raised py-4 shadow-elevation-0"><CardHeader className="flex-row items-center justify-between gap-3"><div><h2 id={id} className="font-sans text-heading-3 font-bold leading-snug tracking-[-0.01em] text-erp-text">{title}</h2>{description ? <CardDescription className="mt-0.5 text-caption">{description}</CardDescription> : null}</div>{count ? <span className="rounded-full bg-status-danger px-2 py-0.5 text-caption font-bold text-white">{displayCount(count)}</span> : null}</CardHeader><CardContent className="mt-3">{children}</CardContent></Card> }
function InlineRetry({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="py-8 text-center"><p className="text-body-small text-erp-text-muted">{message}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>Reintentar</Button></div> }
function IconTile({ icon: IconComponent, tone = 'success', size = 'default' }: { icon: Icon; tone?: Tone; size?: 'default' | 'sm' }) { const tones: Record<Tone, string> = { success: 'bg-status-success-surface text-status-success', warning: 'bg-status-warning-surface text-status-warning', danger: 'bg-status-danger-surface text-status-danger', info: 'bg-status-info-surface text-status-info', violet: 'bg-status-info-surface text-status-info' }; return <span className={`flex shrink-0 items-center justify-center rounded-control ${size === 'sm' ? 'size-8' : 'size-10'} ${tones[tone]}`}><IconComponent className={size === 'sm' ? 'size-4' : 'size-5'} aria-hidden="true" /></span> }
function DashboardSkeleton() { return <div className="mt-4 space-y-3" aria-label="Cargando indicadores administrativos"><Skeleton className="h-38" /><div className="grid min-w-0 gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-35" />)}</div><div className="grid min-w-0 gap-3 min-[1200px]:grid-cols-3"><Skeleton className="h-80" /><Skeleton className="h-80" /><Skeleton className="h-80" /></div></div> }
const COSTA_RICA_TIME_ZONE = 'America/Costa_Rica'
type CalendarDayData = { date: Date; key: string; current: boolean }

function calendarActivities(events: PublicEvent[] | undefined, reservations: AdminReservation[] | undefined, assemblies: Assembly[] | undefined, includeReservations: boolean, includeAssemblies: boolean): CalendarActivity[] {
  const activities: CalendarActivity[] = (Array.isArray(events) ? events : []).filter(event => event.status === 'SCHEDULED').map<CalendarActivity>(event => ({ category: 'events', startAt: event.startAt }))
  if (includeReservations) activities.push(...(Array.isArray(reservations) ? reservations : []).filter(reservation => reservation.status === 'APPROVED' || reservation.status === 'CONFIRMED').map<CalendarActivity>(reservation => ({ category: 'reservations', startAt: reservation.startAt })))
  if (includeAssemblies) activities.push(...(Array.isArray(assemblies) ? assemblies : []).filter(assembly => assembly.status !== 'CANCELLED').map<CalendarActivity>(assembly => ({ category: 'assemblies', startAt: assembly.date })))
  return activities
}

function groupActivitiesByDay(activities: readonly CalendarActivity[], month: Date) { const prefix = civilMonthKey(month); return activities.reduce((grouped, activity) => { const key = calendarKey(activity.startAt); if (key.startsWith(prefix)) grouped.set(key, [...(grouped.get(key) ?? []), activity]); return grouped }, new Map<string, CalendarActivity[]>()) }
function getCalendarDays(month: Date): CalendarDayData[] { const first = new Date(month.getFullYear(), month.getMonth(), 1); const offset = (first.getDay() + 6) % 7; const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset); return Array.from({ length: 42 }, (_, index) => { const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index); return { date, key: civilDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate()), current: date.getMonth() === month.getMonth() } }) }
function calendarKey(value: string | Date) { const date = new Date(value); const parts = new Intl.DateTimeFormat('en-US', { timeZone: COSTA_RICA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date); const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''; return `${part('year')}-${part('month')}-${part('day')}` }
function currentCostaRicaMonth() { const parts = calendarKey(new Date()).split('-').map(Number); return new Date(parts[0], parts[1] - 1, 1) }
function calendarMonthFilters(month: Date) { const year = month.getFullYear(); const monthIndex = month.getMonth(); return { from: civilDateKey(year, monthIndex + 1, 1), to: civilDateKey(year, monthIndex + 2, 0), page: 1, limit: 100 } }
function civilMonthKey(month: Date) { return civilDateKey(month.getFullYear(), month.getMonth() + 1, 1).slice(0, 7) }
function civilDateKey(year: number, month: number, day: number) { const date = new Date(year, month - 1, day); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function formatCalendarDay(value: string) { const [year, month, day] = value.split('-').map(Number); return new Intl.DateTimeFormat('es-CR', { dateStyle: 'full', timeZone: COSTA_RICA_TIME_ZONE }).format(new Date(Date.UTC(year, month - 1, day, 12))) }
function startOfToday() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
function displayCount(value: number | string | null) { return value === null ? '—' : typeof value === 'number' ? value.toLocaleString('es-CR') : value }
function formatDashboardDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-CR', { dateStyle: 'full', timeZone: 'America/Costa_Rica' }).format(date) }
function formatEventTime(value: string) { const date = new Date(value); return new Intl.DateTimeFormat('es-CR', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Costa_Rica' }).format(date) }
function hasData(data: AdminDashboardData) { return data.affiliates.total > 0 || data.affiliateRequests.pending > 0 || data.reservations.total > 0 || data.donations.total > 0 || data.inventory.totalItems > 0 || data.assemblies.total > 0 || data.justifications.pending > 0 }
