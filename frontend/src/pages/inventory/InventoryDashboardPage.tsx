import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inventoryReportsService } from '../../services/inventoryReportsService'
import type { InventoryReportSummary } from '../../types/inventory'
import { getErrorMessage } from '@/shared/lib/errors'

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
          <div className={`stat-card ${tone}`} key={key}>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{statLabel[key] ?? key}</div>
          </div>
        )
      })
    : []

  return (
    <section>
      <h1>Inventario</h1>
      <p className="muted">Resumen general del módulo de inventario.</p>
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p aria-live="polite">Cargando resumen de inventario…</p>
      ) : !summary ? null : (
        <div className="stat-grid">{cards}</div>
      )}
      <div className="card">
        <h2>Accesos rápidos</h2>
        <div className="quick-links">
          <Link className="button-link" to="/inventory/items">Artículos</Link>
          <Link className="button-link" to="/inventory/categories">Categorías</Link>
          <Link className="button-link" to="/inventory/movements">Movimientos</Link>
          <Link className="button-link" to="/inventory/loans">Préstamos</Link>
          <Link className="button-link" to="/inventory/alerts">Alertas</Link>
          <Link className="button-link" to="/inventory/reports">Reportes</Link>
        </div>
      </div>
    </section>
  )
}