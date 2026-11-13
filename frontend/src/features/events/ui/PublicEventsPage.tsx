import { useEffect } from 'react'
import { CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { PublicPageContent, PublicPageHeader } from '@/shared/ui/PublicPageLayout'
import { usePublicEvents } from '../hooks/useEventsQueries'
import { getPublicEventPresentation } from '../model/publicEventPresentation'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

export function PublicEventsPage() {
  const eventsQuery = usePublicEvents()
  const upcomingEvents = (eventsQuery.data ?? []).filter((event) => !getPublicEventPresentation(event).isPast)
  const pastEvents = (eventsQuery.data ?? []).filter((event) => getPublicEventPresentation(event).isPast)

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
      <PublicPageContent className="bg-surface-page">
        <section aria-label="Eventos publicados">
          {eventsQuery.isPending ? <LoadingState label="Cargando eventos publicados..." /> : null}
          {eventsQuery.isError ? <ErrorState message={getErrorMessage(eventsQuery.error, 'No fue posible cargar los eventos publicados.')} action={<button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => void eventsQuery.refetch()}>Reintentar</button>} /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && eventsQuery.data.length === 0 ? <EmptyState title="No hay eventos publicados en este momento" description="Cuando la Asociación publique una actividad, aparecerá en esta agenda." /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && eventsQuery.data.length > 0 ? <div className="space-y-10">
            <section aria-labelledby="upcoming-events-title"><div className="mb-5 flex items-end justify-between gap-4 border-b border-border/70 pb-4"><div><p className="public-eyebrow text-brand-primary">Agenda comunitaria</p><h2 id="upcoming-events-title" className="mt-2 font-heading text-heading-2 text-text-primary">Próximas actividades</h2></div></div>{upcomingEvents.length === 0 ? <EmptyState title="No hay próximas actividades publicadas" description="Las nuevas actividades aparecerán aquí cuando la Asociación las comunique oficialmente." /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{upcomingEvents.map((event) => {
                const presentation = getPublicEventPresentation(event)
                return <article key={event.publicId} className={`flex min-w-0 flex-col rounded-xl border bg-white p-6 shadow-sm ${presentation.isPast ? 'border-border/80' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">{presentation.label}</p>
                  </div>
                  <h2 className="mt-4 font-heading text-heading-3 font-semibold text-text-primary"><Link className="rounded-sm hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary" to={`/eventos/${event.publicId}`}>{event.title}</Link></h2>
                  <p className="mt-3 flex-1 text-body text-text-primary/75">{event.summary}</p>
                  <dl className="mt-6 space-y-3 border-t border-border pt-5 text-body-small text-text-primary/80">
                    <div className="flex gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" /><div><dt className="sr-only">Fecha y hora</dt><dd>{formatDate(event.startAt)}{event.endAt ? ` - ${formatDate(event.endAt)}` : ''}</dd></div></div>
                    {event.location ? <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" /><div><dt className="sr-only">Lugar</dt><dd>{event.location}</dd></div></div> : null}
                  </dl>
                  <Link aria-label={`Ver detalle de ${event.title}`} className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary" to={`/eventos/${event.publicId}`}>Ver detalle</Link>
                </article>
              })}</div>}</section>
            {pastEvents.length > 0 ? <section aria-labelledby="past-events-title"><div className="mb-5 border-b border-border/70 pb-4"><p className="public-eyebrow text-brand-primary">Archivo</p><h2 id="past-events-title" className="mt-2 font-heading text-heading-2 text-text-primary">Eventos anteriores</h2></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{pastEvents.map((event) => { const presentation = getPublicEventPresentation(event); return <article key={event.publicId} className="flex min-w-0 flex-col rounded-surface border border-border/80 bg-surface-card p-6 shadow-sm"><p className="text-caption font-bold uppercase tracking-[0.14em] text-foreground-muted">{presentation.label}</p><h3 className="mt-4 font-heading text-heading-3 text-text-primary"><Link to={`/eventos/${event.publicId}`} className="hover:text-brand-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">{event.title}</Link></h3><p className="mt-3 flex-1 text-body-small leading-relaxed text-foreground-muted">{event.summary}</p><Link to={`/eventos/${event.publicId}`} className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">Ver detalle</Link></article> })}</div></section> : null}
          </div> : null}
        </section>
      </PublicPageContent>
    </>
  )
}
