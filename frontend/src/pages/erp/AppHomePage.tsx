import { useEffect, useState } from 'react'
import { ArrowRight, Boxes, CalendarCheck, CalendarDays, CalendarPlus, ClipboardList, FileCheck2, FileClock, Landmark, Package, TriangleAlert, UserRound, Users, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import type { AccessCapability } from '@/shared/security/access'
import { AdminDashboard } from '@/features/admin-dashboard'
import { inventoryReportsService } from '@/services/inventoryReportsService'
import type { InventoryReportSummary } from '@/types/inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/skeleton'

const communityActions = [
  { label: 'Solicitar una reserva', description: 'Pida el uso de un espacio comunitario.', path: '/servicios/reservas', icon: CalendarPlus },
  { label: 'Enviar justificación', description: 'Justifique una ausencia a una asamblea.', path: '/app/affiliate/absence-justifications/new', icon: FileCheck2 },
  { label: 'Mis justificaciones', description: 'Revise el estado de lo que ha enviado.', path: '/app/affiliate/justifications', icon: ClipboardList },
] as const

const communityLinks = [
  { label: 'Mi perfil', path: '/profile', icon: UserRound },
  { label: 'Afiliación', path: '/afiliacion', icon: Users },
  { label: 'Eventos', path: '/eventos', icon: CalendarDays },
] as const

const operationalActions: ReadonlyArray<{
  label: string
  description: string
  path: string
  capability: AccessCapability
  icon: typeof Package
}> = [
  { label: 'Inventario', description: 'Consulte existencias, préstamos y alertas.', path: '/inventory', capability: 'inv.inventory.read', icon: Package },
  { label: 'Movimientos financieros', description: 'Revise los movimientos registrados.', path: '/app/financial/movements', capability: 'fin.movements.read', icon: WalletCards },
  { label: 'DINADECO', description: 'Consulte la información financiera disponible.', path: '/app/financial/dinadeco', capability: 'fin.dinadeco.read', icon: Landmark },
  { label: 'Reservas', description: 'Consulte y gestione reservas comunitarias.', path: '/app/reservations', capability: 'res.reservations.read', icon: CalendarCheck },
]

export function AppHomePage() {
  const { user } = useAuth()
  const permissionCodes = user?.permissionCodes ?? []

  // Capability-based visibility instead of role names
  const canViewRequests = hasCapability(permissionCodes, 'usr.user-requests.read')
  const canViewUsers = hasCapability(permissionCodes, 'usr.users.read')
  const canViewInventory = hasCapability(permissionCodes, 'inv.inventory.read')
  const showInventorySummary = canViewInventory && !canViewUsers
  const availableOperationalActions = operationalActions.filter((action) => {
    if (!hasCapability(permissionCodes, action.capability)) return false
    return !(canViewUsers && action.capability === 'res.reservations.read')
  })

  const [summary, setSummary] = useState<InventoryReportSummary | null>(null)
  const [loading, setLoading] = useState(showInventorySummary)
  const [inventoryError, setInventoryError] = useState(false)

  const firstName = user?.fullName?.trim().split(/\s+/)[0]

  useEffect(() => {
    if (!showInventorySummary) return
    let active = true
    inventoryReportsService.summary()
      .then((data) => { if (active) setSummary(data) })
      .catch(() => { if (active) setInventoryError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showInventorySummary])

  return (
    <PageContainer className="max-w-[1440px] space-y-8 lg:space-y-10">
      <PageHeader
        title="Dashboard"
        titleClassName="font-sans"
        context="Inicio"
        className="pb-5"
        description={`Bienvenido de nuevo${firstName ? `, ${firstName}` : ''}. Consulte información y tareas disponibles para su cuenta.`}
      />

      {canViewUsers && <AdminDashboard permissionCodes={user?.permissionCodes} />}

      {showInventorySummary && (
        <section aria-labelledby="summary-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 id="summary-title" className="text-xl font-bold text-brand-ink">Resumen de inventario</h2>
              <p className="mt-1 text-sm text-foreground-muted">Datos actuales del módulo de inventario.</p>
            </div>
            <Link to="/inventory" className="hidden items-center gap-1 text-sm font-bold text-brand-primary underline-offset-4 hover:underline sm:flex">Ver detalle <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando resumen de inventario" aria-busy="true">
              <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
            </div>
          ) : summary ? (
            <InventoryOverview summary={summary} />
          ) : (
            <Card role={inventoryError ? 'alert' : undefined}><CardContent className="text-sm text-foreground-muted">{inventoryError ? 'No fue posible cargar el resumen de inventario.' : 'No hay datos de inventario para mostrar.'}</CardContent></Card>
          )}
        </section>
      )}

      {availableOperationalActions.length > 0 && (
        <section aria-labelledby="operational-actions-title">
          <SectionHeading id="operational-actions-title" title="Módulos disponibles" description="Áreas operativas habilitadas para su cuenta." />
          <nav aria-label="Módulos disponibles" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {availableOperationalActions.map((action) => <ActionCard key={action.path} action={action} compact />)}
          </nav>
        </section>
      )}

      {canViewRequests && (
        <section aria-labelledby="community-actions-title">
          <SectionHeading id="community-actions-title" title="Gestiones personales" description="Solicitudes y consultas relacionadas con su participación comunitaria." />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {communityActions.map((action) => <ActionCard key={action.path} action={action} />)}
          </div>
        </section>
      )}

      {canViewRequests && (
        <section aria-labelledby="community-links-title">
          <h2 id="community-links-title" className="text-heading-3 font-semibold text-brand-ink">Consultas personales</h2>
          <nav aria-label="Consultas de la comunidad" className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {communityLinks.map((item) => {
              const Icon = item.icon
              return <Link key={item.path} to={item.path} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-card px-4 font-semibold text-brand-deep hover:border-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"><Icon className="size-4" aria-hidden="true" />{item.label}</Link>
            })}
          </nav>
        </section>
      )}

    </PageContainer>
  )
}

function ActionCard({ action, compact = false }: { action: { label: string; description: string; path: string; icon: typeof Package }; compact?: boolean }) {
  const Icon = action.icon
  return <Link to={action.path} className="group rounded-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"><Card size={compact ? 'sm' : 'default'} className="h-full shadow-none transition-colors group-hover:border-brand-soft group-hover:bg-surface-elevated"><CardHeader className={compact ? 'grid-cols-[auto_1fr_auto] items-center gap-x-3' : undefined}><div className={compact ? 'flex size-9 items-center justify-center rounded-control bg-brand-soft/20 text-brand-deep' : 'mb-2 flex size-9 items-center justify-center rounded-control bg-brand-soft/25 text-brand-deep'}><Icon className="size-5" aria-hidden="true" /></div><div><CardTitle>{action.label}</CardTitle><CardDescription className="mt-1">{action.description}</CardDescription></div>{compact && <ArrowRight className="size-4 text-foreground-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />}</CardHeader></Card></Link>
}

function Metric({ label, value, icon: Icon, attention = false }: { label: string; value: number; icon: typeof Package; attention?: boolean }) {
  return <Card size="sm" className={attention ? 'border-warning/60 shadow-none' : 'shadow-none'}><CardHeader className="grid grid-cols-[1fr_auto]"><div><CardDescription>{label}</CardDescription><CardTitle className="mt-2 text-3xl font-bold tabular-nums">{value.toLocaleString('es-CR')}</CardTitle></div><div className={`flex size-9 items-center justify-center rounded-control ${attention ? 'bg-warning-bg text-warning' : 'bg-brand-soft/20 text-brand-deep'}`}><Icon className="size-5" aria-hidden="true" /></div></CardHeader></Card>
}

function InventoryOverview({ summary }: { summary: InventoryReportSummary }) {
  const attentionItems = [
    summary.outOfStockCount > 0 ? { label: 'Artículos agotados', value: summary.outOfStockCount, path: '/inventory/alerts', icon: Boxes } : null,
    summary.overdueLoans > 0 ? { label: 'Préstamos vencidos', value: summary.overdueLoans, path: '/inventory/loans', icon: FileClock } : null,
    summary.lowStockCount > 0 ? { label: 'Stock bajo', value: summary.lowStockCount, path: '/inventory/alerts', icon: TriangleAlert } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]"><div className="grid gap-3 sm:grid-cols-2"><Metric label="Artículos activos" value={summary.activeItems} icon={Package} /><Metric label="Préstamos activos" value={summary.activeLoans} icon={FileClock} /></div><section aria-labelledby="inventory-attention-title"><SectionHeading id="inventory-attention-title" title="Atención requerida" description="Alertas reales que requieren revisión." />{attentionItems.length > 0 ? <div className="mt-3 grid gap-2">{attentionItems.map((item) => { const Icon = item.icon; return <Link key={item.label} to={item.path} className="group flex min-h-12 items-center gap-3 rounded-control border border-border bg-surface-card px-3 py-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"><Icon className="size-5 shrink-0 text-warning" aria-hidden="true" /><span className="min-w-0 flex-1 text-sm font-semibold text-text-primary">{item.label}</span><span className="tabular-nums text-sm font-bold text-text-primary">{item.value.toLocaleString('es-CR')}</span><ArrowRight className="size-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" /></Link> })}</div> : <p className="mt-3 rounded-control border border-border-subtle bg-surface-muted px-4 py-3 text-sm text-text-secondary">No hay alertas de inventario pendientes.</p>}</section></div>
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div><h2 id={id} className="text-heading-2 font-bold text-brand-ink">{title}</h2><p className="mt-1 text-body-small text-foreground-muted">{description}</p></div>
}
