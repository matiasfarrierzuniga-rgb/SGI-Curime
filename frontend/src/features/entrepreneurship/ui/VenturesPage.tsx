import { useState, type ReactNode } from 'react'
import { ArrowLeft, BriefcaseBusiness, CalendarDays, ExternalLink, Globe2, LayoutGrid, Mail, MapPin, Pencil, Phone, Plus, Search, TableProperties, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'
import { Select } from '@/shared/ui/select'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { useToast } from '@/shared/ui/Toast'
import { useVenture, useVentureMutations, useVentures } from '../hooks/useVentures'
import type { Venture, VenturePublicationStatus, VentureStatus, VenturesFilters } from '../model/ventures.types'
import { VentureForm } from './VentureForm'

const INITIAL_FILTERS: VenturesFilters = { page: 1, limit: 20 }
const stateLabel = (value: string) => ({ ACTIVE: 'Activo', SUSPENDED: 'Suspendido', CLOSED: 'Cerrado', UNPUBLISHED: 'No publicado', PUBLISHED: 'Publicado' }[value] ?? `Estado desconocido (${value})`)
const stateVariant = (value: string) => value === 'ACTIVE' || value === 'PUBLISHED' ? 'success' : value === 'SUSPENDED' ? 'warning' : value === 'CLOSED' ? 'danger' : 'neutral'
const date = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(value))

export function VenturesPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const { publish, unpublish } = useVentureMutations()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<VentureStatus | undefined>()
  const [publicationStatus, setPublicationStatus] = useState<VenturePublicationStatus | undefined>()
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formVenture, setFormVenture] = useState<Venture | undefined>()
  const [creating, setCreating] = useState(false)
  const [publishTarget, setPublishTarget] = useState<Venture>()
  const [publicationError, setPublicationError] = useState('')
  const ventures = useVentures(filters)
  const detail = useVenture(selectedId)
  const mayCreate = hasCapability(user?.permissionCodes, 'ent.ventures.create')
  const mayUpdate = hasCapability(user?.permissionCodes, 'ent.ventures.update')
  const mayPublish = hasCapability(user?.permissionCodes, 'ent.ventures.publish')
  const filtersActive = Boolean(filters.search || filters.status || filters.publicationStatus)
  const applyFilters = () => setFilters(current => ({ ...current, search: search.trim() || undefined, status, publicationStatus, page: 1 }))
  const clearFilters = () => { setSearch(''); setStatus(undefined); setPublicationStatus(undefined); setFilters(INITIAL_FILTERS) }
  const changePage = (page: number) => setFilters(current => ({ ...current, page }))
  const closeDetail = () => setSelectedId(null)
  const venturesFound = ventures.data?.total ?? 0
  const publicationBusy = publish.isPending || unpublish.isPending
  const publishVenture = async () => {
    if (!publishTarget || publicationBusy) return
    setPublicationError('')
    try {
      await publish.mutateAsync(publishTarget.id)
      notify('Emprendimiento publicado correctamente.', 'success')
      setPublishTarget(undefined)
    } catch (reason) { setPublicationError(getErrorMessage(reason, 'No fue posible publicar el emprendimiento.')) }
  }
  const unpublishVenture = async (venture: Venture) => {
    if (publicationBusy) return
    setPublicationError('')
    try {
      await unpublish.mutateAsync(venture.id)
      notify('Publicación retirada correctamente.', 'success')
    } catch (reason) { setPublicationError(getErrorMessage(reason, 'No fue posible retirar la publicación.')) }
  }

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
    {selectedId !== null ? <VentureDetail venture={detail.data} loading={detail.isPending} error={detail.isError ? getErrorMessage(detail.error) : ''} publicationError={publicationError} onClose={closeDetail} onEdit={mayUpdate && detail.data ? () => { closeDetail(); setFormVenture(detail.data) } : undefined} mayPublish={mayPublish} publicationBusy={publicationBusy} onPublish={venture => setPublishTarget(venture)} onUnpublish={unpublishVenture} /> : null}
    {creating ? <VentureForm onClose={() => setCreating(false)} onSuccess={() => notify('Emprendimiento registrado correctamente.', 'success')} /> : null}
    {formVenture ? <VentureForm venture={formVenture} onClose={() => setFormVenture(undefined)} onSuccess={() => notify('Emprendimiento actualizado correctamente.', 'success')} /> : null}
    <Dialog open={Boolean(publishTarget)} onOpenChange={open => { if (!open && !publish.isPending) setPublishTarget(undefined) }}><DialogContent size="sm"><DialogHeader><DialogTitle>Publicar emprendimiento</DialogTitle><DialogDescription>Al publicar “{publishTarget?.name}”, se marcará como publicado en el registro institucional. Esto no crea ni habilita un directorio público.</DialogDescription></DialogHeader>{publicationError ? <ErrorState title="No fue posible publicar" message={publicationError} /> : null}<DialogFooter><Button type="button" variant="outline" disabled={publish.isPending} onClick={() => setPublishTarget(undefined)}>Cancelar</Button><Button type="button" loading={publish.isPending} onClick={() => void publishVenture()}>Publicar</Button></DialogFooter></DialogContent></Dialog>
  </section>
}

