import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inventoryAlertsService } from '../../services/inventoryAlertsService'
import type { InventoryAlerts, InventoryLoanAlert } from '../../types/inventory'
import { conditionLabels } from '../../types/inventory'
import { getErrorMessage } from '@/shared/lib/errors'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { InventoryPageLayout } from './InventoryPageLayout'

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CR')

function LoanAlertRow({ alert }: { alert: InventoryLoanAlert }) {
  return (
    <div className="alert-item">
      <div className="alert-main">
        <strong>{alert.borrowerName}</strong>
        <span className="muted">Artículo: {alert.item.name} ({alert.item.code}) · Cantidad: {alert.quantity} {alert.item.unit} · Devuelve el {formatDate(alert.expectedReturnDate)}</span>
      </div>
      <div className="alert-actions">
        <Link className="button-link" to={`/inventory/loans?highlight=${alert.id}`}>Ver préstamo</Link>
      </div>
    </div>
  )
}

export function InventoryAlertsPage() {
  const [data, setData] = useState<InventoryAlerts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    inventoryAlertsService
      .get()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((e) => {
        if (active) setError(getErrorMessage(e, 'No fue posible cargar las alertas.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) return <InventoryPageLayout title="Alertas" description="Señales operativas que requieren seguimiento."><LoadingState label="Cargando alertas…" /></InventoryPageLayout>

  if (!data) {
    return (
      <InventoryPageLayout title="Alertas" description="Señales operativas que requieren seguimiento.">
        <ErrorState message={error || 'No fue posible cargar las alertas.'} />
      </InventoryPageLayout>
    )
  }

  const groups: { key: keyof InventoryAlerts['summary']; title: string; count: number }[] = [
    { key: 'lowStock', title: 'Stock bajo', count: data.summary.lowStock },
    { key: 'outOfStock', title: 'Agotados', count: data.summary.outOfStock },
    { key: 'overdueLoans', title: 'Préstamos vencidos', count: data.summary.overdueLoans },
    { key: 'inactiveItems', title: 'Artículos inactivos', count: data.summary.inactiveItems },
    { key: 'damagedItems', title: 'Artículos dañados', count: data.summary.damagedItems },
  ]

  const isEmpty = groups.every((g) => data.summary[g.key] === 0)

  return (
    <InventoryPageLayout title="Alertas" description="Priorice faltantes, préstamos vencidos y artículos que requieren atención.">
      <div className="space-y-6">
      {error && <ErrorState message={error} />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {groups.map((g) => (
          <MetricCard key={g.key} label={g.title} value={g.count} state={g.count > 0 ? (g.key === 'overdueLoans' || g.key === 'outOfStock' ? 'danger' : 'warning') : 'success'} stateLabel={g.count > 0 ? 'Requiere atención' : 'Sin pendientes'} />
        ))}
      </div>
      {isEmpty ? (
        <EmptyState title="No hay alertas pendientes de atención." description="No hay alertas de inventario que requieran atención." />
      ) : (
        groups.map((g) => {
          if (data.summary[g.key] === 0) return null
          return (
            <Card key={g.key} aria-label={g.title} className="overflow-hidden">
              <CardHeader className="pb-3"><CardTitle className="flex items-center justify-between gap-3">{g.title} <StatusBadge variant="warning">{data.summary[g.key]}</StatusBadge></CardTitle></CardHeader>
              <CardContent className="alert-list pt-0">
                {g.key === 'overdueLoans'
                  ? data.overdueLoans.map((loan) => <LoanAlertRow key={loan.id} alert={loan} />)
                  : data[g.key].map((item) => (
                      <div className="alert-item" key={item.id}>
                        <div className="alert-main">
                          <strong>{item.name} ({item.code})</strong>
                          <span className="muted">
                            Existencia: {item.currentQuantity} {item.unit} · Mínimo: {item.minimumQuantity} {item.unit}
                            {g.key === 'damagedItems' ? ` · Condición: ${conditionLabels[item.condition]}` : ''}
                            {item.location ? ` · Ubicación: ${item.location}` : ''}
                          </span>
                        </div>
                        <div className="alert-actions">
                          <Link className="button-link" to={`/inventory/items?highlight=${item.id}`}>Ver artículo</Link>
                        </div>
                      </div>
                    ))}
              </CardContent>
            </Card>
          )
        })
      )}
      </div>
    </InventoryPageLayout>
  )
}
