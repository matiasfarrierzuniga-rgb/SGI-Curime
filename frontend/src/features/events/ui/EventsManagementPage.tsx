import { useState } from 'react'
import { getErrorMessage } from '@/shared/lib/errors'
import { hasCapability } from '@/shared/security/access'
import { useAuth } from '@/features/auth'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { useAdminEvents, useEventMutations } from '../hooks/useEventsQueries'
import type { AdminEvent } from '../model/events.types'
import { EventForm } from './EventForm'

function label(value: string) {
  return value === 'SCHEDULED' ? 'Programado' : value === 'CANCELLED' ? 'Cancelado' : value === 'COMPLETED' ? 'Finalizado' : value === 'PUBLISHED' ? 'Publicado' : value === 'ARCHIVED' ? 'Archivado' : value === 'REVIEW' ? 'En revisión' : value === 'INTERNAL' ? 'Interno' : 'Borrador'
}

export function EventsManagementPage() {
  const { user } = useAuth()
  const eventsQuery = useAdminEvents()
  const { submitForReview, returnToDraft, publish, archive } = useEventMutations()
  const [editing, setEditing] = useState<AdminEvent | undefined>()
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState('')
  const mayPublish = hasCapability(user?.role, 'pub.events.publish')
  const mayManage = hasCapability(user?.role, 'pub.events.manage')
  const workflowBusy = submitForReview.isPending || returnToDraft.isPending || publish.isPending || archive.isPending

  const runPublicationAction = async (event: AdminEvent, action: 'review' | 'draft' | 'publish' | 'archive') => {
    if (workflowBusy || ((action === 'review' || action === 'draft') ? !mayManage : !mayPublish)) return
    setActionError('')
    try {
      if (action === 'review') await submitForReview.mutateAsync(event.id)
      else if (action === 'draft') await returnToDraft.mutateAsync(event.id)
      else if (action === 'publish') await publish.mutateAsync(event.id)
      else await archive.mutateAsync(event.id)
    } catch (reason) { setActionError(getErrorMessage(reason, 'No fue posible actualizar la publicación del evento.')) }
  }

  return <section className="space-y-6">
    <PageHeader context="Gestión administrativa" title="Eventos" description="Cree, actualice y controle la publicación de la agenda comunitaria." actions={<button className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory hover:bg-brand-primary" type="button" onClick={() => setCreating(true)}>Crear evento</button>} />
    {actionError ? <ErrorState title="No fue posible actualizar el evento" message={actionError} /> : null}
    {eventsQuery.isPending ? <LoadingState label="Cargando eventos..." /> : null}
    {eventsQuery.isError ? <ErrorState message={getErrorMessage(eventsQuery.error, 'No fue posible cargar los eventos.')} action={<button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => void eventsQuery.refetch()}>Reintentar</button>} /> : null}
    {!eventsQuery.isPending && !eventsQuery.isError && eventsQuery.data.length === 0 ? <EmptyState title="No hay eventos registrados" description="Cree el primer evento cuando cuente con información confirmada por la Asociación." action={<button className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory" type="button" onClick={() => setCreating(true)}>Crear evento</button>} /> : null}
    {!eventsQuery.isPending && !eventsQuery.isError && eventsQuery.data.length > 0 ? <div className="grid gap-4">
      {eventsQuery.data.map((event) => <article key={event.id} className="grid gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-brand-soft/20 px-3 py-1 text-brand-deep">{label(event.publicationStatus)}</span><span className="rounded-full bg-surface-muted px-3 py-1 text-foreground-muted">{label(event.status)}</span></div>
          <h2 className="mt-3 font-heading text-heading-3 font-semibold text-brand-ink">{event.title}</h2>
          <p className="mt-1 text-body-small text-foreground-muted">{new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.startAt))}</p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => setEditing(event)}>Editar</button>
          {mayManage && event.publicationStatus === 'DRAFT' ? <button className="min-h-11 rounded-md border border-border px-4 font-semibold" disabled={workflowBusy} type="button" onClick={() => void runPublicationAction(event, 'review')}>Enviar a revisión</button> : null}
          {mayManage && event.publicationStatus === 'REVIEW' ? <button className="min-h-11 rounded-md border border-border px-4 font-semibold" disabled={workflowBusy} type="button" onClick={() => void runPublicationAction(event, 'draft')}>Devolver a borrador</button> : null}
          {mayPublish && event.publicationStatus === 'REVIEW' ? <button className="min-h-11 rounded-md bg-brand-deep px-4 font-semibold text-brand-ivory hover:bg-brand-primary" disabled={workflowBusy} type="button" onClick={() => void runPublicationAction(event, 'publish')}>Publicar</button> : null}
          {mayPublish && event.publicationStatus === 'PUBLISHED' ? <button className="min-h-11 rounded-md border border-danger px-4 font-semibold text-danger" disabled={workflowBusy} type="button" onClick={() => void runPublicationAction(event, 'archive')}>Archivar</button> : null}
        </div>
      </article>)}
    </div> : null}
    {creating ? <EventForm onClose={() => setCreating(false)} /> : null}
    {editing ? <EventForm event={editing} onClose={() => setEditing(undefined)} /> : null}
  </section>
}
