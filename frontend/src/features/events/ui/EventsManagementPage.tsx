import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { useAuth } from '@/features/auth'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select } from '@/shared/ui/select'
import { useAdminEvents, useEventMutations } from '../hooks/useEventsQueries'
import type { AdminEvent, EventStatus, PublicationStatus } from '../model/events.types'
import { EventForm } from './EventForm'

const publicationLabels: Record<PublicationStatus, string> = { INTERNAL: 'Interno', DRAFT: 'Borrador', REVIEW: 'En revisión', PUBLISHED: 'Publicado', ARCHIVED: 'Archivado' }
const statusLabels: Record<EventStatus, string> = { SCHEDULED: 'Programado', CANCELLED: 'Cancelado', COMPLETED: 'Finalizado' }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function EventActions({ event, mayManage, mayPublish, busy, onEdit, onAction }: { event: AdminEvent; mayManage: boolean; mayPublish: boolean; busy: boolean; onEdit: () => void; onAction: (action: 'review' | 'draft' | 'publish' | 'archive') => void }) {
  return <div className="flex max-w-72 flex-wrap items-center gap-1.5 md:ml-auto md:justify-end">
    {mayManage ? <Button variant="outline" size="sm" type="button" onClick={onEdit}>Editar</Button> : null}
    {mayManage && event.publicationStatus === 'DRAFT' ? <Button variant="outline" size="sm" disabled={busy} type="button" onClick={() => onAction('review')}>Enviar a revisión</Button> : null}
    {mayManage && event.publicationStatus === 'REVIEW' ? <Button variant="outline" size="sm" disabled={busy} type="button" onClick={() => onAction('draft')}>Devolver a borrador</Button> : null}
    {mayPublish && event.publicationStatus === 'REVIEW' ? <Button size="sm" disabled={busy} type="button" onClick={() => onAction('publish')}>Publicar</Button> : null}
    {mayPublish && event.publicationStatus === 'PUBLISHED' ? <Button variant="outline" size="sm" disabled={busy} type="button" onClick={() => onAction('archive')}>Archivar</Button> : null}
  </div>
}

