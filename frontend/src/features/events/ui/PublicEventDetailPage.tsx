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
    <section className="bg-brand-ivory py-14 md:py-20">
      <div className="public-container max-w-4xl">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-sm font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary" to="/eventos"><ChevronLeft className="size-4" aria-hidden="true" />Volver a eventos</Link>
        {eventQuery.isPending ? <LoadingState className="mt-10" label="Cargando evento..." /> : null}
        {eventQuery.isError ? <ErrorState className="mt-10" title="Evento no disponible" message={getErrorMessage(eventQuery.error, 'El evento solicitado no está disponible.')} action={<Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold" to="/eventos">Ver eventos</Link>} /> : null}
        {eventQuery.data ? (() => {
          const presentation = getPublicEventPresentation(eventQuery.data)
          return <article className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">{presentation.label}</p>
            <h1 className="mt-3 font-heading text-heading-1 font-bold text-brand-ink">{eventQuery.data.title}</h1>
            <p className="mt-5 text-body-large leading-relaxed text-brand-ink/80">{eventQuery.data.summary}</p>
            <dl className="mt-8 grid gap-5 border-y border-border py-6 text-body text-brand-ink/80 sm:grid-cols-2">
              <div className="flex gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" /><div><dt className="font-semibold text-brand-ink">Fecha y hora</dt><dd className="mt-1">{formatDate(eventQuery.data.startAt)}{eventQuery.data.endAt ? ` - ${formatDate(eventQuery.data.endAt)}` : ''}</dd></div></div>
              {eventQuery.data.location ? <div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" /><div><dt className="font-semibold text-brand-ink">Lugar</dt><dd className="mt-1">{eventQuery.data.location}</dd></div></div> : null}
            </dl>
            {presentation.isPast && eventQuery.data.status === 'SCHEDULED' ? <p className="mt-5 rounded-control border border-brand-sage/80 bg-surface-muted px-4 py-3 text-body-small leading-relaxed text-foreground-muted">La fecha programada ya transcurrió. El estado institucional recibido permanece como “Programado”.</p> : null}
            {eventQuery.data.description ? <div className="mt-8 whitespace-pre-line leading-relaxed text-brand-ink/80">{eventQuery.data.description}</div> : null}
          </article>
        })() : null}
      </div>
    </section>
  )
}
