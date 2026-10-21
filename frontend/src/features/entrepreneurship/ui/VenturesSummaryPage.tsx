import { useState } from 'react'
import { CheckCircle2, CirclePause, CircleX, Search, Store, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { MetricCard } from '@/shared/ui/MetricCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Select } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useVentures } from '../hooks/useVentures'
import type { VenturePublicationStatus, VentureStatus, VenturesFilters } from '../model/ventures.types'

const SUMMARY_PAGE = { page: 1, limit: 1 } as const
const INITIAL_FILTERS: VenturesFilters = { ...SUMMARY_PAGE }

const statusMetadata: Record<VentureStatus, { label: string; description: string; icon: typeof CheckCircle2; variant: 'success' | 'warning' | 'danger' }> = {
  ACTIVE: { label: 'Activos', description: 'En operación', icon: CheckCircle2, variant: 'success' },
  SUSPENDED: { label: 'Suspendidos', description: 'Suspendidos', icon: CirclePause, variant: 'warning' },
  CLOSED: { label: 'Cerrados', description: 'Cerrados', icon: CircleX, variant: 'danger' },
}

export function VenturesSummaryPage() {
  const [filters, setFilters] = useState<VenturesFilters>(INITIAL_FILTERS)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<VentureStatus | undefined>()
  const [publicationStatus, setPublicationStatus] = useState<VenturePublicationStatus | undefined>()
  const filtered = useVentures(filters)
  const activePublished = useVentures({ ...SUMMARY_PAGE, search: filters.search, status: 'ACTIVE', publicationStatus: 'PUBLISHED' })
  const active = useVentures({ ...SUMMARY_PAGE, search: filters.search, status: 'ACTIVE', publicationStatus: filters.publicationStatus })
  const suspended = useVentures({ ...SUMMARY_PAGE, search: filters.search, status: 'SUSPENDED', publicationStatus: filters.publicationStatus })
  const closed = useVentures({ ...SUMMARY_PAGE, search: filters.search, status: 'CLOSED', publicationStatus: filters.publicationStatus })
  const queries = [filtered, activePublished, active, suspended, closed]
  const filtersActive = Boolean(filters.search || filters.status || filters.publicationStatus)
  const pending = queries.some((query) => query.isPending)
  const failed = queries.find((query) => query.isError)

  const applyFilters = () => setFilters({ ...SUMMARY_PAGE, search: search.trim() || undefined, status, publicationStatus })
  const clearFilters = () => { setSearch(''); setStatus(undefined); setPublicationStatus(undefined); setFilters(INITIAL_FILTERS) }
  const retry = () => queries.forEach((query) => { void query.refetch() })

  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title="Emprendimientos" description="Resumen general de los emprendimientos registrados en la comunidad." actions={<Link to="/app/admin/ventures" className={buttonVariants({ variant: 'outline' })}>Ver directorio</Link>} />

    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] lg:items-end" onSubmit={(event) => { event.preventDefault(); applyFilters() }}>
          <label className="grid gap-1.5 text-label font-semibold text-foreground"><span>Buscar</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, descripción, oferta o correo" /></label>
          <label className="grid gap-1.5 text-label font-semibold text-foreground">Estado institucional<Select value={status ?? ''} onChange={(event) => setStatus((event.target.value || undefined) as VentureStatus | undefined)}><option value="">Todos</option><option value="ACTIVE">Activo</option><option value="SUSPENDED">Suspendido</option><option value="CLOSED">Cerrado</option></Select></label>
          <label className="grid gap-1.5 text-label font-semibold text-foreground">Publicación<Select value={publicationStatus ?? ''} onChange={(event) => setPublicationStatus((event.target.value || undefined) as VenturePublicationStatus | undefined)}><option value="">Todas</option><option value="UNPUBLISHED">No publicado</option><option value="PUBLISHED">Publicado</option></Select></label>
          <div className="flex gap-2"><Button className="flex-1 lg:flex-none" type="submit"><Search aria-hidden="true" /> Buscar</Button>{filtersActive ? <Button type="button" variant="outline" onClick={clearFilters}><X aria-hidden="true" /><span>Limpiar filtros</span></Button> : null}</div>
        </form>
      </CardContent>
    </Card>

    {pending ? <LoadingState label="Cargando resumen de emprendimientos..." /> : null}
    {failed ? <ErrorState title="No fue posible cargar el resumen" message={getErrorMessage(failed.error)} action={<Button type="button" variant="outline" onClick={retry}>Reintentar</Button>} /> : null}
    {!pending && !failed && filtered.data && activePublished.data && active.data && suspended.data && closed.data ? <SummaryContent filtersActive={filtersActive} filteredTotal={filtered.data.total} activePublishedTotal={activePublished.data.total} statusTotals={{ ACTIVE: active.data.total, SUSPENDED: suspended.data.total, CLOSED: closed.data.total }} /> : null}
  </section>
}

