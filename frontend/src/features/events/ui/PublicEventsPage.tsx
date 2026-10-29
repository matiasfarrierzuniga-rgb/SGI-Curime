import { useEffect } from 'react'
import { CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { usePublicEvents } from '../hooks/useEventsQueries'
import { getPublicEventPresentation } from '../model/publicEventPresentation'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

export function PublicEventsPage() {
  const eventsQuery = usePublicEvents()

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
    <section className="bg-brand-ivory py-8 min-[375px]:py-10 md:py-12 lg:py-14">
      <div className="public-container">
        <header className="max-w-2xl border-b border-brand-sage/70 pb-5 md:pb-6">
          <p className="public-eyebrow text-brand-primary">Agenda comunitaria</p>
          <h1 className="public-heading mt-2 text-brand-ink">Eventos</h1>
          <p className="mt-3 text-body-large leading-relaxed text-foreground-muted text-pretty">Consulte las actividades comunicadas oficialmente por la Asociación.</p>
        </header>
        <section aria-label="Eventos publicados" className="mt-6 md:mt-8">
          {eventsQuery.isPending ? <LoadingState label="Cargando eventos publicados..." /> : null}
          {eventsQuery.isError ? <ErrorState message={getErrorMessage(eventsQuery.error, 'No fue posible cargar los eventos publicados.')} action={<button className="min-h-11 rounded-control border border-border-default px-4 font-semibold focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" type="button" onClick={() => void eventsQuery.refetch()}>Reintentar</button>} /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && eventsQuery.data.length === 0 ? <EmptyState title="No hay eventos publicados en este momento" description="Cuando la Asociación publique una actividad, aparecerá en esta agenda." /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && eventsQuery.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
              {eventsQuery.data.map((event) => {
                const presentation = getPublicEventPresentation(event)
                return <article key={event.publicId} className={`flex min-w-0 flex-col rounded-surface border p-5 shadow-sm md:p-6 ${presentation.isPast ? 'border-brand-sage bg-surface-muted' : 'border-border-default bg-card-white'}`}>
                  <p className={`inline-flex self-start rounded-control border px-2.5 py-1 text-caption font-bold ${presentation.isPast ? 'border-brand-sage bg-brand-ivory text-foreground-secondary' : 'border-brand-primary/30 bg-card-white text-brand-primary'}`}>{presentation.label}</p>
                  <h2 className="mt-3 font-heading text-heading-3 font-semibold text-brand-ink text-balance break-words"><Link className="rounded-sm hover:text-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to={`/eventos/${event.publicId}`}>{event.title}</Link></h2>
                  <p className="mt-2 text-body-small leading-relaxed text-foreground-muted text-pretty break-words">{event.summary}</p>
                  <dl className="mt-5 space-y-2 border-t border-border-subtle pt-4 text-body-small leading-relaxed text-foreground-secondary">
                    <div className="flex gap-2.5"><CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" /><div className="min-w-0"><dt className="sr-only">Fecha y hora</dt><dd className="space-y-1 tabular-nums"><span className="block"><span className="font-semibold text-brand-ink">Inicio: </span>{formatDate(event.startAt)}</span>{event.endAt ? <span className="block"><span className="font-semibold text-brand-ink">Finalización: </span>{formatDate(event.endAt)}</span> : null}</dd></div></div>
                    {event.location ? <div className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" /><div className="min-w-0"><dt className="sr-only">Lugar</dt><dd className="break-words">{event.location}</dd></div></div> : null}
                  </dl>
                  <Link aria-label={`Ver detalle de ${event.title}`} className="mt-5 inline-flex min-h-11 items-center self-start font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to={`/eventos/${event.publicId}`}>Ver detalle</Link>
                </article>
              })}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  )
}
