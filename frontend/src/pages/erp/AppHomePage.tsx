import { useEffect, useState } from 'react'
import { ArrowRight, Boxes, CalendarDays, CalendarPlus, ClipboardList, FileCheck2, FileClock, Package, TriangleAlert, UserRound, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { AdminDashboard } from '@/features/admin-dashboard'
import { inventoryReportsService } from '@/services/inventoryReportsService'
import type { InventoryReportSummary } from '@/types/inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageContainer } from '@/shared/ui/PageContainer'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/skeleton'

const communityActions = [
  { label: 'Solicitar una reserva', description: 'Pida el uso de un espacio comunitario.', path: '/servicios/reservas', icon: CalendarPlus, requiresAffiliation: false },
  { label: 'Enviar justificación', description: 'Justifique una ausencia a una asamblea.', path: '/app/affiliate/absence-justifications/new', icon: FileCheck2, requiresAffiliation: true },
  { label: 'Mis justificaciones', description: 'Revise el estado de lo que ha enviado.', path: '/app/affiliate/justifications', icon: ClipboardList, requiresAffiliation: true },
] as const

const communityLinks = [
  { label: 'Mi perfil', path: '/profile', icon: UserRound },
  { label: 'Afiliación', path: '/afiliacion', icon: Users },
  { label: 'Eventos', path: '/eventos', icon: CalendarDays },
] as const

export function AppHomePage() {
  const { user } = useAuth()
  const permissionCodes = user?.permissionCodes ?? []

  // Capability-based visibility instead of role names
  const canViewUsers = hasCapability(permissionCodes, 'usr.users.read')
  const canViewInventory = hasCapability(permissionCodes, 'inv.inventory.read')
  const canViewFinancialMovements = hasCapability(permissionCodes, 'fin.movements.read')
  const canViewDinadeco = hasCapability(permissionCodes, 'fin.dinadeco.read')
  const canViewAuditLogs = hasCapability(permissionCodes, 'aud.logs.read')
  const canViewReservations = hasCapability(permissionCodes, 'res.reservations.read')
  const canViewAffiliates = hasCapability(permissionCodes, 'adm.affiliates.read')
  const canViewAssemblies = hasCapability(permissionCodes, 'adm.assemblies.read')
  const hasAffiliation = user?.affiliateId != null
  const availableCommunityActions = communityActions.filter((action) => !action.requiresAffiliation || hasAffiliation)
  // Events capability tracked for future dashboard section

  const [summary, setSummary] = useState<InventoryReportSummary | null>(null)
  const [loading, setLoading] = useState(canViewInventory)

  const firstName = user?.fullName?.trim().split(/\s+/)[0]

  useEffect(() => {
    if (!canViewInventory) return
    let active = true
    inventoryReportsService.summary()
      .then((data) => { if (active) setSummary(data) })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false))
    return () => { active = false }
  }, [canViewInventory])

  return (
    <PageContainer className="max-w-[1440px] space-y-10">
      <PageHeader
        title="Dashboard"
        titleClassName="font-sans"
        description={`
          Bienvenido de nuevo${firstName ? `, ${firstName}` : ''}.
          Consulte el resumen general de las áreas disponibles para su trabajo en SGI-Curime.
        `}
      />

      {canViewUsers && <AdminDashboard permissionCodes={user?.permissionCodes} />}

      {canViewInventory && (
        <section aria-labelledby="summary-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 id="summary-title" className="text-xl font-bold text-brand-ink">Resumen de inventario</h2>
              <p className="mt-1 text-sm text-foreground-muted">Datos actuales del módulo de inventario.</p>
            </div>
            <Link to="/inventory" className="hidden items-center gap-1 text-sm font-bold text-brand-primary underline-offset-4 hover:underline sm:flex">Ver detalle <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Cargando resumen">
              <Skeleton className="h-28" /><Skeleton className="h-28" />
              <Skeleton className="h-28" /><Skeleton className="h-28" />
            </div>
          ) : summary ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Artículos activos" value={summary.activeItems} icon={Package} />
              <Metric label="Stock bajo" value={summary.lowStockCount} icon={TriangleAlert} attention={summary.lowStockCount > 0} />
              <Metric label="Artículos agotados" value={summary.outOfStockCount} icon={Boxes} attention={summary.outOfStockCount > 0} />
              <Metric label="Préstamos vencidos" value={summary.overdueLoans} icon={FileClock} attention={summary.overdueLoans > 0} />
            </div>
          ) : (
            <Card><CardContent className="text-sm text-foreground-muted">No hay datos de inventario para mostrar.</CardContent></Card>
          )}
        </section>
      )}

      {canViewFinancialMovements && (
        <section>
          <h2 className="text-xl font-bold text-brand-ink">Movimientos financieros</h2>
          <p className="mt-1 text-sm text-foreground-muted">Registro de movimientos financieros.</p>
          <Link to="/app/financial/movements" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-primary underline-offset-4 hover:underline">
            Ver detalle <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      )}

      {canViewDinadeco && (
        <section>
          <h2 className="text-xl font-bold text-brand-ink">DINADECO</h2>
          <p className="mt-1 text-sm text-foreground-muted">Información DINADECO.</p>
          <Link to="/app/financial/dinadeco" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-primary underline-offset-4 hover:underline">
            Ver detalle <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      )}

      {canViewAuditLogs && (
        <section>
          <h2 className="text-xl font-bold text-brand-ink">Auditoría</h2>
          <p className="mt-1 text-sm text-foreground-muted">Bitácora de auditoría.</p>
        </section>
      )}

      <section aria-labelledby="community-actions-title">
        <h2 id="community-actions-title" className="text-xl font-bold text-brand-ink">¿Qué desea hacer?</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {availableCommunityActions.map((action) => <ActionCard key={action.path} action={action} />)}
        </div>
      </section>

      <section aria-labelledby="community-links-title">
        <h2 id="community-links-title" className="text-xl font-bold text-brand-ink">También puede consultar</h2>
        <nav aria-label="Consultas de la comunidad" className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {communityLinks.map((item) => {
            const Icon = item.icon
            return <Link key={item.path} to={item.path} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-card px-4 font-semibold text-brand-deep hover:border-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"><Icon className="size-4" aria-hidden="true" />{item.label}</Link>
          })}
        </nav>
      </section>

      {canViewReservations && (
        <section>
          <h2 className="text-xl font-bold text-brand-ink">Reservas</h2>
          <p className="mt-1 text-sm text-foreground-muted">Gestión de reservas comunitarias.</p>
          <Link to="/app/reservations" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-primary underline-offset-4 hover:underline">
            Ver reservas <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      )}

      {canViewAffiliates && (
        <section>
          <h2 className="text-xl font-bold text-brand-ink">Afiliados</h2>
          <p className="mt-1 text-sm text-foreground-muted">Gestión de afiliados.</p>
        </section>
      )}

      {canViewAssemblies && (
        <section>
          <h2 className="text-xl font-bold text-brand-ink">Asambleas</h2>
          <p className="mt-1 text-sm text-foreground-muted">Información de asambleas.</p>
        </section>
      )}
    </PageContainer>
  )
}

function ActionCard({ action }: { action: { label: string; description: string; path: string; icon: typeof Package } }) {
  const Icon = action.icon
  return <Link to={action.path} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"><Card className="h-full transition-colors group-hover:border-brand-soft"><CardHeader><div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-brand-soft/25 text-brand-deep"><Icon className="size-5" aria-hidden="true" /></div><CardTitle>{action.label}</CardTitle><CardDescription>{action.description}</CardDescription></CardHeader></Card></Link>
}

function Metric({ label, value, icon: Icon, attention = false }: { label: string; value: number; icon: typeof Package; attention?: boolean }) {
  return <Card size="sm" className={attention ? 'border-warning/60' : ''}><CardHeader className="grid grid-cols-[1fr_auto]"><div><CardDescription>{label}</CardDescription><CardTitle className="mt-2 text-3xl font-bold tabular-nums">{value}</CardTitle></div><div className={`flex size-9 items-center justify-center rounded-lg ${attention ? 'bg-warning-bg text-warning' : 'bg-brand-soft/20 text-brand-deep'}`}><Icon className="size-5" aria-hidden="true" /></div></CardHeader></Card>
}