function SummaryContent({ filtersActive, filteredTotal, activePublishedTotal, statusTotals }: { filtersActive: boolean; filteredTotal: number; activePublishedTotal: number; statusTotals: Record<VentureStatus, number> }) {
  if (filteredTotal === 0) return <EmptyState title={filtersActive ? 'No hay emprendimientos para estos filtros' : 'No hay emprendimientos registrados'} description={filtersActive ? 'Pruebe con otros filtros o consulte el directorio completo.' : 'El resumen mostrará indicadores cuando existan emprendimientos registrados.'} action={<Link to="/app/admin/ventures" className={buttonVariants({ variant: 'outline' })}>Ir al directorio</Link>} />

  return <>
    <section aria-label="Indicadores de emprendimientos" className="grid gap-4 md:grid-cols-2">
      <MetricCard label="Total de emprendimientos" value={formatCount(filteredTotal)} supportingText="Total según los filtros aplicados." icon={<IconTile icon={Store} />} className="min-h-36 border-l-brand-primary" />
      <MetricCard label="Emprendimientos activos y publicados" value={formatCount(activePublishedTotal)} supportingText="Activos y publicados; limitado por la búsqueda actual." icon={<IconTile icon={CheckCircle2} />} state="success" stateLabel="Visibles en el directorio" className="min-h-36" />
    </section>

    <section aria-labelledby="ventures-status-title">
      <Card className="border-border-default bg-surface-card shadow-none">
        <CardHeader><h2 id="ventures-status-title" className="font-heading text-heading-3 font-semibold text-text-primary">Emprendimientos por estado</h2><CardDescription>Totales de la búsqueda y publicación seleccionadas. No se muestran categorías ni actividad reciente porque el contrato no las proporciona.</CardDescription></CardHeader>
        <CardContent><dl className="grid gap-3 sm:grid-cols-3">{(Object.keys(statusMetadata) as VentureStatus[]).map((status) => <StatusOverview key={status} total={statusTotals[status]} status={status} />)}</dl></CardContent>
      </Card>
    </section>
  </>
}

function StatusOverview({ status, total }: { status: VentureStatus; total: number }) {
  const metadata = statusMetadata[status]
  const Icon = metadata.icon
  return <div className="rounded-surface border border-border-subtle bg-surface-muted p-4"><dt className="flex items-center gap-2 text-label font-semibold text-text-primary"><Icon className="size-4" aria-hidden="true" />{metadata.label}</dt><dd className="mt-3 flex items-end justify-between gap-3"><span className="text-heading-2 font-bold tabular-nums text-text-primary">{formatCount(total)}</span><StatusBadge variant={metadata.variant}>{metadata.description}</StatusBadge></dd></div>
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) { return <span className="flex size-10 items-center justify-center rounded-control border border-border-subtle bg-background-subtle text-foreground-brand"><Icon className="size-5" aria-hidden="true" /></span> }
function formatCount(value: number) { return value.toLocaleString('es-CR') }
