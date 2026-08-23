import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '@/shared/ui/Pagination'
import { Modal } from '@/shared/ui/Modal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useToast } from '@/shared/ui/Toast'
import { useAuth } from '../../auth/AuthContext'
import { affiliatesService } from '../../services/affiliatesService'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryLoansService } from '../../services/inventoryLoansService'
import type { AffiliateOption, InventoryItem, InventoryLoan, InventoryLoanStatus, InventoryLoanQuery } from '../../types/inventory'
import { loanStatusLabels } from '../../types/inventory'
import { getErrorMessage, isConflictWithMessage } from '@/shared/lib/errors'

const limit = 10

const emptyLoanForm = {
  itemId: '',
  quantity: '',
  borrowerName: '',
  affiliateId: '',
  loanDate: '',
  expectedReturnDate: '',
  notes: '',
}

const emptyReturnForm = { returnNotes: '', condition: '' }

export function InventoryLoansPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Administrador'
  const { notify } = useToast()
  const [loans, setLoans] = useState<InventoryLoan[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [affiliates, setAffiliates] = useState<AffiliateOption[]>([])
  const [affiliateSearch, setAffiliateSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ itemId: '', status: '', overdue: false, dateFrom: '', dateTo: '' })
  const [filters, setFilters] = useState<InventoryLoanQuery>({})
  const [selected, setSelected] = useState<InventoryLoan | null>(null)
  const [mode, setMode] = useState<null | 'detail' | 'create' | 'return'>(null)
  const [loanForm, setLoanForm] = useState(emptyLoanForm)
  const [returnForm, setReturnForm] = useState(emptyReturnForm)
  const [confirmCancel, setConfirmCancel] = useState<InventoryLoan | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const r = await inventoryLoansService.list({ ...filters, page, limit })
      setLoans(r.data)
      setTotal(r.total)
    } catch (e) {
      setError(getErrorMessage(e, 'No fue posible cargar los préstamos.'))
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let active = true
    inventoryItemsService
      .list({ page: 1, limit: 100, status: 'ACTIVE' })
      .then((r) => {
        if (active) setItems(r.data)
      })
      .catch(() => {
        /* item selector remains empty; errors surface when creating */
      })
    return () => {
      active = false
    }
  }, [])

  const searchAffiliates = async (e?: FormEvent) => {
    e?.preventDefault()
    setBusy(true)
    try {
      const r = await affiliatesService.list({ search: affiliateSearch.trim() || undefined, page: 1, limit: 20 })
      setAffiliates(r.data)
    } catch (err) {
      notify(getErrorMessage(err, 'No fue posible cargar afiliados.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const openCreate = () => {
    setLoanForm(emptyLoanForm)
    setAffiliates([])
    setAffiliateSearch('')
    setMode('create')
    if (isAdmin) void searchAffiliates()
  }

  const openDetail = async (id: number) => {
    setBusy(true)
    try {
      const loan = await inventoryLoansService.get(id)
      setSelected(loan)
      setMode('detail')
    } catch (e) {
      notify(getErrorMessage(e, 'No fue posible cargar el préstamo.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const openReturn = (loan: InventoryLoan) => {
    setSelected(loan)
    setReturnForm(emptyReturnForm)
    setMode('return')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    setFilters({
      itemId: form.itemId ? Number(form.itemId) : undefined,
      status: form.status ? (form.status as InventoryLoanStatus) : undefined,
      overdue: form.overdue || undefined,
      dateFrom: form.dateFrom ? new Date(`${form.dateFrom}T00:00:00`).toISOString() : undefined,
      dateTo: form.dateTo ? new Date(`${form.dateTo}T23:59:59`).toISOString() : undefined,
    })
  }

  const createLoan = async (e: FormEvent) => {
    e.preventDefault()
    const quantity = Number(loanForm.quantity)
    if (!loanForm.itemId || !Number.isInteger(quantity) || quantity < 1) {
      notify('Seleccione un artículo e indique una cantidad entera mayor a cero.', 'error')
      return
    }
    if (!loanForm.borrowerName.trim()) {
      notify('El nombre del prestatario es obligatorio.', 'error')
      return
    }
    if (!loanForm.expectedReturnDate) {
      notify('La fecha de devolución esperada es obligatoria.', 'error')
      return
    }
    if (loanForm.loanDate && new Date(loanForm.expectedReturnDate) <= new Date(loanForm.loanDate)) {
      notify('La fecha de devolución debe ser posterior a la fecha del préstamo.', 'error')
      return
    }
    setBusy(true)
    try {
      await inventoryLoansService.create({
        itemId: Number(loanForm.itemId),
        quantity,
        borrowerName: loanForm.borrowerName.trim(),
        borrowerAffiliateId: loanForm.affiliateId ? Number(loanForm.affiliateId) : undefined,
        loanDate: loanForm.loanDate ? new Date(`${loanForm.loanDate}T00:00:00`).toISOString() : undefined,
        expectedReturnDate: new Date(`${loanForm.expectedReturnDate}T00:00:00`).toISOString(),
        notes: loanForm.notes.trim() || undefined,
      })
      notify('Préstamo creado correctamente.', 'success')
      setMode(null)
      void load()
    } catch (err) {
      if (isConflictWithMessage(err, 'Insufficient stock')) {
        notify('No hay stock suficiente para el préstamo solicitado.', 'error')
      } else if (isConflictWithMessage(err, 'Inventory item is inactive')) {
        notify('El artículo está inactivo y no puede prestarse.', 'error')
      } else {
        notify(getErrorMessage(err, 'No fue posible crear el préstamo.'), 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  const returnLoan = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setBusy(true)
    try {
      await inventoryLoansService.return(selected.id, {
        returnNotes: returnForm.returnNotes.trim() || undefined,
        condition: returnForm.condition ? (returnForm.condition as 'GOOD' | 'DAMAGED' | 'UNDER_REPAIR') : undefined,
      })
      notify('Préstamo devuelto correctamente.', 'success')
      setMode(null)
      await openDetail(selected.id)
      void load()
    } catch (err) {
      notify(getErrorMessage(err, 'No fue posible devolver el préstamo.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const cancelLoan = async () => {
    if (!confirmCancel) return
    setBusy(true)
    try {
      await inventoryLoansService.cancel(confirmCancel.id)
      notify('Préstamo cancelado correctamente.', 'success')
      setConfirmCancel(null)
      setMode(null)
      setSelected(null)
      void load()
    } catch (err) {
      notify(getErrorMessage(err, 'No fue posible cancelar el préstamo.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const statusTone = (loan: InventoryLoan) =>
    loan.status === 'ACTIVE' ? (loan.isOverdue ? 'danger' : 'success') : loan.status === 'RETURNED' ? 'neutral' : 'warning'

  const formatDate = (value: string) => new Date(value).toLocaleDateString('es-CR')

  return (
    <section>
      <h1>Préstamos</h1>
      <form className="filters card" onSubmit={submit}>
        <label>Artículo<select value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
          <option value="">Todos</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
        </select></label>
        <label>Estado<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="RETURNED">Devuelto</option>
          <option value="CANCELLED">Cancelado</option>
        </select></label>
        <label className="checkbox-inline"><input type="checkbox" checked={form.overdue} onChange={(e) => setForm({ ...form, overdue: e.target.checked })} />Solo vencidos</label>
        <label>Desde<input type="date" value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} /></label>
        <label>Hasta<input type="date" value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} /></label>
        <div className="actions"><button className="primary">Aplicar filtros</button><button type="button" onClick={openCreate}>Nuevo préstamo</button></div>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      {loading ? (
        <p aria-live="polite">Cargando préstamos…</p>
      ) : loans.length === 0 ? (
        <p className="card">No hay préstamos que coincidan con los filtros.</p>
      ) : (
        <>
          <div className="table-wrap" tabIndex={0} aria-label="Tabla de préstamos, desplazable horizontalmente">
            <table>
              <thead>
                <tr><th>Artículo</th><th>Cantidad</th><th>Prestatario</th><th>Fecha de préstamo</th><th>Devolución esperada</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.item.name}</td>
                    <td>{loan.quantity}</td>
                    <td>{loan.affiliate ? `${loan.borrowerName} (afiliado)` : loan.borrowerName}</td>
                    <td>{formatDate(loan.loanDate)}</td>
                    <td>{formatDate(loan.expectedReturnDate)}</td>
                    <td><span className={`badge ${statusTone(loan)}`}>{loanStatusLabels[loan.status]}{loan.isOverdue ? ' · Vencido' : ''}</span></td>
                    <td>
                      <div className="actions">
                        <button onClick={() => void openDetail(loan.id)}>Ver detalle</button>
                        {loan.status === 'ACTIVE' && <button onClick={() => openReturn(loan)}>Devolver</button>}
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

      {mode === 'create' && (
        <Modal title="Nuevo préstamo" onClose={() => setMode(null)} busy={busy}>
          <form className="form-grid" onSubmit={(e) => void createLoan(e)}>
            <label>Artículo<select required value={loanForm.itemId} onChange={(e) => setLoanForm({ ...loanForm, itemId: e.target.value })}>
              <option value="">Seleccione un artículo</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code}) — disponible: {i.currentQuantity} {i.unit}</option>)}
            </select></label>
            <label>Cantidad<input type="number" min={1} step={1} required value={loanForm.quantity} onChange={(e) => setLoanForm({ ...loanForm, quantity: e.target.value })} /></label>
            <label>Nombre del prestatario<input maxLength={200} required value={loanForm.borrowerName} onChange={(e) => setLoanForm({ ...loanForm, borrowerName: e.target.value })} /></label>
            {isAdmin && (
              <fieldset className="card">
                <legend>Asociar afiliado (opcional)</legend>
                <label>Buscar afiliado
                  <div className="filters">
                    <input placeholder="Nombre o cédula" value={affiliateSearch} onChange={(e) => setAffiliateSearch(e.target.value)} />
                    <button type="button" disabled={busy} onClick={() => void searchAffiliates()}>Buscar</button>
                  </div>
                </label>
                <label>Afiliado<select value={loanForm.affiliateId} onChange={(e) => setLoanForm({ ...loanForm, affiliateId: e.target.value })}>
                  <option value="">Sin asociar</option>
                  {affiliates.map((a) => <option key={a.id} value={a.id}>{a.fullName} — {a.identification}</option>)}
                </select></label>
                {affiliates.length === 0 && <p className="mini-table-note">No se encontraron afiliados.</p>}
              </fieldset>
            )}
            <label>Fecha de préstamo (opcional)<input type="date" value={loanForm.loanDate} onChange={(e) => setLoanForm({ ...loanForm, loanDate: e.target.value })} /></label>
            <label>Devolución esperada<input type="date" required value={loanForm.expectedReturnDate} onChange={(e) => setLoanForm({ ...loanForm, expectedReturnDate: e.target.value })} /></label>
            <label>Notas (opcionales)<textarea maxLength={1000} value={loanForm.notes} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} /></label>
            <div className="actions"><button className="primary" disabled={busy}>{busy ? 'Creando…' : 'Crear préstamo'}</button><button type="button" onClick={() => setMode(null)} disabled={busy}>Cancelar</button></div>
          </form>
        </Modal>
      )}

      {selected && mode === 'detail' && (
        <Modal title={`Préstamo #${selected.id}`} onClose={() => setMode(null)} busy={busy}>
          <dl className="detail-grid">
            <div><dt>Artículo</dt><dd>{selected.item.name} ({selected.item.code})</dd></div>
            <div><dt>Cantidad</dt><dd>{selected.quantity}</dd></div>
            <div><dt>Prestatario</dt><dd>{selected.borrowerName}</dd></div>
            <div><dt>Afiliado</dt><dd>{selected.affiliate ? `${selected.affiliate.fullName} — ${selected.affiliate.identification}` : '—'}</dd></div>
            <div><dt>Fecha de préstamo</dt><dd>{formatDate(selected.loanDate)}</dd></div>
            <div><dt>Devolución esperada</dt><dd>{formatDate(selected.expectedReturnDate)}</dd></div>
            <div><dt>Estado</dt><dd><span className={`badge ${statusTone(selected)}`}>{loanStatusLabels[selected.status]}{selected.isOverdue ? ' · Vencido' : ''}</span></dd></div>
            {selected.returnedAt && <div><dt>Devuelto el</dt><dd>{formatDate(selected.returnedAt)}</dd></div>}
            <div><dt>Notas</dt><dd>{selected.notes || '—'}</dd></div>
            <div><dt>Registrado por</dt><dd>{selected.createdBy?.fullName ?? '—'}</dd></div>
            {selected.receivedBy && <div><dt>Recibido por</dt><dd>{selected.receivedBy.fullName}</dd></div>}
          </dl>
          {selected.status === 'ACTIVE' && (
            <div className="actions">
              <button onClick={() => openReturn(selected)}>Devolver</button>
              <button onClick={() => { setConfirmCancel(selected); setMode(null) }}>Cancelar</button>
            </div>
          )}
        </Modal>
      )}

      {selected && mode === 'return' && (
        <Modal title={`Devolver préstamo #${selected.id}`} onClose={() => setMode(null)} busy={busy}>
          <form className="form-grid" onSubmit={(e) => void returnLoan(e)}>
            <label>Notas de devolución (opcionales)<textarea maxLength={1000} value={returnForm.returnNotes} onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })} /></label>
            <label>Condición del artículo al devolver<select value={returnForm.condition} onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}>
              <option value="">Sin cambio</option>
              <option value="GOOD">Bueno</option>
              <option value="DAMAGED">Dañado</option>
              <option value="UNDER_REPAIR">En reparación</option>
            </select></label>
            <div className="actions"><button className="primary" disabled={busy}>{busy ? 'Devolviendo…' : 'Confirmar devolución'}</button><button type="button" onClick={() => setMode(null)} disabled={busy}>Cancelar</button></div>
          </form>
        </Modal>
      )}

      {confirmCancel && (
        <ConfirmDialog
          title="Cancelar préstamo"
          message={`¿Desea cancelar el préstamo #${confirmCancel.id} de «${confirmCancel.item.name}»? La cantidad devuelta regresará al inventario.`}
          confirmLabel="Cancelar préstamo"
          danger
          busy={busy}
          onConfirm={() => void cancelLoan()}
          onClose={() => setConfirmCancel(null)}
        />
      )}
    </section>
  )
}