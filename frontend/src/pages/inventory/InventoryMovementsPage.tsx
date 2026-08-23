import { useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '@/shared/ui/Pagination'
import { useAuth } from '@/features/auth'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryMovementsService } from '../../services/inventoryMovementsService'
import { usersService } from '../../services/usersService'
import type { InventoryItem, InventoryMovement, InventoryMovementType, InventoryMovementQuery } from '../../types/inventory'
import { movementTypeLabels } from '../../types/inventory'
import { getErrorMessage } from '@/shared/lib/errors'

const limit = 20

export function InventoryMovementsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Administrador'
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [users, setUsers] = useState<{ id: number; fullName: string }[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ itemId: '', type: '', dateFrom: '', dateTo: '', userId: '' })
  const [filters, setFilters] = useState<InventoryMovementQuery>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    inventoryMovementsService
      .list({ ...filters, page, limit })
      .then((r) => {
        if (active) {
          setMovements(r.data)
          setTotal(r.total)
        }
      })
      .catch((e) => {
        if (active) setError(getErrorMessage(e, 'No fue posible cargar los movimientos.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filters, page])

  useEffect(() => {
    let active = true
    inventoryItemsService
      .list({ page: 1, limit: 100 })
      .then((r) => {
        if (active) setItems(r.data)
      })
      .catch(() => {
        /* the filter is optional; items will simply not be selectable */
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    usersService
      .list({ page: 1, limit: 100 })
      .then((r) => {
        if (active) setUsers(r.data)
      })
      .catch(() => {
        /* optional filter; ignored when unavailable */
      })
    return () => {
      active = false
    }
  }, [isAdmin])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    setFilters({
      itemId: form.itemId ? Number(form.itemId) : undefined,
      type: form.type ? (form.type as InventoryMovementType) : undefined,
      userId: form.userId ? Number(form.userId) : undefined,
      dateFrom: form.dateFrom ? new Date(`${form.dateFrom}T00:00:00`).toISOString() : undefined,
      dateTo: form.dateTo ? new Date(`${form.dateTo}T23:59:59`).toISOString() : undefined,
    })
  }

  return (
    <section>
      <h1>Movimientos</h1>
      <p className="muted">Historial inmutable de entradas, salidas y ajustes de inventario.</p>
      <form className="filters card" onSubmit={submit}>
        <label>Artículo<select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
          <option value="">Todos</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
        </select></label>
        <label>Tipo<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="">Todos</option>
          <option value="ENTRY">Entrada</option>
          <option value="EXIT">Salida</option>
          <option value="ADJUSTMENT">Ajuste</option>
        </select></label>
        {isAdmin && (
          <label>Registrado por<select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
            <option value="">Todos</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select></label>
        )}
        <label>Desde<input type="date" value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} /></label>
        <label>Hasta<input type="date" value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} /></label>
        <div className="actions"><button className="primary">Aplicar filtros</button></div>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      {loading ? (
        <p aria-live="polite">Cargando movimientos…</p>
      ) : movements.length === 0 ? (
        <p className="card">No hay movimientos que coincidan con los filtros.</p>
      ) : (
        <>
          <div className="table-wrap" tabIndex={0} aria-label="Tabla de movimientos, desplazable horizontalmente">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Artículo</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th><th>Referencia</th><th>Registrado por</th></tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.createdAt).toLocaleString('es-CR')}</td>
                    <td>{m.item.name}</td>
                    <td><span className="badge">{movementTypeLabels[m.type]}</span></td>
                    <td>{m.type === 'ADJUSTMENT' ? `${m.quantity >= 0 ? '+' : ''}${m.quantity}` : m.quantity}</td>
                    <td>{m.reason}</td>
                    <td>{m.reference || '—'}</td>
                    <td>{m.createdBy?.fullName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </>
      )}
    </section>
  )
}