export function EventsManagementPage() {
  const { user } = useAuth()
  const eventsQuery = useAdminEvents()
  const { submitForReview, returnToDraft, publish, archive } = useEventMutations()
  const [editing, setEditing] = useState<AdminEvent | undefined>()
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [publicationStatus, setPublicationStatus] = useState<'ALL' | PublicationStatus>('ALL')
  const [businessStatus, setBusinessStatus] = useState<'ALL' | EventStatus>('ALL')
  const [scope, setScope] = useState<'ALL' | 'UPCOMING'>('ALL')
  const [archiveTarget, setArchiveTarget] = useState<AdminEvent | undefined>()
  const [filterTimestamp] = useState(() => new Date())
  const mayPublish = hasCapability(user?.permissionCodes, 'pub.events.publish')
  const mayManage = hasCapability(user?.permissionCodes, 'pub.events.manage')
  const workflowBusy = submitForReview.isPending || returnToDraft.isPending || publish.isPending || archive.isPending
  const events = eventsQuery.data ?? []
  const upcomingEvents = events.filter(event => new Date(event.startAt) >= filterTimestamp)
  const normalizedSearch = search.trim().toLocaleLowerCase('es-CR')
  const filteredEvents = events.filter(event => {
    const matchesSearch = !normalizedSearch || [event.title, event.summary, event.location ?? ''].some(value => value.toLocaleLowerCase('es-CR').includes(normalizedSearch))
    return matchesSearch && (publicationStatus === 'ALL' || event.publicationStatus === publicationStatus) && (businessStatus === 'ALL' || event.status === businessStatus) && (scope === 'ALL' || new Date(event.startAt) >= filterTimestamp)
  })
  const filtersActive = Boolean(search || publicationStatus !== 'ALL' || businessStatus !== 'ALL' || scope !== 'ALL')

  const runPublicationAction = async (event: AdminEvent, action: 'review' | 'draft' | 'publish' | 'archive') => {
    if (workflowBusy || ((action === 'review' || action === 'draft') ? !mayManage : !mayPublish)) return false
    setActionError('')
    try {
      if (action === 'review') await submitForReview.mutateAsync(event.id)
      else if (action === 'draft') await returnToDraft.mutateAsync(event.id)
      else if (action === 'publish') await publish.mutateAsync(event.id)
      else await archive.mutateAsync(event.id)
      return true
    } catch (reason) { setActionError(getErrorMessage(reason, 'No fue posible actualizar la publicación del evento.')); return false }
  }

  const requestAction = (event: AdminEvent, action: 'review' | 'draft' | 'publish' | 'archive') => {
    if (action === 'archive') setArchiveTarget(event)
    else void runPublicationAction(event, action)
  }

  const confirmArchive = async () => {
    if (archiveTarget && await runPublicationAction(archiveTarget, 'archive')) setArchiveTarget(undefined)
  }

  const clearFilters = () => { setSearch(''); setPublicationStatus('ALL'); setBusinessStatus('ALL'); setScope('ALL') }

  return <section className="min-w-0 space-y-6">
    <PageHeader context="Gestión administrativa" title="Eventos" description="Cree, actualice y controle la publicación de la agenda comunitaria." actions={mayManage ? <Button type="button" onClick={() => setCreating(true)}>Crear evento</Button> : undefined} />
    {actionError ? <ErrorState title="No fue posible actualizar el evento" message={actionError} /> : null}
    {eventsQuery.isPending ? <LoadingState label="Cargando eventos..." /> : null}
    {eventsQuery.isError ? <ErrorState message={getErrorMessage(eventsQuery.error, 'No fue posible cargar los eventos.')} action={<Button variant="outline" type="button" onClick={() => void eventsQuery.refetch()}>Reintentar</Button>} /> : null}
    {!eventsQuery.isPending && !eventsQuery.isError ? <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3" aria-label="Resumen de eventos cargados">
        <div className="rounded-overlay border border-border bg-surface px-4 py-3 shadow-sm"><p className="text-caption font-medium text-foreground-muted">Cargados</p><p className="mt-1 text-heading-2 font-semibold tabular-nums text-brand-ink">{events.length}</p></div>
        <div className="rounded-overlay border border-border bg-surface px-4 py-3 shadow-sm"><p className="text-caption font-medium text-foreground-muted">Borradores</p><p className="mt-1 text-heading-2 font-semibold tabular-nums text-brand-ink">{events.filter(event => event.publicationStatus === 'DRAFT').length}</p></div>
        <div className={`rounded-overlay border px-4 py-3 shadow-sm ${events.filter(event => event.publicationStatus === 'REVIEW').length ? 'border-accent bg-accent/10' : 'border-border bg-surface'}`}><p className="text-caption font-medium text-foreground-muted">En revisión</p><p className="mt-1 text-heading-2 font-semibold tabular-nums text-brand-ink">{events.filter(event => event.publicationStatus === 'REVIEW').length}</p></div>
        <div className="rounded-overlay border border-border bg-surface px-4 py-3 shadow-sm"><p className="text-caption font-medium text-foreground-muted">Publicados</p><p className="mt-1 text-heading-2 font-semibold tabular-nums text-brand-ink">{events.filter(event => event.publicationStatus === 'PUBLISHED').length}</p></div>
        <div className="rounded-overlay border border-border bg-surface px-4 py-3 shadow-sm"><p className="text-caption font-medium text-foreground-muted">Próximos</p><p className="mt-1 text-heading-2 font-semibold tabular-nums text-brand-ink">{upcomingEvents.length}</p></div>
      </div>
      {events.length === 0 ? <EmptyState title="No hay eventos registrados" description="Cree el primer evento cuando cuente con información confirmada por la Asociación." action={mayManage ? <Button type="button" onClick={() => setCreating(true)}>Crear evento</Button> : undefined} /> : <>
        <div className="grid gap-3 border-y border-border py-4 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto] lg:items-end">
          <div className="grid gap-1.5"><Label htmlFor="event-search" className="text-caption font-semibold text-foreground-muted">Buscar eventos</Label><Input id="event-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Título, resumen o lugar" /></div>
          <div className="grid gap-1.5"><Label htmlFor="publication-filter" className="text-caption font-semibold text-foreground-muted">Publicación</Label><Select id="publication-filter" value={publicationStatus} onChange={event => setPublicationStatus(event.target.value as 'ALL' | PublicationStatus)}><option value="ALL">Todos los estados</option>{Object.entries(publicationLabels).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</Select></div>
          <div className="grid gap-1.5"><Label htmlFor="business-filter" className="text-caption font-semibold text-foreground-muted">Estado del evento</Label><Select id="business-filter" value={businessStatus} onChange={event => setBusinessStatus(event.target.value as 'ALL' | EventStatus)}><option value="ALL">Todos los estados</option>{Object.entries(statusLabels).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</Select></div>
          <div className="flex flex-wrap items-center gap-1.5"><Button type="button" variant={scope === 'UPCOMING' ? 'secondary' : 'outline'} size="sm" aria-pressed={scope === 'UPCOMING'} onClick={() => setScope(scope === 'UPCOMING' ? 'ALL' : 'UPCOMING')}>{scope === 'UPCOMING' ? 'Próximos activos' : 'Solo próximos'}</Button>{filtersActive ? <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Limpiar</Button> : null}</div>
        </div>
        {filteredEvents.length === 0 ? <EmptyState title="No hay eventos que coincidan" description="Ajuste o limpie los filtros para ver los eventos cargados." action={<Button variant="outline" type="button" onClick={clearFilters}>Limpiar filtros</Button>} /> : <>
          <div className="hidden overflow-hidden rounded-overlay border border-border bg-surface shadow-sm md:block"><div className="overflow-x-auto"><table className="w-full min-w-[800px] border-collapse text-left"><thead className="border-b border-border bg-muted/50 text-caption font-semibold tracking-wide text-foreground-muted"><tr><th scope="col" className="px-4 py-2.5">Evento</th><th scope="col" className="px-4 py-2.5">Fecha y lugar</th><th scope="col" className="px-4 py-2.5">Estado operativo</th><th scope="col" className="px-4 py-2.5">Publicación</th><th scope="col" className="px-4 py-2.5 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-border">{filteredEvents.map(event => <tr key={event.id} className={`transition-colors hover:bg-muted/35 focus-within:bg-muted/50 ${event.publicationStatus === 'REVIEW' ? 'bg-accent/10' : ''}`}><td className="max-w-sm px-4 py-3 align-top"><p className="font-semibold text-foreground">{event.title}</p><p className="mt-0.5 line-clamp-2 text-body-small leading-snug text-foreground-muted">{event.summary}</p></td><td className="px-4 py-3 align-top text-body-small text-foreground"><p>{formatDate(event.startAt)}</p><p className="mt-0.5 text-foreground-muted">{event.location || 'Sin lugar indicado'}</p></td><td className="px-4 py-3 align-top"><p className="mb-1 text-caption font-medium text-foreground-muted">Operación</p><Badge variant="secondary">{statusLabels[event.status]}</Badge></td><td className="px-4 py-3 align-top"><p className="mb-1 text-caption font-medium text-foreground-muted">Portal</p><Badge variant={event.publicationStatus === 'REVIEW' ? 'accent' : 'secondary'}>{publicationLabels[event.publicationStatus]}</Badge></td><td className="px-4 py-3 align-top"><EventActions event={event} mayManage={mayManage} mayPublish={mayPublish} busy={workflowBusy} onEdit={() => setEditing(event)} onAction={action => requestAction(event, action)} /></td></tr>)}</tbody></table></div></div>
          <div className="grid gap-3 md:hidden">{filteredEvents.map(event => <article key={event.id} className={`min-w-0 rounded-overlay border border-border bg-surface p-4 shadow-sm ${event.publicationStatus === 'REVIEW' ? 'border-accent' : ''}`}><div className="flex flex-wrap gap-2"><Badge variant={event.publicationStatus === 'REVIEW' ? 'accent' : 'secondary'}>{publicationLabels[event.publicationStatus]}</Badge><Badge variant="secondary">{statusLabels[event.status]}</Badge></div><h2 className="mt-3 text-heading-3 font-semibold text-brand-ink">{event.title}</h2><p className="mt-1 text-body-small leading-snug text-foreground-muted">{event.summary}</p><dl className="mt-4 grid gap-3 border-y border-border py-3 text-body-small"><div><dt className="font-medium text-foreground-muted">Fecha y hora</dt><dd className="mt-1 text-foreground">{formatDate(event.startAt)}</dd></div><div><dt className="font-medium text-foreground-muted">Lugar</dt><dd className="mt-1 text-foreground">{event.location || 'Sin lugar indicado'}</dd></div><div className="grid grid-cols-2 gap-3"><div><dt className="font-medium text-foreground-muted">Operación</dt><dd className="mt-1"><Badge variant="secondary">{statusLabels[event.status]}</Badge></dd></div><div><dt className="font-medium text-foreground-muted">Portal</dt><dd className="mt-1"><Badge variant={event.publicationStatus === 'REVIEW' ? 'accent' : 'secondary'}>{publicationLabels[event.publicationStatus]}</Badge></dd></div></div></dl><div className="mt-4"><EventActions event={event} mayManage={mayManage} mayPublish={mayPublish} busy={workflowBusy} onEdit={() => setEditing(event)} onAction={action => requestAction(event, action)} /></div></article>)}</div>
        </>}
      </>}
    </> : null}
    <Dialog open={Boolean(archiveTarget)} onOpenChange={open => { if (!open && !archive.isPending) setArchiveTarget(undefined) }}><DialogContent size="sm"><DialogHeader><DialogTitle>Archivar evento</DialogTitle><DialogDescription>Al archivar “{archiveTarget?.title}”, se elimina su visibilidad publicada según el comportamiento actual.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={archive.isPending} onClick={() => setArchiveTarget(undefined)}>Cancelar</Button><Button type="button" variant="danger" loading={archive.isPending} onClick={() => void confirmArchive()}>Archivar evento</Button></DialogFooter></DialogContent></Dialog>
    {creating ? <EventForm onClose={() => setCreating(false)} /> : null}
    {editing ? <EventForm event={editing} onClose={() => setEditing(undefined)} /> : null}
  </section>
}
