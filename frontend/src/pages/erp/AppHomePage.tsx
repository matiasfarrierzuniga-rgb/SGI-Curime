import { useEffect, useState } from 'react'
import { ArrowRight, Boxes, ClipboardList, FileClock, Package, TriangleAlert, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { hasCapability } from '@/shared/security/access'
import { getRoleName } from '@/shared/security/roles'
import { inventoryReportsService } from '@/services/inventoryReportsService'
import type { InventoryReportSummary } from '@/types/inventory'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

const quickActions = [
  { label: 'Gestionar usuarios', description: 'Consultar y administrar cuentas.', path: '/admin/users', capability: 'usr.users.read', icon: Users },
  { label: 'Revisar solicitudes', description: 'Atender solicitudes de registro.', path: '/admin/user-requests', capability: 'adm.requests.read', icon: ClipboardList },
  { label: 'Abrir inventario', description: 'Ver existencias, préstamos y movimientos.', path: '/inventory', capability: 'inv.inventory.read', icon: Boxes },
  { label: 'Consultar bitácora', description: 'Revisar la actividad registrada.', path: '/admin/audit-logs', capability: 'aud.logs.read', icon: FileClock },
] as const

export function AppHomePage() {
  const { user } = useAuth()
  const roleName = getRoleName(user?.role)
  const canViewInventory = hasCapability(roleName, 'inv.inventory.read')
  const actions = quickActions.filter((action) => hasCapability(roleName, action.capability))
  const [summary, setSummary] = useState<InventoryReportSummary | null>(null)
  const [loading, setLoading] = useState(canViewInventory)
  const [summaryUnavailable, setSummaryUnavailable] = useState(false)

  useEffect(() => {
    if (!canViewInventory) return
    let active = true
    inventoryReportsService.summary()
      .then((data) => { if (active) setSummary(data) })
      .catch(() => { if (active) setSummaryUnavailable(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [canViewInventory])

  const firstName = user?.fullName?.trim().split(/\s+/)[0]

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-primary">Dashboard</p>
          <h1 className="mt-2 font-heading text-heading-1 font-bold text-brand-ink">{firstName ? `Hola, ${firstName}` : 'Área de gestión'}</h1>
          <p className="mt-2 max-w-2xl text-foreground-muted">Resumen de las áreas disponibles para tu trabajo en SGI-Curime.</p>
        </div>
        {roleName && <Badge variant="secondary" className="w-fit">{roleName}</Badge>}
      </header>

      {canViewInventory && (
        <section aria-labelledby="summary-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div><h2 id="summary-title" className="text-xl font-bold text-brand-ink">Resumen de inventario</h2><p className="mt-1 text-sm text-foreground-muted">Datos actuales del módulo de inventario.</p></div>
            <Link to="/inventory" className="hidden items-center gap-1 text-sm font-bold text-brand-primary underline-offset-4 hover:underline sm:flex">Ver detalle <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Cargando resumen"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          ) : summary ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Artículos activos" value={summary.activeItems} icon={Package} />
              <Metric label="Stock bajo" value={summary.lowStockCount} icon={TriangleAlert} attention={summary.lowStockCount > 0} />
              <Metric label="Artículos agotados" value={summary.outOfStockCount} icon={Boxes} attention={summary.outOfStockCount > 0} />
              <Metric label="Préstamos vencidos" value={summary.overdueLoans} icon={FileClock} attention={summary.overdueLoans > 0} />
            </div>
          ) : (
            <Card><CardContent className="text-sm text-foreground-muted">{summaryUnavailable ? 'El resumen no está disponible en este momento. Puede consultar el módulo de Inventario.' : 'No hay datos de inventario para mostrar.'}</CardContent></Card>
          )}
        </section>
      )}

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="text-xl font-bold text-brand-ink">Accesos rápidos</h2>
        <p className="mt-1 text-sm text-foreground-muted">Atajos disponibles según los permisos de tu cuenta.</p>
        {actions.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => {
              const Icon = action.icon
              return <Link key={action.path} to={action.path} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"><Card className="h-full transition-colors group-hover:border-brand-soft"><CardHeader><div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-brand-soft/25 text-brand-deep"><Icon className="size-5" aria-hidden="true" /></div><CardTitle>{action.label}</CardTitle><CardDescription>{action.description}</CardDescription></CardHeader></Card></Link>
            })}
          </div>
        ) : (
          <Card className="mt-4"><CardContent><p className="font-semibold">No hay tareas pendientes disponibles.</p><p className="mt-1 text-sm text-foreground-muted">Utilice Mi perfil para consultar la información de su cuenta.</p></CardContent></Card>
        )}
      </section>
    </div>
  )
}

function Metric({ label, value, icon: Icon, attention = false }: { label: string; value: number; icon: typeof Package; attention?: boolean }) {
  return <Card size="sm" className={attention ? 'border-warning/60' : ''}><CardHeader className="grid grid-cols-[1fr_auto]"><div><CardDescription>{label}</CardDescription><CardTitle className="mt-2 text-3xl font-bold tabular-nums">{value}</CardTitle></div><div className={`flex size-9 items-center justify-center rounded-lg ${attention ? 'bg-warning-bg text-warning' : 'bg-brand-soft/20 text-brand-deep'}`}><Icon className="size-5" aria-hidden="true" /></div></CardHeader></Card>
}
