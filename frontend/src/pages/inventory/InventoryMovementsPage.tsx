import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/shared/ui/DataTable'
import { Button } from '@/shared/ui/button'
import { useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '@/shared/ui/Pagination'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryMovementsService } from '../../services/inventoryMovementsService'
import type { InventoryItem, InventoryMovement, InventoryMovementType, InventoryMovementQuery } from '../../types/inventory'
import { movementTypeLabels } from '../../types/inventory'
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

const limit = 20

export function InventoryMovementsPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
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
    <InventoryPageContainer>
      <AdministrativeListLayout
        header={<PageHeader className="gap-4 pb-5" context="Inventario" title="Movimientos" description="Historial inmutable de entradas, salidas y ajustes de inventario." />}
        filters={
          <SearchFilterBar
            label="Filtrar movimientos"
            controlsClassName="md:grid-cols-2 xl:grid-cols-4"
            onSubmit={submit}
            actions={<Button type="submit">Aplicar filtros</Button>}
          >
            <FormField id="inventory-movement-item" label="Artículo">
              <Select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
                <option value="">Todos</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
              </Select>
            </FormField>
            <FormField id="inventory-movement-type" label="Tipo">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="">Todos</option>
                <option value="ENTRY">Entrada</option>
                <option value="EXIT">Salida</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </Select>
            </FormField>
            <FormField id="inventory-movement-date-from" label="Desde">
              <Input type="date" value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} />
            </FormField>
            <FormField id="inventory-movement-date-to" label="Hasta">
              <Input type="date" value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} />
            </FormField>
          </SearchFilterBar>
        }
      >
      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label="Cargando movimientos…" />
      ) : movements.length === 0 ? (
        <EmptyState title="Sin movimientos" description="No hay movimientos que coincidan con los filtros." />
      ) : (
        <>
            <DataTable scrollLabel="Tabla de movimientos, desplazable horizontalmente">
              <DataTableHeader>
                <DataTableRow><DataTableHead>Fecha</DataTableHead><DataTableHead>Artículo</DataTableHead><DataTableHead>Tipo</DataTableHead><DataTableHead>Cantidad</DataTableHead><DataTableHead>Motivo</DataTableHead><DataTableHead>Referencia</DataTableHead><DataTableHead>Registrado por</DataTableHead></DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {movements.map((m) => (
                  <DataTableRow key={m.id}>
                    <DataTableCell>{new Date(m.createdAt).toLocaleString('es-CR')}</DataTableCell>
                    <DataTableCell>{m.item.name}</DataTableCell>
                    <DataTableCell><StatusBadge variant={m.type === 'ENTRY' ? 'success' : m.type === 'EXIT' ? 'warning' : 'info'}>{movementTypeLabels[m.type]}</StatusBadge></DataTableCell>
                    <DataTableCell>{m.type === 'ADJUSTMENT' ? `${m.quantity >= 0 ? '+' : ''}${m.quantity}` : m.quantity}</DataTableCell>
                    <DataTableCell>{m.reason}</DataTableCell>
                    <DataTableCell>{m.reference || '—'}</DataTableCell>
                    <DataTableCell>{m.createdBy?.fullName ?? '—'}</DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </>
      )}
      </AdministrativeListLayout>
    </InventoryPageContainer>
  )
}
