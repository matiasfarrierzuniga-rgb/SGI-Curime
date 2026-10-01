import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inventoryReportsService } from '../../services/inventoryReportsService'
import type { InventoryReportSummary } from '../../types/inventory'
import { getErrorMessage } from '@/shared/lib/errors'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { InventoryPageLayout } from './InventoryPageLayout'

const statLabel: Record<string, string> = {
  totalItems: 'Artículos',
  activeItems: 'Activos',
  inactiveItems: 'Inactivos',
  totalCategories: 'Categorías',
  lowStockCount: 'Stock bajo',
  outOfStockCount: 'Agotados',
  activeLoans: 'Préstamos activos',
  overdueLoans: 'Préstamos vencidos',
}

export function InventoryDashboardPage() {
  const [summary, setSummary] = useState<InventoryReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    inventoryReportsService
      .summary()
      .then((data) => {
        if (active) setSummary(data)
      })
      .catch((e) => {
        if (active) setError(getErrorMessage(e, 'No fue posible cargar el resumen de inventario.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const cards = summary
    ? Object.entries(summary).map(([key, value]) => {
        let tone = 'neutral'
        if (key === 'lowStockCount' && value > 0) tone = 'warning'
        if (key === 'outOfStockCount' && value > 0) tone = 'danger'
        if (key === 'overdueLoans' && value > 0) tone = 'danger'
        if (key === 'activeItems' && value > 0) tone = 'success'
        return (
          <MetricCard key={key} label={statLabel[key] ?? key} value={value} state={tone as 'neutral' | 'success' | 'warning' | 'danger'} stateLabel={tone === 'neutral' ? 'Actual' : tone === 'success' ? 'Al día' : 'Requiere atención'} />
        )
      })
    : []

  return (
    <InventoryPageLayout title="Inventario" description="Resumen operativo del módulo de inventario.">
      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label="Cargando resumen de inventario…" />
      ) : !summary ? null : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards}</div>
      )}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3"><CardTitle>Accesos rápidos</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Link className="button-link" to="/inventory/items">Artículos</Link>
          <Link className="button-link" to="/inventory/categories">Categorías</Link>
          <Link className="button-link" to="/inventory/movements">Movimientos</Link>
          <Link className="button-link" to="/inventory/loans">Préstamos</Link>
          <Link className="button-link" to="/inventory/alerts">Alertas</Link>
          <Link className="button-link" to="/inventory/reports">Reportes</Link>
        </CardContent>
      </Card>
    </InventoryPageLayout>
  )
}
