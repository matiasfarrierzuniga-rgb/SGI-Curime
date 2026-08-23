import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '@/shared/ui/Pagination'
import { Modal } from '@/shared/ui/Modal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useToast } from '@/shared/ui/Toast'
import { inventoryCategoriesService } from '../../services/inventoryCategoriesService'
import type { InventoryCategory } from '../../types/inventory'
import { getErrorMessage } from '@/shared/lib/errors'

const limit = 10

const emptyForm = { name: '', description: '' }

export function InventoryCategoriesPage() {
  const { notify } = useToast()
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'true' | 'false' | ''>('')
  const [form, setForm] = useState(emptyForm)
  const [mode, setMode] = useState<null | 'create' | 'edit'>(null)
  const [editing, setEditing] = useState<InventoryCategory | null>(null)
  const [confirm, setConfirm] = useState<{ category: InventoryCategory; action: 'activate' | 'deactivate' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const r = await inventoryCategoriesService.list({
        page,
        limit,
        search: search || undefined,
        active: activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined,
      })
      setCategories(r.data)
      setTotal(r.total)
    } catch (e) {
      setError(getErrorMessage(e, 'No fue posible cargar las categorías.'))
    } finally {
      setLoading(false)
    }
  }, [page, search, activeFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setMode('create')
  }

  const openEdit = (category: InventoryCategory) => {
    setEditing(category)
    setForm({ name: category.name, description: category.description ?? '' })
    setMode('edit')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!mode || !form.name.trim()) {
      notify('El nombre de la categoría es obligatorio.', 'error')
      return
    }
    setBusy(true)
    try {
      if (mode === 'create') {
        await inventoryCategoriesService.create({ name: form.name.trim(), description: form.description.trim() || undefined })
        notify('Categoría creada correctamente.', 'success')
      } else if (editing) {
        await inventoryCategoriesService.update(editing.id, { name: form.name.trim(), description: form.description.trim() || undefined })
        notify('Categoría actualizada correctamente.', 'success')
      }
      setMode(null)
      void load()
    } catch (err) {
      notify(getErrorMessage(err, 'No fue posible guardar la categoría.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const runConfirm = async () => {
    if (!confirm) return
    const { category, action } = confirm
    setBusy(true)
    try {
      if (action === 'activate') await inventoryCategoriesService.activate(category.id)
      else await inventoryCategoriesService.deactivate(category.id)
      notify(action === 'activate' ? 'Categoría activada correctamente.' : 'Categoría inactivada correctamente.', 'success')
      setConfirm(null)
      void load()
    } catch (err) {
      notify(getErrorMessage(err, 'No fue posible actualizar el estado de la categoría.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h1>Categorías de inventario</h1>
      <form className="filters card" onSubmit={(e) => { e.preventDefault(); setPage(1); void load() }}>
        <label>Búsqueda por nombre<input maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <label>Estado<select value={activeFilter} onChange={(e) => { setPage(1); setActiveFilter(e.target.value as 'true' | 'false' | '') }}>
          <option value="">Todos</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select></label>
        <div className="actions"><button className="primary">Buscar</button><button type="button" onClick={openCreate}>Nueva categoría</button></div>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      {loading ? (
        <p aria-live="polite">Cargando categorías…</p>
      ) : categories.length === 0 ? (
        <p className="card">No hay categorías que coincidan con los filtros.</p>
      ) : (
        <>
          <div className="table-wrap" tabIndex={0} aria-label="Tabla de categorías, desplazable horizontalmente">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.description || '—'}</td>
                    <td><span className={`badge ${c.isActive ? 'success' : 'neutral'}`}>{c.isActive ? 'Activa' : 'Inactiva'}</span></td>
                    <td>
                      <div className="actions">
                        <button onClick={() => openEdit(c)}>Editar</button>
                        {c.isActive
                          ? <button onClick={() => setConfirm({ category: c, action: 'deactivate' })}>Inactivar</button>
                          : <button onClick={() => setConfirm({ category: c, action: 'activate' })}>Activar</button>}
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
      {mode && (
        <Modal title={mode === 'create' ? 'Nueva categoría' : 'Editar categoría'} onClose={() => setMode(null)} busy={busy}>
          <form className="form-grid" onSubmit={(e) => void submit(e)}>
            <label>Nombre<input maxLength={100} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Descripción<textarea maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="actions"><button className="primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button><button type="button" onClick={() => setMode(null)} disabled={busy}>Cancelar</button></div>
          </form>
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'activate' ? 'Activar categoría' : 'Inactivar categoría'}
          message={confirm.action === 'activate'
            ? `¿Desea activar la categoría «${confirm.category.name}»?`
            : `¿Desea inactivar la categoría «${confirm.category.name}»?`}
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