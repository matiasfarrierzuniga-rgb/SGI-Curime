import { useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '../../components/Pagination'
import { inventoryCategoriesService } from '../../services/inventoryCategoriesService'
import { inventoryReportsService } from '../../services/inventoryReportsService'
import type {
  InventoryItemStatus,
  InventoryLoansReport,
  InventoryMovementReport,
  InventoryMovementType,
  InventoryReportQuery,
  InventoryReportSummary,
  InventoryStockRow,
} from '../../types/inventory'
import { conditionLabels, itemStatusLabels, movementTypeLabels } from '../../types/inventory'
import { getErrorMessage } from '../../utils/errors'

const stockLimit = 20

export function InventoryReportsPage() {
  const [summary, setSummary] = useState<InventoryReportSummary | null>(null)
  const [stock, setStock] = useState<InventoryStockRow[]>([])
  const [stockTotal, setStockTotal] = useState(0)
  const [stockPage, setStockPage] = useState(1)
  const [movements, setMovements] = useState<InventoryMovementReport | null>(null)
  const [loans, setLoans] = useState<InventoryLoansReport | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [form, setForm] = useState({ dateFrom: '', dateTo: '', categoryId: '', status: '', type: '' })
  const [filters, setFilters] = useState<InventoryReportQuery>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const dateFrom = filters.dateFrom ?? null
  const dateTo = filters.dateTo ?? null

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      inventoryReportsService.summary(),
      inventoryReportsService.stock({ ...filters, page: stockPage, limit: stockLimit }),
      inventoryReportsService.movements(filters),
      inventoryReportsService.loans(filters),
    ])
      .then(([s, st, mo, lo]) => {
        setSummary(s)
        setStock(st.data)
        setStockTotal(st.total)
        setMovements(mo)
        setLoans(lo)
      })
      .catch((e) => setError(getErrorMessage(e, 'No fue posible cargar los reportes.')))
      .finally(() => setLoading(false))
  }, [filters, stockPage])

  useEffect(() => {
    let active = true
    inventoryCategoriesService
      .list({ page: 1, limit: 100 })
      .then((r) => {
        if (active) setCategories(r.data)
      })
      .catch(() => {
        /* category filter remains empty */
      })
    return () => {
      active = false
    }
  }, [])

  const applyFilters = (e: FormEvent) => {
    e.preventDefault()
    setStockPage(1)
    setFilters({
      dateFrom: form.dateFrom ? new Date(`${form.dateFrom}T00:00:00`).toISOString() : undefined,
      dateTo: form.dateTo ? new Date(`${form.dateTo}T23:59:59`).toISOString() : undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      status: form.status ? (form.status as InventoryItemStatus) : undefined,
      type: form.type ? (form.type as InventoryMovementType) : undefined,
    })
  }

  const periodLabel = dateFrom || dateTo ? `Periodo: ${dateFrom ? new Date(dateFrom).toLocaleDateString('es-CR') : 'inicio'} — ${dateTo ? new Date(dateTo).toLocaleDateString('es-CR') : 'hoy'}` : 'Sin filtro de fecha'

  return (
    <section>
      <h1>Reportes de inventario</h1>
      <form className="filters card" onSubmit={applyFilters}>
        <label>Desde<input type="date" value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} /></label>
        <label>Hasta<input type="date" value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} /></label>
        <label>Categoría<select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Todas</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
        <label>Estado (stock)<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select></label>
        <label>Tipo (movimientos)<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="">Todos</option>
          <option value="ENTRY">Entrada</option>
          <option value="EXIT">Salida</option>
          <option value="ADJUSTMENT">Ajuste</option>
        </select></label>
        <div className="actions"><button className="primary">Aplicar filtros</button></div>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      {loading ? (
        <p aria-live="polite">Cargando reportes…</p>
      ) : (
        <>
          <section className="card" aria-label="Resumen general">
            <h2>Resumen general</h2>
            <div className="stat-grid">
              <div className="stat-card neutral"><div className="stat-value">{summary?.totalItems ?? 0}</div><div className="stat-label">Artículos</div></div>
              <div className="stat-card success"><div className="stat-value">{summary?.activeItems ?? 0}</div><div className="stat-label">Activos</div></div>
              <div className="stat-card neutral"><div className="stat-value">{summary?.inactiveItems ?? 0}</div><div className="stat-label">Inactivos</div></div>
              <div className="stat-card neutral"><div className="stat-value">{summary?.totalCategories ?? 0}</div><div className="stat-label">Categorías</div></div>
              <div className={`stat-card ${(summary?.lowStockCount ?? 0) > 0 ? 'warning' : 'neutral'}`}><div className="stat-value">{summary?.lowStockCount ?? 0}</div><div className="stat-label">Stock bajo</div></div>
              <div className={`stat-card ${(summary?.outOfStockCount ?? 0) > 0 ? 'danger' : 'neutral'}`}><div className="stat-value">{summary?.outOfStockCount ?? 0}</div><div className="stat-label">Agotados</div></div>
              <div className="stat-card neutral"><div className="stat-value">{summary?.activeLoans ?? 0}</div><div className="stat-label">Préstamos activos</div></div>
              <div className={`stat-card ${(summary?.overdueLoans ?? 0) > 0 ? 'danger' : 'neutral'}`}><div className="stat-value">{summary?.overdueLoans ?? 0}</div><div className="stat-label">Préstamos vencidos</div></div>
            </div>
          </section>

          <section className="card" aria-label="Movimientos por tipo">
            <h2>Movimientos</h2>
            <p className="muted">{periodLabel}</p>
            <div className="report-grid">
              {(['entries', 'exits', 'adjustments'] as const).map((key) => {
                const value = movements?.summary[key]
                return (
                  <div className="stat-card neutral" key={key}>
                    <div className="stat-value">{value?.count ?? 0}</div>
                    <div className="stat-label">{movementTypeLabels[key === 'entries' ? 'ENTRY' : key === 'exits' ? 'EXIT' : 'ADJUSTMENT']} (cantidad: {value?.quantity ?? 0})</div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="card" aria-label="Préstamos por estado">
            <h2>Préstamos</h2>
            <p className="muted">{periodLabel}</p>
            <div className="report-grid">
              <div className="stat-card success"><div className="stat-value">{loans?.summary.active ?? 0}</div><div className="stat-label">Activos</div></div>
              <div className="stat-card neutral"><div className="stat-value">{loans?.summary.returned ?? 0}</div><div className="stat-label">Devueltos</div></div>
              <div className="stat-card neutral"><div className="stat-value">{loans?.summary.cancelled ?? 0}</div><div className="stat-label">Cancelados</div></div>
              <div className={`stat-card ${(loans?.summary.overdue ?? 0) > 0 ? 'danger' : 'neutral'}`}><div className="stat-value">{loans?.summary.overdue ?? 0}</div><div className="stat-label">Vencidos</div></div>
              <div className="stat-card neutral"><div className="stat-value">{loans?.summary.total ?? 0}</div><div className="stat-label">Total</div></div>
            </div>
          </section>

          <section className="card" aria-label="Reporte de stock">
            <h2>Reporte de stock</h2>
            {stock.length === 0 ? (
              <p>No hay artículos para el reporte de stock.</p>
            ) : (
              <>
                <div className="table-wrap" tabIndex={0} aria-label="Tabla de reporte de stock, desplazable horizontalmente">
                  <table>
                    <thead>
                      <tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Existencia</th><th>Mínimo</th><th>Unidad</th><th>Ubicación</th><th>Estado</th><th>Condición</th></tr>
                    </thead>
                    <tbody>
                      {stock.map((row) => (
                        <tr key={row.id}>
                          <td>{row.code}</td>
                          <td>{row.name}</td>
                          <td>{row.category.name}</td>
                          <td>{row.currentQuantity}</td>
                          <td>{row.minimumQuantity}</td>
                          <td>{row.unit}</td>
                          <td>{row.location || '—'}</td>
                          <td><span className={`badge ${row.status === 'ACTIVE' ? 'success' : 'neutral'}`}>{itemStatusLabels[row.status]}</span></td>
                          <td>{conditionLabels[row.condition]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={stockPage} total={stockTotal} limit={stockLimit} onChange={setStockPage} />
              </>
            )}
          </section>
        </>
      )}
    </section>
  )
}