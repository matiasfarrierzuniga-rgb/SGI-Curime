import { useState } from 'react'
import { BriefcaseBusiness, ExternalLink, LayoutGrid, MapPin, Pencil, Phone, Plus, Search, TableProperties, X } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { Select } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useToast } from '@/shared/ui/Toast'
import { useVenture, useVentures } from '../hooks/useVentures'
import type { Venture, VenturePublicationStatus, VentureStatus, VenturesFilters } from '../model/ventures.types'
import { VentureForm } from './VentureForm'

const INITIAL_FILTERS: VenturesFilters = { page: 1, limit: 20 }
const stateLabel = (value: string) => ({ ACTIVE: 'Activo', SUSPENDED: 'Suspendido', CLOSED: 'Cerrado', UNPUBLISHED: 'No publicado', PUBLISHED: 'Publicado' }[value] ?? `Estado desconocido (${value})`)
const stateVariant = (value: string) => value === 'ACTIVE' || value === 'PUBLISHED' ? 'success' : value === 'SUSPENDED' ? 'warning' : value === 'CLOSED' ? 'danger' : 'neutral'
const date = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))

export function VenturesPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<VentureStatus | undefined>()
  const [publicationStatus, setPublicationStatus] = useState<VenturePublicationStatus | undefined>()
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formVenture, setFormVenture] = useState<Venture | undefined>()
  const [creating, setCreating] = useState(false)
  const ventures = useVentures(filters)
  const detail = useVenture(selectedId)
  const mayCreate = hasCapability(user?.permissionCodes, 'ent.ventures.create')
  const mayUpdate = hasCapability(user?.permissionCodes, 'ent.ventures.update')
  const filtersActive = Boolean(filters.search || filters.status || filters.publicationStatus)
  const applyFilters = () => setFilters(current => ({ ...current, search: search.trim() || undefined, status, publicationStatus, page: 1 }))
  const clearFilters = () => { setSearch(''); setStatus(undefined); setPublicationStatus(undefined); setFilters(INITIAL_FILTERS) }
  const changePage = (page: number) => setFilters(current => ({ ...current, page }))
  const closeDetail = () => setSelectedId(null)
  const venturesFound = ventures.data?.total ?? 0

  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title="Directorio de emprendimientos" description="Consulta y gestiona los emprendimientos registrados en la comunidad." actions={mayCreate ? <Button type="button" onClick={() => setCreating(true)}><Plus aria-hidden="true" /> Registrar emprendimiento</Button> : undefined} />

    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] lg:items-end" onSubmit={event => { event.preventDefault(); applyFilters() }}>
          <label className="grid gap-1.5 text-label font-semibold text-foreground"><span>Buscar</span><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre, descripción, oferta o correo" /></label>
          <label className="grid gap-1.5 text-label font-semibold text-foreground">Estado institucional<Select value={status ?? ''} onChange={event => setStatus((event.target.value || undefined) as VentureStatus | undefined)}><option value="">Todos</option><option value="ACTIVE">Activo</option><option value="SUSPENDED">Suspendido</option><option value="CLOSED">Cerrado</option></Select></label>
          <label className="grid gap-1.5 text-label font-semibold text-foreground">Publicación<Select value={publicationStatus ?? ''} onChange={event => setPublicationStatus((event.target.value || undefined) as VenturePublicationStatus | undefined)}><option value="">Todas</option><option value="UNPUBLISHED">No publicado</option><option value="PUBLISHED">Publicado</option></Select></label>
          <div className="flex gap-2"><Button className="flex-1 lg:flex-none" type="submit"><Search aria-hidden="true" /> Buscar</Button>{filtersActive ? <Button type="button" variant="outline" onClick={clearFilters}><X aria-hidden="true" /><span className="sm:hidden">Limpiar</span><span className="hidden sm:inline">Limpiar filtros</span></Button> : null}</div>
        </form>
      </CardContent>
    </Card>

    {ventures.isPending ? <LoadingState label="Cargando emprendimientos..." /> : null}
    {ventures.isError ? <ErrorState title="No fue posible cargar los emprendimientos" message={getErrorMessage(ventures.error)} action={<Button type="button" variant="outline" onClick={() => void ventures.refetch()}>Reintentar</Button>} /> : null}
    {!ventures.isPending && !ventures.isError ? <>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body font-semibold text-text-primary" aria-live="polite">{venturesFound} {venturesFound === 1 ? 'emprendimiento encontrado' : 'emprendimientos encontrados'}</p>
        <div className="hidden items-center rounded-lg border border-border bg-surface-subtle p-1 md:flex" aria-label="Modo de visualización" role="group">
          <Button type="button" size="sm" variant={view === 'cards' ? 'default' : 'ghost'} aria-pressed={view === 'cards'} onClick={() => setView('cards')}><LayoutGrid aria-hidden="true" /> Tarjetas</Button>
          <Button type="button" size="sm" variant={view === 'table' ? 'default' : 'ghost'} aria-pressed={view === 'table'} onClick={() => setView('table')}><TableProperties aria-hidden="true" /> Tabla</Button>
        </div>
      </div>
      {ventures.data.data.length === 0 ? <EmptyState title={filtersActive ? 'No hay resultados para estos filtros' : 'No hay emprendimientos registrados'} description={filtersActive ? 'Pruebe con otros términos o limpie los filtros para volver a ver el directorio.' : mayCreate ? 'Registre el primero cuando cuente con información confirmada.' : 'No existen emprendimientos disponibles para consulta.'} action={filtersActive ? <Button type="button" variant="outline" onClick={clearFilters}><X aria-hidden="true" /> Limpiar filtros</Button> : mayCreate ? <Button type="button" onClick={() => setCreating(true)}><Plus aria-hidden="true" /> Registrar emprendimiento</Button> : undefined} /> : <>
        {view === 'cards' ? <VentureCards ventures={ventures.data.data} onDetail={setSelectedId} /> : null}
        {view === 'table' ? <VentureTable ventures={ventures.data.data} onDetail={setSelectedId} /> : null}
        <div className={view === 'table' ? 'md:hidden' : 'hidden'}><VentureCards ventures={ventures.data.data} onDetail={setSelectedId} /></div>
        <Pagination page={ventures.data.page} total={ventures.data.total} limit={ventures.data.limit} onChange={changePage} />
      </>}
    </> : null}
    {selectedId !== null ? <VentureDetail venture={detail.data} loading={detail.isPending} error={detail.isError ? getErrorMessage(detail.error) : ''} onClose={closeDetail} onEdit={mayUpdate && detail.data ? () => { closeDetail(); setFormVenture(detail.data) } : undefined} /> : null}
    {creating ? <VentureForm onClose={() => setCreating(false)} onSuccess={() => notify('Emprendimiento registrado correctamente.', 'success')} /> : null}
    {formVenture ? <VentureForm venture={formVenture} onClose={() => setFormVenture(undefined)} onSuccess={() => notify('Emprendimiento actualizado correctamente.', 'success')} /> : null}
  </section>
}