function VentureCards({ ventures, onDetail }: { ventures: Venture[]; onDetail: (id: number) => void }) {
  return <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{ventures.map(venture => <Card key={venture.id} className="min-w-0 overflow-hidden"><div className="flex h-20 items-center justify-center border-b border-border bg-surface-subtle text-muted-foreground"><BriefcaseBusiness className="size-7" aria-hidden="true" /><span className="sr-only">Sin imagen disponible</span></div><CardContent className="flex min-h-60 flex-col gap-3 pt-4"><div className="flex flex-wrap gap-2"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></div><div><h2 className="text-heading-3 font-semibold text-text-primary">{venture.name}</h2><p className="mt-1 line-clamp-2 text-body-small text-text-secondary">{venture.offerDescription ?? venture.description ?? 'Sin descripción comercial registrada.'}</p></div><div className="grid gap-1.5 text-body-small text-text-secondary">{venture.locationText ? <p className="flex min-w-0 items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{venture.locationText}</span></p> : null}{venture.businessPhone ? <p className="flex min-w-0 items-center gap-2"><Phone className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{venture.businessPhone}</span></p> : null}</div><Button type="button" variant="outline" className="mt-auto w-full" onClick={() => onDetail(venture.id)}>Ver detalle</Button></CardContent></Card>)}</div>
}

function VentureTable({ ventures, onDetail }: { ventures: Venture[]; onDetail: (id: number) => void }) {
  return <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block"><table className="min-w-[52rem] w-full text-left text-body-small"><thead className="bg-surface-subtle text-text-secondary"><tr><th scope="col" className="p-4 font-semibold">Emprendimiento</th><th scope="col" className="p-4 font-semibold">Estado</th><th scope="col" className="p-4 font-semibold">Publicación</th><th scope="col" className="p-4 font-semibold">Incorporación</th><th scope="col" className="p-4"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{ventures.map(venture => <tr key={venture.id} className="border-t border-border align-middle transition-colors hover:bg-surface-subtle/70"><td className="p-4"><p className="font-semibold text-text-primary">{venture.name}</p><p className="mt-1 max-w-md truncate text-text-secondary">{venture.locationText ?? venture.businessPhone ?? 'Sin información de ubicación o contacto'}</p></td><td className="p-4"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge></td><td className="p-4"><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></td><td className="whitespace-nowrap p-4 text-text-secondary">{date(venture.incorporatedAt)}</td><td className="p-4 text-right"><Button type="button" size="sm" variant="outline" onClick={() => onDetail(venture.id)}>Ver detalle</Button></td></tr>)}</tbody></table></div>
}

function VentureDetail({ venture, loading, error, publicationError, onClose, onEdit, mayPublish, publicationBusy, onPublish, onUnpublish }: { venture?: Venture; loading: boolean; error: string; publicationError: string; onClose: () => void; onEdit?: () => void; mayPublish: boolean; publicationBusy: boolean; onPublish: (venture: Venture) => void; onUnpublish: (venture: Venture) => void }) {
  const footer = <VentureDetailFooter venture={venture} onClose={onClose} onEdit={onEdit} mayPublish={mayPublish} busy={publicationBusy} onPublish={onPublish} onUnpublish={onUnpublish} />
  return <Modal title="Detalle del emprendimiento" onClose={onClose} busy={publicationBusy} footer={footer}>{loading ? <LoadingState label="Cargando detalle..." /> : error ? <ErrorState title="No fue posible cargar el detalle" message={error} /> : venture ? <div className="grid gap-5">{publicationError ? <ErrorState title="No fue posible actualizar la publicación" message={publicationError} /> : null}<VentureDetailHeader venture={venture} /><Details venture={venture} /></div> : null}</Modal>
}

function VentureDetailFooter({ venture, onClose, onEdit, mayPublish, busy, onPublish, onUnpublish }: { venture?: Venture; onClose: () => void; onEdit?: () => void; mayPublish: boolean; busy: boolean; onPublish: (venture: Venture) => void; onUnpublish: (venture: Venture) => void }) {
  return <><Button type="button" variant="outline" onClick={onClose} disabled={busy}><ArrowLeft aria-hidden="true" /> Volver al directorio</Button>{onEdit ? <Button type="button" variant="outline" onClick={onEdit} disabled={busy}><Pencil aria-hidden="true" /> Editar</Button> : null}{venture && mayPublish ? <PublicationAction venture={venture} busy={busy} onPublish={onPublish} onUnpublish={onUnpublish} /> : null}</>
}

function PublicationAction({ venture, busy, onPublish, onUnpublish }: { venture: Venture; busy: boolean; onPublish: (venture: Venture) => void; onUnpublish: (venture: Venture) => void }) {
  if (venture.publicationStatus === 'PUBLISHED') return <Button type="button" variant="outline" disabled={busy} onClick={() => void onUnpublish(venture)}>{busy ? 'Retirando…' : 'Retirar publicación'}</Button>
  const inactive = venture.status !== 'ACTIVE'
  return <Button type="button" disabled={busy || inactive} title={inactive ? 'Solo los emprendimientos activos pueden publicarse.' : undefined} onClick={() => onPublish(venture)}>{busy ? 'Publicando…' : 'Publicar'}</Button>
}

function VentureDetailHeader({ venture }: { venture: Venture }) {
  return <section className="overflow-hidden rounded-xl border border-border bg-surface" aria-labelledby="venture-detail-name"><div className="flex h-16 items-center justify-center border-b border-border bg-surface-subtle text-muted-foreground"><BriefcaseBusiness className="size-7" aria-hidden="true" /><span className="sr-only">Sin imagen disponible</span></div><div className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-end sm:p-5"><div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-subtle text-muted-foreground"><BriefcaseBusiness className="size-7" aria-hidden="true" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><StatusBadge variant={stateVariant(venture.status)}>{stateLabel(venture.status)}</StatusBadge><StatusBadge variant={stateVariant(venture.publicationStatus)}>{stateLabel(venture.publicationStatus)}</StatusBadge></div><h3 id="venture-detail-name" className="mt-3 break-words text-heading-2 font-semibold text-text-primary">{venture.name}</h3><p className="mt-1 text-body-small text-text-secondary">Registro del directorio comunitario</p></div></div></section>
}

function Details({ venture }: { venture: Venture }) {
  return <div className="grid gap-4 lg:grid-cols-3"><div className="grid gap-4 lg:col-span-2"><InformationPanel title="Descripción"><p className="whitespace-pre-wrap">{venture.description ?? 'No se registró una descripción para este emprendimiento.'}</p></InformationPanel><InformationPanel title="Oferta comercial" muted><p className="whitespace-pre-wrap">{venture.offerDescription ?? 'No se registró una oferta comercial.'}</p></InformationPanel></div><aside className="grid gap-4"><InformationPanel title="Información general"><dl className="grid gap-3"><DetailField icon={CalendarDays} label="Fecha de incorporación" value={date(venture.incorporatedAt)} /><DetailField icon={MapPin} label="Ubicación" value={venture.locationText} /></dl></InformationPanel><InformationPanel title="Información de contacto"><dl className="grid gap-3"><DetailField icon={Phone} label="Teléfono comercial" value={venture.businessPhone} /><EmailField email={venture.businessEmail} /><LinkField label="Sitio web" href={venture.websiteUrl} /><LinkField label="Red social" href={venture.socialUrl} /></dl></InformationPanel></aside></div>
}
function InformationPanel({ title, children, muted = false }: { title: string; children: ReactNode; muted?: boolean }) { return <section className={`rounded-xl border border-border p-4 sm:p-5 ${muted ? 'bg-surface-subtle' : 'bg-surface'}`}><h3 className="text-heading-3 font-semibold text-text-primary">{title}</h3><div className="mt-2 text-body-small leading-6 text-text-secondary">{children}</div></section> }
function DetailField({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | null }) { return <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2"><Icon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" /><div className="grid gap-0.5"><dt className="font-semibold text-text-primary">{label}</dt><dd className="break-words text-text-secondary">{value ?? 'No registrada'}</dd></div></div> }
function EmailField({ email }: { email: string | null }) { return <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2"><Mail className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" /><div className="grid gap-0.5"><dt className="font-semibold text-text-primary">Correo comercial</dt><dd>{email ? <a className="inline-flex max-w-full break-all text-interaction-primary-default underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" href={`mailto:${email}`}>{email}</a> : <span className="text-text-secondary">No registrado</span>}</dd></div></div> }
function LinkField({ label, href }: { label: string; href: string | null }) { const safeHref = href && externalUrl(href); return <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2"><Globe2 className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" /><div className="grid gap-0.5"><dt className="font-semibold text-text-primary">{label}</dt><dd>{safeHref ? <a className="inline-flex max-w-full items-center gap-1 break-all text-interaction-primary-default underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" href={safeHref} target="_blank" rel="noreferrer"><span>{href}</span><ExternalLink className="size-3 shrink-0" aria-hidden="true" /></a> : <span className="text-text-secondary">{href ? 'Dirección no válida' : 'No registrado'}</span>}</dd></div></div> }
function externalUrl(value: string) { try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null } catch { return null } }
