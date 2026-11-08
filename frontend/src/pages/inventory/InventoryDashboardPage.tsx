import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import {
  Activity, ArrowLeftRight, ArrowRight, BarChart3, Boxes, CheckCircle2,
  ChevronRight, ClipboardList, Handshake, Layers3, Package, PackageX,
  Plus, Search, Tags, TriangleAlert,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { buttonVariants } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { inventoryReportsService } from '../../services/inventoryReportsService'
import { inventoryAlertsService } from '../../services/inventoryAlertsService'
import { inventoryItemsService } from '../../services/inventoryItemsService'
import { inventoryMovementsService } from '../../services/inventoryMovementsService'
import { InventoryPageContainer } from './InventoryPageLayout'
import type { InventoryAlerts, InventoryItem, InventoryMovement, InventoryReportSummary, InventoryMovementQuery } from '../../types/inventory'
import { movementTypeLabels } from '../../types/inventory'
import { getErrorMessage } from '@/shared/lib/errors'

const categoryColors = ['#087c52', '#00a47d', '#8ad3b1', '#f0c882', '#be8c4a', '#5b8f82', '#bbadcf']
const DAY_MS = 86_400_000
const PAGE_SIZE = 100
const MAX_PAGES = 100

type DashboardState = {
  summary: InventoryReportSummary | null
  alerts: InventoryAlerts | null
  items: InventoryItem[] | null
  movements: InventoryMovement[] | null
  recent: InventoryMovement[] | null
}
type DashboardErrors = Partial<Record<keyof DashboardState, string>>
const initial: DashboardState = { summary: null, alerts: null, items: null, movements: null, recent: null }

async function allItems(): Promise<InventoryItem[]> {
  const first = await inventoryItemsService.list({ page: 1, limit: PAGE_SIZE })
  if (first.total <= first.data.length) return first.data
  const pages = Math.ceil(first.total / PAGE_SIZE)
  if (pages > MAX_PAGES) throw new Error('El inventario supera el límite de consulta del tablero. Utilice el catálogo completo.')
  const other = await Promise.all(Array.from({ length: pages - 1 }, (_, i) =>
    inventoryItemsService.list({ page: i + 2, limit: PAGE_SIZE })))
  const rows = [first, ...other].flatMap(page => page.data)
  if (rows.length !== first.total) throw new Error('El inventario cambió durante la consulta. Actualice el tablero.')
  return rows
}

async function allMovements(query: InventoryMovementQuery): Promise<InventoryMovement[]> {
  const first = await inventoryMovementsService.list({ ...query, page: 1, limit: PAGE_SIZE })
  if (first.total <= first.data.length) return first.data
  const pages = Math.ceil(first.total / PAGE_SIZE)
  if (pages > MAX_PAGES) throw new Error('Hay demasiados movimientos para graficar este período.')
  const other = await Promise.all(Array.from({ length: pages - 1 }, (_, i) =>
    inventoryMovementsService.list({ ...query, page: i + 2, limit: PAGE_SIZE })))
  const rows = [first, ...other].flatMap(page => page.data)
  if (rows.length !== first.total) throw new Error('Los movimientos cambiaron durante la consulta. Actualice el tablero.')
  return rows
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function toneFor(item: InventoryItem): 'success' | 'danger' | 'warning' | 'neutral' {
  if (item.status === 'INACTIVE') return 'neutral'
  if (item.currentQuantity === 0) return 'danger'
  if (item.currentQuantity <= item.minimumQuantity) return 'warning'
  return 'success'
}

const quickLinks = [
  { label: 'Artículos', caption: 'Gestionar catálogo', to: '/inventory/items', Icon: Package },
  { label: 'Categorías', caption: 'Organizar artículos', to: '/inventory/categories', Icon: Tags },
  { label: 'Movimientos', caption: 'Entradas, salidas y ajustes', to: '/inventory/movements', Icon: ArrowLeftRight },
  { label: 'Préstamos', caption: 'Control de préstamos', to: '/inventory/loans', Icon: Handshake },
  { label: 'Reportes', caption: 'Informes y análisis', to: '/inventory/reports', Icon: BarChart3 },
]

function Panel({ title, icon: Icon, action, children, className = '' }: {
  title: string; icon: typeof Package; action?: ReactNode; children: ReactNode; className?: string
}) {
  return <Card className={`min-w-0 gap-3 bg-erp-surface-raised shadow-sm ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between gap-2">
      <CardTitle className="flex min-w-0 items-center gap-2 text-base">
        <Icon aria-hidden="true" className="size-5 shrink-0 text-[#94652b]" />{title}
      </CardTitle>
      {action}
    </CardHeader>
    <CardContent className="min-w-0">{children}</CardContent>
  </Card>
}

function PanelError({ message }: { message: string }) {
  return <p role="alert" className="rounded-control bg-status-danger-surface p-3 text-sm text-status-danger">{message}</p>
}

export function InventoryDashboardPage() {
  const [data, setData] = useState<DashboardState>(initial)
  const [errors, setErrors] = useState<DashboardErrors>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [alertTab, setAlertTab] = useState<'lowStock' | 'outOfStock'>('lowStock')
  const [trendDays, setTrendDays] = useState(7)

  useEffect(() => {
    let active = true
    const today = startOfDay(new Date())
    const dateFrom = new Date(today.getTime() - 29 * DAY_MS).toISOString()
    const dateTo = new Date(today.getTime() + DAY_MS - 1).toISOString()
    setLoading(true)
    const tasks = {
      summary: inventoryReportsService.summary(),
      alerts: inventoryAlertsService.get(),
      items: allItems(),
      movements: allMovements({ dateFrom, dateTo }),
      recent: inventoryMovementsService.list({ page: 1, limit: 5 }).then(result => result.data),
    }
    Promise.allSettled(Object.values(tasks)).then(results => {
      if (!active) return
      const next: DashboardState = { ...initial }
      const failures: DashboardErrors = {}
      ;(Object.keys(tasks) as (keyof DashboardState)[]).forEach((key, index) => {
        const result = results[index]
        if (result.status === 'rejected') {
          failures[key] = getErrorMessage(result.reason, 'No fue posible cargar esta sección.')
        } else {
          // Independent sections can continue rendering if another endpoint fails.
          ;(next as Record<string, unknown>)[key] = result.value
        }
      })
      setData(next)
      setErrors(failures)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const categories = useMemo(() => {
    if (!data.items) return []
    const counts = new Map<string, number>()
    data.items.forEach(item => counts.set(item.category.name, (counts.get(item.category.name) ?? 0) + 1))
    return [...counts].map(([name, value], index) => ({ name, value, color: categoryColors[index % categoryColors.length] }))
      .sort((a, b) => b.value - a.value)
  }, [data.items])

  const filteredItems = useMemo(() => {
    if (!data.items) return []
    const term = search.trim().toLocaleLowerCase('es')
    return data.items.filter(item =>
      (!term || [item.name, item.code, item.description ?? ''].some(value => value.toLocaleLowerCase('es').includes(term))) &&
      (!category || item.category.name === category) &&
      (!status || (status === 'low' ? item.status === 'ACTIVE' && item.currentQuantity > 0 && item.currentQuantity <= item.minimumQuantity : item.status === status)))
  }, [data.items, search, category, status])

  const trend = useMemo(() => {
    if (!data.movements) return []
    const today = startOfDay(new Date())
    return Array.from({ length: trendDays }, (_, index) => {
      const date = new Date(today.getTime() - (trendDays - 1 - index) * DAY_MS)
      const key = localDayKey(date)
      const moves = data.movements!.filter(m => localDayKey(new Date(m.createdAt)) === key)
      return {
        day: date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' }),
        entradas: moves.filter(m => m.type === 'ENTRY').length,
        salidas: moves.filter(m => m.type === 'EXIT').length,
        ajustes: moves.filter(m => m.type === 'ADJUSTMENT').length,
      }
    })
  }, [data.movements, trendDays])

  const stats = data.summary ? [
    { title: 'Artículos totales', number: data.summary.totalItems, Icon: Package, color: 'border-l-[#087c52]' },
    { title: 'Activos', number: data.summary.activeItems, Icon: CheckCircle2, color: 'border-l-green-600' },
    { title: 'Inactivos', number: data.summary.inactiveItems, Icon: Layers3, color: 'border-l-slate-400' },
    { title: 'Categorías', number: data.summary.totalCategories, Icon: Tags, color: 'border-l-amber-600' },
    { title: 'Stock bajo', number: data.summary.lowStockCount, Icon: TriangleAlert, color: 'border-l-amber-500' },
    { title: 'Agotados', number: data.summary.outOfStockCount, Icon: PackageX, color: 'border-l-red-600' },
    { title: 'Préstamos activos', number: data.summary.activeLoans, Icon: Handshake, color: 'border-l-emerald-600' },
    { title: 'Préstamos vencidos', number: data.summary.overdueLoans, Icon: ClipboardList, color: 'border-l-orange-600' },
  ] : []

  const alertRows = data.alerts?.[alertTab] ?? []

  return <InventoryPageContainer>
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b663e]">Inventario</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-erp-text sm:text-4xl">Panel de Inventario</h1>
          <p className="text-sm text-erp-text-muted">Control de bienes, existencias y préstamos institucionales de la ADI Curime.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Writing actions remain unavailable until the inventory capability contract is approved. */}
          <button type="button" disabled title="Pendiente de habilitación RBAC" className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-control bg-erp-navigation px-4 text-sm font-semibold text-white opacity-60"><Plus className="size-4" />Crear artículo</button>
          <button type="button" disabled title="Pendiente de habilitación RBAC" className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-control border border-erp-border px-3 text-sm font-semibold opacity-60"><Tags className="size-4" />Nueva categoría</button>
          <Link to="/inventory/movements" className={buttonVariants({ variant: 'outline', size: 'sm' })}><ArrowLeftRight className="size-4" />Movimientos</Link>
          <Link to="/inventory/loans" className={buttonVariants({ variant: 'outline', size: 'sm' })}><Handshake className="size-4" />Préstamos</Link>
        </div>
      </div>

      <nav aria-label="Accesos rápidos de inventario" className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {quickLinks.map(({ label, caption, to, Icon }) => <Link key={to} to={to} aria-label={label} className="group flex min-w-0 items-center gap-3 rounded-surface border border-erp-border bg-erp-surface-raised p-3 shadow-sm transition-colors hover:border-[#5caa8e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087c52]">
          <Icon className="size-5 shrink-0 text-[#006348]" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="block truncate text-xs text-erp-text-muted">{caption}</span></span><ChevronRight className="size-4 shrink-0 text-erp-text-muted" aria-hidden="true" />
        </Link>)}
      </nav>

      <section aria-label="Filtros del listado de artículos" className="grid gap-2 rounded-surface border border-erp-border bg-erp-surface-raised p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="relative"><span className="sr-only">Buscar artículo</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-erp-text-muted" aria-hidden="true"/><input className="h-10 w-full rounded-control border border-erp-border bg-transparent pl-9 pr-3 text-sm" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar artículo (código, nombre o descripción)" /></label>
        <label><span className="sr-only">Filtrar por categoría</span><select className="h-10 w-full rounded-control border border-erp-border bg-transparent px-3 text-sm" value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas las categorías</option>{categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label>
        <label><span className="sr-only">Filtrar por estado</span><select className="h-10 w-full rounded-control border border-erp-border bg-transparent px-3 text-sm" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option><option value="low">Stock bajo</option></select></label>
        <button type="button" className="h-10 rounded-control px-3 text-sm font-semibold text-[#006348] hover:bg-[#087c52]/10" onClick={() => { setSearch(''); setCategory(''); setStatus('') }}>Limpiar filtros</button>
      </section>

      {loading ? <LoadingState label="Cargando resumen de inventario…" /> : errors.summary ? <ErrorState message={errors.summary} /> : null}
      {stats.length > 0 && <section aria-label="Indicadores de inventario" className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {stats.map(({ title, number, Icon, color }) => <article key={title} className={`min-w-0 rounded-surface border border-l-4 border-erp-border bg-erp-surface-raised p-3 shadow-sm ${color}`}>
          <div className="flex items-start gap-2"><Icon className="mt-0.5 size-4 shrink-0 text-[#006348]" aria-hidden="true"/><p className="text-xs font-medium leading-tight">{title}</p></div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{number.toLocaleString('es-CR')}</p>
        </article>)}
      </section>}

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel title="Alertas y atención inmediata" icon={TriangleAlert} className="xl:col-span-4"
          action={<Link to="/inventory/alerts" className="text-xs font-semibold text-[#006348] hover:underline">Ver todas</Link>}>
          <div className="mb-3 flex gap-2" role="group" aria-label="Tipo de alerta">
            <button type="button" onClick={() => setAlertTab('lowStock')} aria-pressed={alertTab === 'lowStock'} className={`rounded-control px-3 py-1.5 text-xs font-semibold ${alertTab === 'lowStock' ? 'bg-amber-100 text-amber-950' : 'border border-erp-border'}`}>Stock bajo ({data.alerts?.summary.lowStock ?? '—'})</button>
            <button type="button" onClick={() => setAlertTab('outOfStock')} aria-pressed={alertTab === 'outOfStock'} className={`rounded-control px-3 py-1.5 text-xs font-semibold ${alertTab === 'outOfStock' ? 'bg-red-100 text-red-950' : 'border border-erp-border'}`}>Agotados ({data.alerts?.summary.outOfStock ?? '—'})</button>
          </div>
          {loading ? <p className="text-sm text-erp-text-muted">Cargando alertas…</p> : errors.alerts ? <PanelError message={errors.alerts} /> : alertRows.length === 0 ? <p className="py-5 text-sm text-erp-text-muted">No hay alertas de este tipo.</p> :
          <ul className="divide-y divide-erp-border">{alertRows.slice(0, 4).map(item => <li key={item.id}><Link to={`/inventory/items?highlight=${item.id}`} className="flex items-center gap-2 py-2 hover:text-[#006348]"><Package className="size-4 shrink-0 text-[#8b663e]" aria-hidden="true"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.name}</span><span className="text-xs text-erp-text-muted">{item.code} · Mínimo: {item.minimumQuantity}</span></span><span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950">Stock: {item.currentQuantity}</span><ChevronRight className="size-4 shrink-0" aria-hidden="true"/></Link></li>)}</ul>}
        </Panel>

        <Panel title="Movimientos recientes" icon={ArrowLeftRight} className="xl:col-span-4"
          action={<Link to="/inventory/movements" className="text-xs font-semibold text-[#006348] hover:underline">Ver todos <ArrowRight className="inline size-3" /></Link>}>
          {loading ? <p className="text-sm text-erp-text-muted">Cargando movimientos…</p> : errors.recent ? <PanelError message={errors.recent} /> : data.recent?.length === 0 ? <p className="py-5 text-sm text-erp-text-muted">No hay movimientos registrados.</p> :
            <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-erp-canvas text-erp-text-muted"><th className="p-2">Fecha</th><th className="p-2">Artículo</th><th className="p-2">Tipo</th><th className="p-2 text-right">Cantidad</th></tr></thead><tbody className="divide-y divide-erp-border">{data.recent?.map(m => <tr key={m.id}><td className="whitespace-nowrap p-2">{new Date(m.createdAt).toLocaleDateString('es-CR')}</td><td className="p-2 font-medium">{m.item.name}</td><td className="p-2">{movementTypeLabels[m.type]}</td><td className="p-2 text-right tabular-nums">{m.quantity}</td></tr>)}</tbody></table></div>}
        </Panel>

        <Panel title="Stock por categoría" icon={Boxes} className="xl:col-span-4">
          {loading ? <p className="text-sm text-erp-text-muted">Cargando categorías…</p> : errors.items ? <PanelError message={errors.items} /> : categories.length === 0 ? <p className="py-5 text-sm text-erp-text-muted">No hay artículos para distribuir.</p> :
          <div className="grid items-center gap-2 sm:grid-cols-[minmax(140px,1fr)_minmax(0,1.25fr)]">
            <div className="relative h-44 min-w-0" role="img" aria-label="Distribución de artículos por categoría">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius="57%" outerRadius="86%" stroke="#fff" strokeWidth={1}>{categories.map(c => <Cell key={c.name} fill={c.color}/>)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold tabular-nums">{data.items?.length}</span><span className="text-xs text-erp-text-muted">Artículos</span></div>
            </div>
            <ul className="space-y-2">{categories.map(c => <li key={c.name} className="flex items-center gap-2 text-xs"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }}/><span className="min-w-0 flex-1 truncate" title={c.name}>{c.name}</span><span className="shrink-0 font-semibold tabular-nums">{c.value} ({Math.round(c.value * 100 / (data.items?.length || 1))}%)</span></li>)}</ul>
          </div>}
          <p className="mt-2 text-xs text-erp-text-muted">Distribución de artículos registrados, no de unidades físicas.</p>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <Panel title="Estado del inventario" icon={Package} className="xl:col-span-7"
          action={<Link to="/inventory/items" className="text-xs font-semibold text-[#006348] hover:underline">Ver catálogo completo <ArrowRight className="inline size-3"/></Link>}>
          {loading ? <p className="text-sm text-erp-text-muted">Cargando artículos…</p> : errors.items ? <PanelError message={errors.items} /> : filteredItems.length === 0 ? <p className="py-5 text-sm text-erp-text-muted">No se encontraron artículos.</p> :
          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-erp-canvas text-erp-text-muted"><th className="p-2">Artículo</th><th className="p-2">Categoría</th><th className="p-2 text-right">Stock</th><th className="p-2 text-right">Mínimo</th><th className="p-2">Estado</th><th className="p-2">Detalle</th></tr></thead><tbody className="divide-y divide-erp-border">{filteredItems.slice(0, 6).map(item => <tr key={item.id}><td className="p-2"><span className="block font-semibold">{item.name}</span><span className="text-erp-text-muted">{item.code}</span></td><td className="p-2">{item.category.name}</td><td className="p-2 text-right font-semibold tabular-nums">{item.currentQuantity}</td><td className="p-2 text-right tabular-nums">{item.minimumQuantity}</td><td className="p-2"><StatusBadge variant={toneFor(item)}>{item.status === 'INACTIVE' ? 'Inactivo' : item.currentQuantity === 0 ? 'Agotado' : item.currentQuantity <= item.minimumQuantity ? 'Stock bajo' : 'Activo'}</StatusBadge></td><td className="p-2"><Link aria-label={`Ver artículo ${item.name}`} to={`/inventory/items?highlight=${item.id}`} className="text-[#006348] underline-offset-2 hover:underline">Ver</Link></td></tr>)}</tbody></table></div>}
        </Panel>

        <Panel title="Tendencia de movimientos" icon={Activity} className="xl:col-span-5"
          action={<label className="flex items-center gap-1 text-xs"><span className="sr-only">Período de tendencia</span><select className="rounded-control border border-erp-border bg-transparent px-2 py-1 text-xs" value={trendDays} onChange={e => setTrendDays(Number(e.target.value))}><option value={7}>Últimos 7 días</option><option value={14}>Últimos 14 días</option><option value={30}>Últimos 30 días</option></select></label>}>
          {loading ? <p className="text-sm text-erp-text-muted">Cargando tendencia…</p> : errors.movements ? <PanelError message={errors.movements} /> : !data.movements ? <p className="text-sm text-erp-text-muted">Sin datos disponibles.</p> :
          <div className="h-64 w-full" role="img" aria-label="Tendencia diaria de cantidad de movimientos de entrada, salida y ajuste">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ left: -18, right: 8, top: 8, bottom: 3 }}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" tick={{fontSize: 10}}/><YAxis allowDecimals={false} tick={{fontSize: 10}}/><Tooltip/><Legend wrapperStyle={{fontSize: 11}}/><Line type="monotone" dataKey="entradas" name="Entradas" stroke="#07824f" strokeWidth={2} dot={{r: 2}}/><Line type="monotone" dataKey="salidas" name="Salidas" stroke="#e33c47" strokeWidth={2} dot={{r: 2}}/><Line type="monotone" dataKey="ajustes" name="Ajustes" stroke="#9a61df" strokeWidth={2} dot={{r: 2}}/></LineChart></ResponsiveContainer>
          </div>}
          <p className="mt-2 text-xs text-erp-text-muted">Número de operaciones por día, basado en movimientos registrados.</p>
        </Panel>
      </div>
    </div>
  </InventoryPageContainer>
}
