import { useEffect } from 'react'
import { CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PublicPageContent, PublicPageHeader } from '@/shared/ui/PublicPageLayout'
import { usePublicEvents } from '../hooks/useEventsQueries'
import { getPublicEventPresentation } from '../model/publicEventPresentation'
import type { PublicEvent } from '../model/events.types'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

function EventCard({ event }: { event: PublicEvent }) {
  const presentation = getPublicEventPresentation(event)
  const statusVariant = presentation.backendStatus === 'CANCELLED'
    ? 'error'
    : presentation.isPast
      ? 'neutral'
      : 'info'
  const detailPath = `/eventos/${event.publicId}`

  return (
    <article className="flex h-full min-w-0 flex-col rounded-surface border border-border bg-surface-card p-5 shadow-sm transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none hover:border-brand-primary hover:shadow-md md:p-6">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <Badge variant={statusVariant} className="max-w-full whitespace-normal text-left">{presentation.label}</Badge>
      </div>
      <h3 className="mt-4 min-w-0 font-heading text-heading-3 font-semibold leading-snug text-text-primary">
        <Link className="break-words text-pretty hover:text-brand-primary focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to={detailPath}>{event.title}</Link>
      </h3>
      {event.summary ? <p className="mt-3 min-w-0 flex-1 break-words text-pretty text-body leading-relaxed text-foreground-muted">{event.summary}</p> : <div className="flex-1" />}
      <dl className="mt-5 grid min-w-0 gap-3 border-t border-border pt-4 text-body-small text-foreground-secondary">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-control bg-brand-accent/15 text-brand-deep"><CalendarDays className="size-4" /></span>
          <div className="min-w-0">
            <dt className="text-caption font-semibold text-text-primary">Fecha y hora</dt>
            <dd className="break-words">
              <time dateTime={event.startAt}>{formatDate(event.startAt)}</time>
              {event.endAt ? <> – <time dateTime={event.endAt}>{formatDate(event.endAt)}</time></> : null}
            </dd>
          </div>
        </div>
        {event.location ? <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-control bg-brand-accent/15 text-brand-deep"><MapPin className="size-4" /></span>
          <div className="min-w-0">
            <dt className="text-caption font-semibold text-text-primary">Ubicación</dt>
            <dd className="break-words">{event.location}</dd>
          </div>
        </div> : null}
      </dl>
      <Link aria-label={`Ver detalle de ${event.title}`} className="mt-5 inline-flex min-h-11 w-fit max-w-full items-center break-words font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to={detailPath}>Ver detalle</Link>
    </article>
  )
}

export function PublicEventsPage() {
  const eventsQuery = usePublicEvents()
  const events = eventsQuery.data ?? []
  const upcomingEvents = events.filter((event) => !getPublicEventPresentation(event).isPast)
  const pastEvents = events.filter((event) => getPublicEventPresentation(event).isPast)

  useEffect(() => {
    document.title = 'Eventos | ADI Curime'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.append(meta)
    }
    meta.setAttribute('content', 'Eventos publicados por la Asociación de Desarrollo Integral de Curime.')
  }, [])

  return (
    <>
      <PublicPageHeader breadcrumb="Eventos" eyebrow="Agenda comunitaria" title="Eventos" intro="Consulte las actividades comunicadas oficialmente por la Asociación." image={{ src: '/images/public/home/community-curime-wide.webp', mobileSrc: '/images/public/home/community-curime-mobile.webp', alt: 'Actividad comunitaria en Curime.' }} />
      <PublicPageContent className="min-w-0 bg-surface-page" spacing="spacious">
        <section aria-label="Eventos publicados" className="min-w-0">
          {eventsQuery.isPending ? <LoadingState className="rounded-surface border border-border bg-surface-card p-6" label="Cargando eventos publicados..." /> : null}
          {eventsQuery.isError ? <ErrorState title="No fue posible cargar los eventos" message={getErrorMessage(eventsQuery.error, 'No fue posible cargar los eventos publicados.')} action={<button className="min-h-11 rounded-control border border-border px-4 font-semibold focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" type="button" onClick={() => void eventsQuery.refetch()}>Reintentar</button>} /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && events.length === 0 ? <EmptyState title="No hay eventos publicados en este momento" description="Cuando la Asociación publique una actividad, aparecerá en esta agenda." /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && events.length > 0 ? <div className="min-w-0 space-y-10">
            <section aria-labelledby="upcoming-events-title" className="min-w-0">
              <div className="mb-5 border-b border-border/70 pb-4">
                <p className="public-eyebrow text-brand-primary">Agenda comunitaria</p>
                <h2 id="upcoming-events-title" className="mt-2 font-heading text-heading-2 text-text-primary">Próximas actividades</h2>
              </div>
              {upcomingEvents.length === 0
                ? <EmptyState title="No hay próximas actividades publicadas" description="Las nuevas actividades aparecerán aquí cuando la Asociación las comunique oficialmente." />
                : <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {upcomingEvents.map((event) => <EventCard key={event.publicId} event={event} />)}
                </div>}
            </section>
            {pastEvents.length > 0 ? <section aria-labelledby="past-events-title" className="min-w-0">
              <div className="mb-5 border-b border-border/70 pb-4">
                <p className="public-eyebrow text-brand-primary">Archivo</p>
                <h2 id="past-events-title" className="mt-2 font-heading text-heading-2 text-text-primary">Eventos anteriores</h2>
              </div>
              <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pastEvents.map((event) => <EventCard key={event.publicId} event={event} />)}
              </div>
            </section> : null}
          </div> : null}
        </section>
      </PublicPageContent>
    </>
  )
}
