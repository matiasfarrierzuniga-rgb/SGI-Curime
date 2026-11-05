import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
import { Button } from '@/shared/ui/button'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/features/auth'
import { canManageInventory } from '@/shared/security/roles'
import { Pagination } from '@/shared/ui/Pagination'
import { Modal } from '@/shared/ui/Modal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useToast } from '@/shared/ui/Toast'
import { inventoryCategoriesService } from '../../services/inventoryCategoriesService'
import type { InventoryCategory } from '../../types/inventory'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { AdministrativeListLayout } from '@/shared/ui/AdministrativeListLayout'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SearchFilterBar } from '@/shared/ui/SearchFilterBar'
import { Select } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { InventoryPageContainer } from './InventoryPageLayout'

const limit = 10

const emptyForm = { name: '', description: '' }

export function InventoryCategoriesPage() {
  const { user } = useAuth()
  // UI mirrors legacy endpoint policy; server RolesGuard remains authoritative.
  const mayManageInventory = canManageInventory(user?.role)
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
    <InventoryPageContainer>
      <AdministrativeListLayout
        header={<PageHeader className="gap-4 pb-5" context="Inventario" title="Categorías" description="Organice artículos por categorías activas para una consulta y gestión consistente." />}
        filters={
          <SearchFilterBar
            label="Buscar y filtrar categorías"
            controlsClassName="md:grid-cols-[minmax(0,1fr)_12rem]"
            onSubmit={(e) => { e.preventDefault(); setPage(1); void load() }}
            actions={<><Button type="submit">Buscar</Button>{mayManageInventory ? <Button type="button" variant="outline" onClick={openCreate}>Nueva categoría</Button> : null}</>}
          >
            <FormField id="inventory-category-search" label="Búsqueda por nombre">
              <Input maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} />
            </FormField>
            <FormField id="inventory-category-status" label="Estado">
              <Select value={activeFilter} onChange={(e) => { setPage(1); setActiveFilter(e.target.value as 'true' | 'false' | '') }}>
                <option value="">Todos</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </Select>
            </FormField>
          </SearchFilterBar>
        }
      >
      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label="Cargando categorías…" />
      ) : categories.length === 0 ? (
        <EmptyState title="Sin categorías" description="No hay categorías que coincidan con los filtros." />
      ) : (
        <>
            <DataTable scrollLabel="Tabla de categorías, desplazable horizontalmente">
              <DataTableHeader>
                <DataTableRow><DataTableHead>Nombre</DataTableHead><DataTableHead>Descripción</DataTableHead><DataTableHead>Estado</DataTableHead><DataTableHead><span className="sr-only">Acciones</span></DataTableHead></DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {categories.map((c) => (
                  <DataTableRow key={c.id}>
                    <DataTableCell>{c.name}</DataTableCell>
                    <DataTableCell>{c.description || '—'}</DataTableCell>
                    <DataTableCell><StatusBadge variant={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Activa' : 'Inactiva'}</StatusBadge></DataTableCell>
                    <DataTableCell>
                      {mayManageInventory ? <div className="actions">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(c)}>Editar</Button>
                        {c.isActive
                          ? <Button type="button" variant="danger" size="sm" onClick={() => setConfirm({ category: c, action: 'deactivate' })}>Inactivar</Button>
                          : <Button type="button" size="sm" onClick={() => setConfirm({ category: c, action: 'activate' })}>Activar</Button>}
                      </div> : null}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </>
      )}
      {mode && (
        <Modal title={mode === 'create' ? 'Nueva categoría' : 'Editar categoría'} onClose={() => setMode(null)} busy={busy}>
          <form className="form-grid" onSubmit={(e) => void submit(e)}>
            <label>Nombre<input maxLength={100} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Descripción<textarea maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="actions"><Button type="submit" loading={busy} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button><Button type="button" variant="outline" onClick={() => setMode(null)} disabled={busy}>Cancelar</Button></div>
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
      </AdministrativeListLayout>
    </InventoryPageContainer>
  )
}
