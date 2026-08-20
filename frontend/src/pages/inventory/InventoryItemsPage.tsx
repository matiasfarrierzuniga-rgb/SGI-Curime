import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '../../components/Pagination'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { inventoryCategoriesService } from '../../services/inventoryCategoriesService'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import type {
  InventoryCategory,
  InventoryItem,
  InventoryItemCondition,
  InventoryItemStatus,
  InventoryMovement,
} from '../../types/inventory'
import { conditionLabels, itemStatusLabels, movementTypeLabels } from '../../types/inventory'
import { getErrorMessage, isConflictWithMessage } from '../../utils/errors'

const limit = 10

const emptyItemForm = {
  code: '',
  name: '',
  description: '',
  categoryId: '',
  minimumQuantity: '0',
  unit: 'unidad',
  location: '',
  condition: 'GOOD' as InventoryItemCondition,
}

const emptyMovementForm = { quantity: '', reason: '', reference: '', notes: '' }
const emptyAdjustmentForm = { newQuantity: '', reason: '', notes: '' }

type ModalMode = null | 'detail' | 'create' | 'edit' | 'entry' | 'exit' | 'adjustment' | 'movements'

export function InventoryItemsPage() {
  const { notify } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | InventoryItemStatus>('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [mode, setMode] = useState<ModalMode>(null)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [movementForm, setMovementForm] = useState(emptyMovementForm)
  const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm)
  const [itemMovements, setItemMovements] = useState<InventoryMovement[]>([])
  const [movementPage, setMovementPage] = useState(1)
  const [movementTotal, setMovementTotal] = useState(0)
  const [confirm, setConfirm] = useState<{ item: InventoryItem; action: 'activate' | 'deactivate' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [movementBusy, setMovementBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const r = await inventoryItemsService.list({
        page,
        limit,
        search: search || undefined,
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        status: statusFilter || undefined,
        lowStock: lowStockFilter || undefined,
      })
      setItems(r.data)
      setTotal(r.total)
    } catch (e) {
      setError(getErrorMessage(e, 'No fue posible cargar los artículos.'))
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter, statusFilter, lowStockFilter])

  const loadCategories = useCallback(async () => {
    try {
      const r = await inventoryCategoriesService.list({ page: 1, limit: 100, active: true })
      setCategories(r.data)
    } catch (e) {
      notify(getErrorMessage(e, 'No fue posible cargar las categorías.'), 'error')
    }
  }, [notify])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const applyFilters = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    void load()
  }

  const openDetail = async (id: number) => {
    setBusy(true)
    try {
      const item = await inventoryItemsService.get(id)
      setSelected(item)
      setMode('detail')
    } catch (e) {
      notify(getErrorMessage(e, 'No fue posible cargar el artículo.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const openCreate = () => {
    setItemForm(emptyItemForm)
    setMode('create')
  }

  const openEdit = (item: InventoryItem) => {
    setSelected(item)
    setItemForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      categoryId: String(item.categoryId),
      minimumQuantity: String(item.minimumQuantity),
      unit: item.unit,
      location: item.location ?? '',
      condition: item.condition,
    })
    setMode('edit')
  }

  const openMovement = (kind: 'entry' | 'exit' | 'adjustment') => {
    setMovementForm(emptyMovementForm)
    setAdjustmentForm(emptyAdjustmentForm)
    setMode(kind)
  }

  const loadItemMovements = useCallback(async (itemId: number, pageNumber: number) => {
    setMovementBusy(true)
    try {
      const r = await inventoryItemsService.itemMovements(itemId, { page: pageNumber, limit: 20 })
      setItemMovements(r.data)
      setMovementTotal(r.total)
    } catch (e) {
      notify(getErrorMessage(e, 'No fue posible cargar los movimientos del artículo.'), 'error')
    } finally {
      setMovementBusy(false)
    }
  }, [notify])

  const openMovements = async (item: InventoryItem) => {
    setSelected(item)
    setMovementPage(1)
    setMode('movements')
    await loadItemMovements(item.id, 1)
  }

  const refreshSelected = async () => {
    if (!selected) return
    try {
      const fresh = await inventoryItemsService.get(selected.id)
      setSelected(fresh)
      setItems((prev) => prev.map((i) => (i.id === fresh.id ? fresh : i)))
    } catch {
      /* the next list reload will surface errors */
    }
  }

  const submitItem = async (e: FormEvent) => {
    e.preventDefault()
    const categoryId = Number(itemForm.categoryId)
    if (!itemForm.code.trim() || !itemForm.name.trim() || !itemForm.categoryId) {
      notify('Código, nombre y categoría son obligatorios.', 'error')
      return
    }
    setBusy(true)
    try {
      const payload = {
        code: itemForm.code.trim(),
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || undefined,
        categoryId,
        minimumQuantity: itemForm.minimumQuantity === '' ? undefined : Math.max(0, Number(itemForm.minimumQuantity)),
        unit: itemForm.unit.trim() || undefined,
        location: itemForm.location.trim() || undefined,
        condition: itemForm.condition,
      }
      if (mode === 'create') {
        await inventoryItemsService.create(payload)
        notify('Artículo creado correctamente.', 'success')
      } else if (mode === 'edit' && selected) {
        await inventoryItemsService.update(selected.id, payload)
        notify('Artículo actualizado correctamente.', 'success')
      }
      setMode(null)
      await refreshSelected()
      await load()
    } catch (err) {
      notify(getErrorMessage(err, 'No fue posible guardar el artículo.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitMovement = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected || (mode !== 'entry' && mode !== 'exit')) return
    const quantity = Number(movementForm.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) {
      notify('La cantidad debe ser un número entero mayor a cero.', 'error')
      return
    }
    if (!movementForm.reason.trim()) {
      notify('El motivo es obligatorio.', 'error')
      return
    }
    setBusy(true)
    try {
      const payload = {
        quantity,
        reason: movementForm.reason.trim(),
        reference: movementForm.reference.trim() || undefined,
        notes: movementForm.notes.trim() || undefined,
      }
      if (mode === 'entry') await inventoryItemsService.entry(selected.id, payload)
      else await inventoryItemsService.exit(selected.id, payload)
      notify(mode === 'entry' ? 'Entrada registrada correctamente.' : 'Salida registrada correctamente.', 'success')
      setMode(null)
      await refreshSelected()
      await load()
    } catch (err) {
      if (isConflictWithMessage(err, 'Insufficient stock')) {
        notify('No hay stock suficiente disponible para registrar esta salida.', 'error')
      } else if (isConflictWithMessage(err, 'Inventory item is inactive')) {
        notify('El artículo está inactivo; no se pueden registrar movimientos.', 'error')
      } else {
        notify(getErrorMessage(err, 'No fue posible registrar el movimiento.'), 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  const submitAdjustment = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected || mode !== 'adjustment') return
    const newQuantity = Number(adjustmentForm.newQuantity)
    if (!Number.isInteger(newQuantity) || newQuantity < 0) {
      notify('La nueva cantidad debe ser un número entero mayor o igual a cero.', 'error')
      return
    }
    if (!adjustmentForm.reason.trim()) {
      notify('El motivo es obligatorio.', 'error')
      return
    }
    setBusy(true)
    try {
      await inventoryItemsService.adjustment(selected.id, {
        newQuantity,
        reason: adjustmentForm.reason.trim(),
        notes: adjustmentForm.notes.trim() || undefined,
      })
      notify('Ajuste registrado correctamente.', 'success')
      setMode(null)
      await refreshSelected()
      await load()
    } catch (err) {
      notify(getErrorMessage(err, 'No fue posible registrar el ajuste.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const runConfirm = async () => {
    if (!confirm) return
    const { item, action } = confirm
    setBusy(true)
    try {
      if (action === 'activate') await inventoryItemsService.activate(item.id)
      else await inventoryItemsService.deactivate(item.id)
      notify(action === 'activate' ? 'Artículo activado correctamente.' : 'Artículo inactivado correctamente.', 'success')
      setConfirm(null)
      await refreshSelected()
      await load()
    } catch (err) {
      notify(getErrorMessage(err, 'No fue posible actualizar el estado del artículo.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const statusTone = (s: InventoryItemStatus) => (s === 'ACTIVE' ? 'success' : 'neutral')
  const quantityTone = (item: InventoryItem) =>
    item.status === 'INACTIVE' || item.currentQuantity === 0 ? 'warning' : item.currentQuantity <= item.minimumQuantity ? 'warning' : 'success'

  return (
    <section>
      <h1>Artículos</h1>
      <form className="filters card" onSubmit={applyFilters}>
        <label>Búsqueda (nombre o código)<input maxLength={200} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <label>Categoría<select value={categoryFilter} onChange={(e) => { setPage(1); setCategoryFilter(e.target.value) }}>
          <option value="">Todas</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
        <label>Estado<select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value as InventoryItemStatus | '') }}>
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select></label>
        <label className="checkbox-inline"><input type="checkbox" checked={lowStockFilter} onChange={(e) => { setPage(1); setLowStockFilter(e.target.checked) }} />Solo stock bajo</label>
        <div className="actions"><button className="primary">Buscar</button><button type="button" onClick={openCreate}>Nuevo artículo</button></div>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      {loading ? (
        <p aria-live="polite">Cargando artículos…</p>
      ) : items.length === 0 ? (
        <p className="card">No hay artículos que coincidan con los filtros.</p>
      ) : (
        <>
          <div className="table-wrap" tabIndex={0} aria-label="Tabla de artículos, desplazable horizontalmente">
            <table>
              <thead>
                <tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Existencia</th><th>Mínimo</th><th>Unidad</th><th>Ubicación</th><th>Estado</th><th>Condición</th><th><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.category.name}</td>
                    <td><span className={`badge ${quantityTone(item)}`}>{item.currentQuantity}</span></td>
                    <td>{item.minimumQuantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.location || '—'}</td>
                    <td><span className={`badge ${statusTone(item.status)}`}>{itemStatusLabels[item.status]}</span></td>
                    <td>{conditionLabels[item.condition]}</td>
                    <td>
                      <div className="actions">
                        <button onClick={() => void openDetail(item.id)}>Ver detalle</button>
                        <button onClick={() => { setSelected(item); openMovement('entry') }}>Entrada</button>
                        <button onClick={() => { setSelected(item); openMovement('exit') }}>Salida</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </>
      )}

      {selected && mode === 'detail' && (
        <Modal title={`Artículo: ${selected.name}`} onClose={() => setMode(null)} busy={busy}>
          <dl className="detail-grid">
            <div><dt>Código</dt><dd>{selected.code}</dd></div>
            <div><dt>Categoría</dt><dd>{selected.category.name}</dd></div>
            <div><dt>Existencia actual</dt><dd>{selected.currentQuantity} {selected.unit}</dd></div>
            <div><dt>Cantidad mínima</dt><dd>{selected.minimumQuantity} {selected.unit}</dd></div>
            <div><dt>Unidad</dt><dd>{selected.unit}</dd></div>
            <div><dt>Ubicación</dt><dd>{selected.location || '—'}</dd></div>
            <div><dt>Estado</dt><dd><span className={`badge ${statusTone(selected.status)}`}>{itemStatusLabels[selected.status]}</span></dd></div>
            <div><dt>Condición</dt><dd>{conditionLabels[selected.condition]}</dd></div>
            <div><dt>Descripción</dt><dd>{selected.description || '—'}</dd></div>
          </dl>
          <div className="actions">
            <button onClick={() => openEdit(selected)}>Editar</button>
            <button onClick={() => openMovement('entry')}>Registrar entrada</button>
            <button onClick={() => openMovement('exit')}>Registrar salida</button>
            <button onClick={() => openMovement('adjustment')}>Realizar ajuste</button>
            <button onClick={() => void openMovements(selected)}>Ver movimientos</button>
            {selected.status === 'ACTIVE'
              ? <button onClick={() => setConfirm({ item: selected, action: 'deactivate' })}>Inactivar</button>
              : <button onClick={() => setConfirm({ item: selected, action: 'activate' })}>Activar</button>}
          </div>
        </Modal>
      )}

      {mode === 'create' || mode === 'edit' ? (
        <Modal title={mode === 'create' ? 'Nuevo artículo' : `Editar artículo: ${selected?.name ?? ''}`} onClose={() => setMode(null)} busy={busy}>
          {categories.length === 0 && <p className="message error" role="alert">No hay categorías activas. Cree una categoría antes de registrar artículos.</p>}
          <form className="form-grid" onSubmit={(e) => void submitItem(e)}>
            <label>Código<input maxLength={100} required value={itemForm.code} onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })} /></label>
            <label>Nombre<input maxLength={200} required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /></label>
            <label>Descripción<textarea maxLength={1000} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} /></label>
            <label>Categoría<select required value={itemForm.categoryId} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}>
              <option value="">Seleccione una categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
            <label>Cantidad mínima<input type="number" min={0} value={itemForm.minimumQuantity} onChange={(e) => setItemForm({ ...itemForm, minimumQuantity: e.target.value })} /></label>
            <label>Unidad<input maxLength={50} value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} /></label>
            <label>Ubicación<input maxLength={200} value={itemForm.location} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} /></label>
            <label>Condición<select value={itemForm.condition} onChange={(e) => setItemForm({ ...itemForm, condition: e.target.value as InventoryItemCondition })}>
              <option value="GOOD">Bueno</option>
              <option value="DAMAGED">Dañado</option>
              <option value="UNDER_REPAIR">En reparación</option>
            </select></label>
            <p className="muted">La existencia inicial se controla mediante entradas, salidas y ajustes.</p>
            <div className="actions"><button className="primary" disabled={busy || categories.length === 0}>{busy ? 'Guardando…' : 'Guardar'}</button><button type="button" onClick={() => setMode(null)} disabled={busy}>Cancelar</button></div>
          </form>
        </Modal>
      ) : null}

      {(mode === 'entry' || mode === 'exit') && selected ? (
        <Modal title={mode === 'entry' ? `Registrar entrada: ${selected.name}` : `Registrar salida: ${selected.name}`} onClose={() => setMode(null)} busy={busy}>
          {mode === 'exit' && (
            <p className="muted">Existencia actual: {selected.currentQuantity} {selected.unit}. No se puede superar la existencia disponible.</p>
          )}
          <form className="form-grid" onSubmit={(e) => void submitMovement(e)}>
            <label>Cantidad<input type="number" min={1} step={1} required value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} /></label>
            <label>Motivo<input maxLength={500} required value={movementForm.reason} onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })} /></label>
            <label>Referencia (opcional)<input maxLength={200} value={movementForm.reference} onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })} /></label>
            <label>Notas (opcionales)<textarea maxLength={1000} value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} /></label>
            <div className="actions"><button className="primary" disabled={busy}>{busy ? 'Registrando…' : 'Registrar'}</button><button type="button" onClick={() => setMode(null)} disabled={busy}>Cancelar</button></div>
          </form>
        </Modal>
      ) : null}

      {mode === 'adjustment' && selected ? (
        <Modal title={`Ajuste de inventario: ${selected.name}`} onClose={() => setMode(null)} busy={busy}>
          <p className="muted">Existencia actual: {selected.currentQuantity} {selected.unit}. Indique la nueva cantidad total.</p>
          <form className="form-grid" onSubmit={(e) => void submitAdjustment(e)}>
            <label>Nueva cantidad<input type="number" min={0} step={1} required value={adjustmentForm.newQuantity} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, newQuantity: e.target.value })} /></label>
            <label>Motivo<input maxLength={500} required value={adjustmentForm.reason} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} /></label>
            <label>Notas (opcionales)<textarea maxLength={1000} value={adjustmentForm.notes} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })} /></label>
            <div className="actions"><button className="primary" disabled={busy}>{busy ? 'Ajustando…' : 'Ajustar'}</button><button type="button" onClick={() => setMode(null)} disabled={busy}>Cancelar</button></div>
          </form>
        </Modal>
      ) : null}

      {mode === 'movements' && selected ? (
        <Modal title={`Movimientos de: ${selected.name}`} onClose={() => setMode(null)} busy={movementBusy}>
          {movementBusy ? (
            <p aria-live="polite">Cargando movimientos…</p>
          ) : itemMovements.length === 0 ? (
            <p>Este artículo no tiene movimientos registrados.</p>
          ) : (
            <>
              <div className="table-wrap" tabIndex={0} aria-label="Tabla de movimientos del artículo, desplazable horizontalmente">
                <table>
                  <thead>
                    <tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th><th>Referencia</th><th>Registrado por</th></tr>
                  </thead>
                  <tbody>
                    {itemMovements.map((m) => (
                      <tr key={m.id}>
                        <td>{new Date(m.createdAt).toLocaleString('es-CR')}</td>
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
              <Pagination page={movementPage} total={movementTotal} limit={20} onChange={(p) => { setMovementPage(p); void loadItemMovements(selected.id, p) }} />
            </>
          )}
        </Modal>
      ) : null}

      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'activate' ? 'Activar artículo' : 'Inactivar artículo'}
          message={confirm.action === 'activate'
            ? `¿Desea activar el artículo «${confirm.item.name}»?`
            : `¿Desea inactivar el artículo «${confirm.item.name}»?`}
          confirmLabel={confirm.action === 'activate' ? 'Activar' : 'Inactivar'}
          danger={confirm.action === 'deactivate'}
          busy={busy}
          onConfirm={() => void runConfirm()}
          onClose={() => setConfirm(null)}
        />
      )}
    </section>
  )
}