function VentureCards({ ventures, onDetail }: { ventures: Venture[]; onDetail: (id: number) => void }) {
  return <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{ventures.map(venture => <Card key={venture.id} className="min-w-0 overflow-hidden"><div className="flex h-20 items-center justify-center border-b border-border bg-surface-subtle text-muted-foreground"><BriefcaseBusiness className="size-7" aria-hidden="true" /><span className="sr-only">Sin imagen disponible</span></div><CardContent className="flex min-h-60 flex-col gap-3 pt-4"><div className="flex flex-wrap gap-2"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></div><div><h2 className="text-heading-3 font-semibold text-text-primary">{venture.name}</h2><p className="mt-1 line-clamp-2 text-body-small text-text-secondary">{venture.offerDescription ?? venture.description ?? 'Sin descripción comercial registrada.'}</p></div><div className="grid gap-1.5 text-body-small text-text-secondary">{venture.locationText ? <p className="flex min-w-0 items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{venture.locationText}</span></p> : null}{venture.businessPhone ? <p className="flex min-w-0 items-center gap-2"><Phone className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{venture.businessPhone}</span></p> : null}</div><Button type="button" variant="outline" className="mt-auto w-full" onClick={() => onDetail(venture.id)}>Ver detalle</Button></CardContent></Card>)}</div>
}

function VentureTable({ ventures, onDetail }: { ventures: Venture[]; onDetail: (id: number) => void }) {
  return <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block"><table className="min-w-[52rem] w-full text-left text-body-small"><thead className="bg-surface-subtle text-text-secondary"><tr><th scope="col" className="p-4 font-semibold">Emprendimiento</th><th scope="col" className="p-4 font-semibold">Estado</th><th scope="col" className="p-4 font-semibold">Publicación</th><th scope="col" className="p-4 font-semibold">Incorporación</th><th scope="col" className="p-4"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{ventures.map(venture => <tr key={venture.id} className="border-t border-border align-middle transition-colors hover:bg-surface-subtle/70"><td className="p-4"><p className="font-semibold text-text-primary">{venture.name}</p><p className="mt-1 max-w-md truncate text-text-secondary">{venture.locationText ?? venture.businessPhone ?? 'Sin información de ubicación o contacto'}</p></td><td className="p-4"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge></td><td className="p-4"><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></td><td className="whitespace-nowrap p-4 text-text-secondary">{date(venture.incorporatedAt)}</td><td className="p-4 text-right"><Button type="button" size="sm" variant="outline" onClick={() => onDetail(venture.id)}>Ver detalle</Button></td></tr>)}</tbody></table></div>
}

function VentureDetail({ venture, loading, error, onClose, onEdit }: { venture?: Venture; loading: boolean; error: string; onClose: () => void; onEdit?: () => void }) {
  return <Modal title="Detalle del emprendimiento" onClose={onClose}>{loading ? <LoadingState label="Cargando detalle..." /> : error ? <ErrorState title="No fue posible cargar el detalle" message={error} /> : venture ? <div className="grid gap-5"><div><div className="flex flex-wrap gap-2"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></div><h2 className="mt-3 text-heading-3 font-semibold text-text-primary">{venture.name}</h2></div><Details venture={venture} /><div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">{onEdit ? <Button type="button" variant="outline" onClick={onEdit}><Pencil aria-hidden="true" /> Editar</Button> : null}<Button type="button" onClick={onClose}>Cerrar</Button></div></div> : null}</Modal>
}

function Details({ venture }: { venture: Venture }) {
  const fields = [['Fecha de incorporación', date(venture.incorporatedAt)], ['Ubicación', venture.locationText], ['Teléfono comercial', venture.businessPhone], ['Correo comercial', venture.businessEmail], ['Descripción', venture.description], ['Oferta comercial', venture.offerDescription]]
  return <dl className="grid gap-4 text-body-small sm:grid-cols-2">{fields.map(([label, value]) => value ? <div key={label} className="grid gap-1"><dt className="font-semibold text-text-secondary">{label}</dt><dd className="whitespace-pre-wrap text-text-primary">{value}</dd></div> : null)}{venture.websiteUrl ? <LinkField label="Sitio web" href={venture.websiteUrl} /> : null}{venture.socialUrl ? <LinkField label="Red social" href={venture.socialUrl} /> : null}</dl>
}
function LinkField({ label, href }: { label: string; href: string }) { return <div className="grid gap-1"><dt className="font-semibold text-text-secondary">{label}</dt><dd><a className="inline-flex items-center gap-1 text-interaction-primary-default underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" href={href} target="_blank" rel="noreferrer"><span className="max-w-56 truncate">{href}</span><ExternalLink className="size-3" aria-hidden="true" /></a></dd></div> }
