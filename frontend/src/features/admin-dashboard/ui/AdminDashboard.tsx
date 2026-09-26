import { AlertTriangle, Boxes, CalendarCheck, CircleDollarSign, FileClock, FileText, HandCoins, PackageX, RefreshCw, Users } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { Skeleton } from '@/shared/ui/skeleton'
import type { AdminDashboardData } from '../model/adminDashboard.types'
import { useAdminDashboard } from '../hooks/useAdminDashboard'

const currencyFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 2,
})

export function AdminDashboard() {
  const dashboard = useAdminDashboard()

  if (dashboard.isPending) {
    return (
      <section aria-labelledby="admin-indicators-title" aria-busy="true">
        <SectionHeading />
        <div className="mt-6 space-y-6" aria-label="Cargando indicadores administrativos">
          <SkeletonGroup titleWidth="w-44" metrics={3} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)]">
            <SkeletonGroup titleWidth="w-36" metrics={4} />
            <SkeletonGroup titleWidth="w-48" metrics={3} />
          </div>
        </div>
      </section>
    )
  }

  if (dashboard.isError) {
    return (
      <section aria-labelledby="admin-indicators-title">
        <SectionHeading />
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
      <section aria-labelledby="admin-indicators-title">
        <SectionHeading />
        <EmptyState
          className="mt-6"
          title="Aún no hay datos administrativos para mostrar."
          description="Los indicadores aparecerán cuando los módulos registren información."
        />
      </section>
    )
  }

  return (
    <section aria-labelledby="admin-indicators-title">
      <SectionHeading generatedAt={metadata.generatedAt} />
      <div className="mt-6 space-y-8">
        <section aria-labelledby="admin-queue-title">
          <GroupHeading id="admin-queue-title" title="Cola operativa" description="Solicitudes que requieren seguimiento administrativo." />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Solicitudes pendientes" value={data.affiliateRequests.pending} icon={Users} />
            <Metric label="Justificaciones pendientes" value={data.justifications.pending} icon={FileText} />
            <Metric label="Reservas pendientes" value={data.reservations.pending} icon={CalendarCheck} />
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,1fr)] xl:items-start">
          <section aria-labelledby="admin-snapshot-title">
            <GroupHeading id="admin-snapshot-title" title="Panorama institucional" description="Totales y actividad registrada en los módulos institucionales." />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Afiliados" value={data.affiliates.total} icon={Users} />
              <Metric label="Afiliados activos" value={data.affiliates.active} />
              <Metric label="Afiliados inactivos" value={data.affiliates.inactive} />
              <Metric label="Reservas totales" value={data.reservations.total} icon={CalendarCheck} />
              <Metric label="Reservas aprobadas" value={data.reservations.approved} />
              <Metric label="Reservas confirmadas" value={data.reservations.confirmed} />
              <Metric label="Artículos de inventario" value={data.inventory.totalItems} icon={Boxes} />
              <Metric label="Préstamos activos" value={data.inventory.activeLoans} />
              <Metric label="Asambleas programadas" value={data.assemblies.scheduled} />
              <Metric label="Asambleas en progreso" value={data.assemblies.in_progress} />
              <Metric label="Asambleas completadas" value={data.assemblies.completed} />
              <Metric label="Donaciones registradas" value={data.donations.total} icon={HandCoins} />
              <Metric label="Donaciones confirmadas" value={data.donations.confirmed} />
            </div>
          </section>

          <section aria-labelledby="admin-risks-title">
            <GroupHeading id="admin-risks-title" title="Atención requerida" description="Riesgos operativos que necesitan revisión." />
            <div className="mt-4 space-y-3">
              {data.inventory.outOfStockItems > 0 && <Metric label="Artículos agotados" value={data.inventory.outOfStockItems} icon={PackageX} state="danger" stateLabel="Sin existencias" />}
              {data.inventory.overdueLoans > 0 && <Metric label="Préstamos vencidos" value={data.inventory.overdueLoans} icon={FileClock} state="danger" stateLabel="Préstamo vencido" />}
              {data.inventory.lowStockItems > 0 && <Metric label="Artículos con stock bajo" value={data.inventory.lowStockItems} icon={AlertTriangle} state="warning" stateLabel="Stock bajo" />}
              {data.inventory.lowStockItems === 0 && data.inventory.outOfStockItems === 0 && data.inventory.overdueLoans === 0 && <p className="rounded-surface border border-status-success-border bg-status-success-surface p-4 text-body-small text-status-success-foreground">No hay alertas de inventario ni préstamos vencidos.</p>}
            </div>
          </section>
        </div>

        <section aria-labelledby="admin-financial-title">
          <GroupHeading id="admin-financial-title" title="Resumen financiero acumulado" description="Movimientos financieros de todo el historial, sin filtro de fecha. Las donaciones ya incluidas como ingresos no se suman nuevamente." />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Ingresos" value={formatCurrency(data.financial.totalIncome, data.financial.currency)} icon={CircleDollarSign} />
            <Metric label="Egresos" value={formatCurrency(data.financial.totalExpenses, data.financial.currency)} />
            <Metric label="Balance" value={formatCurrency(data.financial.balance, data.financial.currency)} />
          </div>
        </section>
      </div>
    </section>
  )
}

function SectionHeading({ generatedAt }: { generatedAt?: string }) {
  return <div><h2 id="admin-indicators-title" className="text-heading-2 font-bold text-brand-ink">Indicadores administrativos</h2><p className="mt-1 text-sm text-foreground-muted">Vista consolidada de la información registrada en SGI-Curime.{generatedAt ? ` Actualizada ${new Date(generatedAt).toLocaleString('es-CR')}.` : ''}</p></div>
}

function GroupHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div><h3 id={id} className="text-heading-3 font-semibold text-brand-ink">{title}</h3><p className="mt-1 text-body-small text-foreground-muted">{description}</p></div>
}

function SkeletonGroup({ titleWidth, metrics }: { titleWidth: string; metrics: number }) {
  return <div><Skeleton className={`h-6 ${titleWidth}`} /><Skeleton className="mt-2 h-4 w-64 max-w-full" /><div className="mt-4 grid gap-3 sm:grid-cols-3">{Array.from({ length: metrics }, (_, index) => <Skeleton key={index} className="h-30" />)}</div></div>
}

function Metric({ label, value, icon: Icon, state, stateLabel }: { label: string; value: string | number; icon?: typeof Users; state?: 'warning' | 'danger'; stateLabel?: string }) {
  const metricValue = typeof value === 'number' ? value.toLocaleString('es-CR') : value
  const icon = Icon ? <Icon className="size-5" /> : undefined
  return state ? <MetricCard label={label} value={metricValue} icon={icon} state={state} stateLabel={stateLabel ?? ''} /> : <MetricCard label={label} value={metricValue} icon={icon} />
}

function hasData(data: AdminDashboardData) {
  return data.affiliates.total > 0 || data.affiliateRequests.pending > 0 || data.reservations.total > 0 || data.donations.total > 0 || data.inventory.totalItems > 0 || data.assemblies.total > 0 || data.justifications.pending > 0 || Number(data.financial.totalIncome) !== 0 || Number(data.financial.totalExpenses) !== 0
}

function formatCurrency(value: string, currency: string) {
  return currency === 'CRC' ? currencyFormatter.format(Number(value)) : `${currency} ${value}`
}
