import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Cargando indicadores administrativos">
          {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-28" />)}
        </div>
      </section>
    )
  }

  if (dashboard.isError) {
    return (
      <section aria-labelledby="admin-indicators-title">
        <SectionHeading />
        <Alert variant="destructive" className="mt-4">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No fue posible cargar los indicadores</AlertTitle>
          <AlertDescription>Intente nuevamente para consultar el estado administrativo actual.</AlertDescription>
          <Button className="mt-3 w-fit" variant="outline" size="sm" onClick={() => void dashboard.refetch()}>
            <RefreshCw aria-hidden="true" /> Reintentar
          </Button>
        </Alert>
      </section>
    )
  }

  const { data, metadata } = dashboard.data
  if (!hasData(data)) {
    return (
      <section aria-labelledby="admin-indicators-title">
        <SectionHeading />
        <Card className="mt-4">
          <CardContent>
            <p className="font-semibold text-brand-ink">Aún no hay datos administrativos para mostrar.</p>
            <p className="mt-1 text-sm text-foreground-muted">Los indicadores aparecerán cuando los módulos registren información.</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section aria-labelledby="admin-indicators-title">
      <SectionHeading generatedAt={metadata.generatedAt} />
      <IndicatorGroup title="Gestión administrativa" indicators={[
        ['Afiliados', data.affiliates.total],
        ['Afiliados activos', data.affiliates.active],
        ['Afiliados inactivos', data.affiliates.inactive],
        ['Solicitudes pendientes', data.affiliateRequests.pending],
        ['Justificaciones pendientes', data.justifications.pending],
      ]} />
      <IndicatorGroup title="Operación" indicators={[
        ['Reservas totales', data.reservations.total],
        ['Reservas pendientes', data.reservations.pending],
        ['Reservas aprobadas', data.reservations.approved],
        ['Reservas confirmadas', data.reservations.confirmed],
        ['Artículos de inventario', data.inventory.totalItems],
        ['Artículos con stock bajo', data.inventory.lowStockItems],
        ['Artículos agotados', data.inventory.outOfStockItems],
        ['Préstamos activos', data.inventory.activeLoans],
        ['Préstamos vencidos', data.inventory.overdueLoans],
      ]} />
      <IndicatorGroup title="Actividad institucional" indicators={[
        ['Asambleas programadas', data.assemblies.scheduled],
        ['Asambleas en progreso', data.assemblies.in_progress],
        ['Asambleas completadas', data.assemblies.completed],
        ['Donaciones registradas', data.donations.total],
        ['Donaciones confirmadas', data.donations.confirmed],
      ]} />
      <div className="mt-6">
        <h3 className="text-heading-3 font-semibold text-brand-ink">Resumen financiero acumulado</h3>
        <p className="mt-1 text-sm text-foreground-muted">Movimientos financieros de todo el historial, sin filtro de fecha. Las donaciones ya incluidas como ingresos no se suman nuevamente.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Ingresos" value={formatCurrency(data.financial.totalIncome, data.financial.currency)} />
          <Metric label="Egresos" value={formatCurrency(data.financial.totalExpenses, data.financial.currency)} />
          <Metric label="Balance" value={formatCurrency(data.financial.balance, data.financial.currency)} />
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ generatedAt }: { generatedAt?: string }) {
  return <div><h2 id="admin-indicators-title" className="text-heading-2 font-bold text-brand-ink">Indicadores administrativos</h2><p className="mt-1 text-sm text-foreground-muted">Vista consolidada de la información registrada en SGI-Curime.{generatedAt ? ` Actualizada ${new Date(generatedAt).toLocaleString('es-CR')}.` : ''}</p></div>
}

function IndicatorGroup({ title, indicators }: { title: string; indicators: ReadonlyArray<readonly [string, number]> }) {
  return <div className="mt-6"><h3 className="text-heading-3 font-semibold text-brand-ink">{title}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{indicators.map(([label, value]) => <Metric key={label} label={label} value={value.toLocaleString('es-CR')} />)}</div></div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card size="sm"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="mt-2 text-2xl font-bold tabular-nums">{value}</CardTitle></CardHeader></Card>
}

function hasData(data: AdminDashboardData) {
  return data.affiliates.total > 0 || data.affiliateRequests.pending > 0 || data.reservations.total > 0 || data.donations.total > 0 || data.inventory.totalItems > 0 || data.assemblies.total > 0 || data.justifications.pending > 0 || Number(data.financial.totalIncome) !== 0 || Number(data.financial.totalExpenses) !== 0
}

function formatCurrency(value: string, currency: string) {
  return currency === 'CRC' ? currencyFormatter.format(Number(value)) : `${currency} ${value}`
}
