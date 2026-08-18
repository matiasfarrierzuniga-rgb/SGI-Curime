import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { inventoryAlertsService } from '../../services/inventoryAlertsService'
import type { InventoryAlerts, InventoryLoanAlert } from '../../types/inventory'
import { conditionLabels } from '../../types/inventory'
import { getErrorMessage } from '../../utils/errors'

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

  if (loading) return <section><h1>Alertas</h1><p aria-live="polite">Cargando alertas…</p></section>

  if (!data) {
    return (
      <section>
        <h1>Alertas</h1>
        {error && <p className="message error" role="alert">{error}</p>}
      </section>
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
    <section>
      <h1>Alertas de inventario</h1>
      {error && <p className="message error" role="alert">{error}</p>}
      <div className="stat-grid">
        {groups.map((g) => (
          <div className={`stat-card ${g.count > 0 ? (g.key === 'overdueLoans' || g.key === 'outOfStock' ? 'danger' : 'warning') : 'success'}`} key={g.key}>
            <div className="stat-value">{g.count}</div>
            <div className="stat-label">{g.title}</div>
          </div>
        ))}
      </div>
      {isEmpty ? (
        <p className="card">No hay alertas pendientes de atención.</p>
      ) : (
        groups.map((g) => {
          if (data.summary[g.key] === 0) return null
          return (
            <section className="alert-group" key={g.key} aria-label={g.title}>
              <h2>{g.title} <span className="badge warning">{data.summary[g.key]}</span></h2>
              <div className="alert-list">
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
              </div>
            </section>
          )
        })
      )}
    </section>
  )
}