import { useEffect } from 'react'
import { CalendarDays, ChevronLeft, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { usePublicEvent } from '../hooks/useEventsQueries'
import { getPublicEventPresentation } from '../model/publicEventPresentation'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

export function PublicEventDetailPage() {
  const { publicId = '' } = useParams()
  const eventQuery = usePublicEvent(publicId)

  useEffect(() => {
    if (!eventQuery.data) return
    document.title = `${eventQuery.data.title} | ADI Curime`
  }, [eventQuery.data])

  return (
    <section className="bg-brand-ivory py-8 min-[375px]:py-10 md:py-12 lg:py-14">
      <div className="public-container max-w-5xl">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-control border border-transparent px-1.5 font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/eventos"><ChevronLeft className="size-4" aria-hidden="true" />Volver a eventos</Link>
        {eventQuery.isPending ? <LoadingState className="mt-6 md:mt-8" label="Cargando evento..." /> : null}
        {eventQuery.isError ? <ErrorState className="mt-6 md:mt-8" title="Evento no disponible" message={getErrorMessage(eventQuery.error, 'El evento solicitado no está disponible.')} action={<Link className="inline-flex min-h-11 items-center rounded-control border border-border-default px-4 font-semibold text-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" to="/eventos">Ver eventos</Link>} /> : null}
        {eventQuery.data ? (() => {
          const presentation = getPublicEventPresentation(eventQuery.data)
          return <article className="mt-6 grid gap-7 md:mt-8 md:gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] lg:items-start lg:gap-10 xl:gap-12">
            <div className="min-w-0">
              <header className="border-b border-brand-sage/70 pb-6 md:pb-8">
                <p className={`inline-flex rounded-control border px-2.5 py-1 text-caption font-bold ${presentation.isPast ? 'border-brand-sage bg-surface-muted text-foreground-secondary' : 'border-brand-primary/30 bg-card-white text-brand-primary'}`}>{presentation.label}</p>
                <h1 className="public-heading mt-3 max-w-3xl text-brand-ink break-words">{eventQuery.data.title}</h1>
                <p className="mt-4 max-w-prose text-body-large leading-relaxed text-foreground-secondary text-pretty break-words">{eventQuery.data.summary}</p>
              </header>
              {eventQuery.data.description ? <section className="mt-7 border-t border-border-subtle pt-6 md:mt-8 md:pt-7" aria-labelledby="event-description-title"><h2 id="event-description-title" className="font-heading text-heading-3 font-semibold text-brand-ink text-balance">Descripción del evento</h2><div className="mt-3 max-w-prose whitespace-pre-line break-words text-body leading-relaxed text-foreground-secondary text-pretty">{eventQuery.data.description}</div></section> : null}
            </div>
            <aside className={`rounded-surface border p-5 shadow-sm md:p-6 ${presentation.isPast ? 'border-brand-sage bg-surface-muted' : 'border-border-default bg-card-white'}`} aria-labelledby="event-details-title">
              <h2 id="event-details-title" className="font-heading text-heading-3 font-semibold text-brand-ink text-balance">Información del evento</h2>
              <dl className="mt-4 space-y-4 border-t border-border-subtle pt-4 text-body-small leading-relaxed text-foreground-secondary">
                <div className="flex gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" /><div className="min-w-0"><dt className="font-semibold text-brand-ink">Fecha y hora</dt><dd className="mt-1 space-y-2 tabular-nums"><span className="block"><span className="font-semibold text-brand-ink">Inicio</span><span className="mt-0.5 block">{formatDate(eventQuery.data.startAt)}</span></span>{eventQuery.data.endAt ? <span className="block"><span className="font-semibold text-brand-ink">Finalización</span><span className="mt-0.5 block">{formatDate(eventQuery.data.endAt)}</span></span> : null}</dd></div></div>
                {eventQuery.data.location ? <div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" /><div className="min-w-0"><dt className="font-semibold text-brand-ink">Lugar</dt><dd className="mt-1 break-words">{eventQuery.data.location}</dd></div></div> : null}
              </dl>
              {presentation.isPast && eventQuery.data.status === 'SCHEDULED' ? <p className="mt-5 border-t border-brand-sage/70 pt-4 text-body-small leading-relaxed text-foreground-muted">La fecha programada ya transcurrió. El estado institucional recibido permanece como “Programado”.</p> : null}
            </aside>
          </article>
        })() : null}
      </div>
    </section>
  )
}
