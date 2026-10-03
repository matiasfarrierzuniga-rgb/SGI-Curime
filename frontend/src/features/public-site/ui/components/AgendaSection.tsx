import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { usePublicEvents } from '@/features/events'

function formatDay(value: string) {
  return new Intl.DateTimeFormat('es-CR', { day: 'numeric' }).format(new Date(value))
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('es-CR', { month: 'short' }).format(new Date(value)).replace('.', '')
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-CR', { timeStyle: 'short' }).format(new Date(value))
}

export function AgendaSection() {
  const eventsQuery = usePublicEvents()
  const now = Date.now()
  const upcomingEvents = eventsQuery.data
    ?.filter((event) => event.status === 'SCHEDULED' && new Date(event.startAt).getTime() >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 3) ?? []

  return (
    <section aria-labelledby="agenda-title" className="bg-brand-ivory py-12 md:py-16 xl:py-20">
      <div className="public-container">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div>
            <p className="public-eyebrow text-brand-primary">Agenda comunitaria</p>
            <h2 id="agenda-title" className="public-heading mt-2 text-brand-ink">Próximas actividades</h2>
            <p className="mt-3 max-w-2xl text-pretty text-brand-ink/75">Actividades publicadas oficialmente por la Asociación.</p>
          </div>
          <Link to="/eventos" className="inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Ver agenda completa</Link>
        </header>
        <div className="mt-8 max-w-5xl md:mt-10">
          {eventsQuery.isPending ? <LoadingState className="min-h-36 rounded-surface border border-brand-sage/80 bg-card-white px-6 shadow-sm" label="Cargando agenda comunitaria..." /> : null}
          {eventsQuery.isError ? <ErrorState className="border-brand-sage/80 px-6 py-6 shadow-sm" message={getErrorMessage(eventsQuery.error, 'No fue posible cargar la agenda comunitaria.')} action={<button className="min-h-11 rounded-control border border-border px-4 font-semibold focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" type="button" onClick={() => void eventsQuery.refetch()}>Reintentar</button>} /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && upcomingEvents.length === 0 ? <EmptyState className="mx-auto max-w-3xl border-brand-sage bg-card-white px-6 py-10 shadow-sm md:px-8 md:py-12" title="No hay actividades próximas publicadas" description="Cuando la Asociación publique una nueva actividad, podrá consultarla aquí." /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && upcomingEvents.length > 0 ? (
            <div className="border-y border-brand-sage/80">
              {upcomingEvents.map((event) => (
                <article key={event.publicId} className="grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] gap-x-4 gap-y-4 border-b border-brand-sage/70 py-5 last:border-b-0 md:grid-cols-[5.25rem_minmax(0,1fr)_auto] md:items-center md:gap-x-6 md:py-6">
                  <time dateTime={event.startAt} className="flex min-h-19 flex-col items-center justify-center rounded-control border border-brand-accent/45 bg-brand-accent/15 px-2 text-center text-brand-deep">
                    <span className="text-2xl font-bold leading-none">{formatDay(event.startAt)}</span>
                    <span className="mt-1 text-caption font-bold uppercase tracking-[0.12em]">{formatMonth(event.startAt)}</span>
                  </time>
                  <div className="min-w-0">
                    <h3 className="font-heading text-heading-3 font-semibold text-brand-ink"><Link to={`/eventos/${event.publicId}`} className="rounded-sm hover:text-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">{event.title}</Link></h3>
                    <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-body-small text-brand-ink/80">
                      <div className="flex min-w-0 items-center gap-2"><CalendarDays className="size-4 shrink-0 text-brand-primary" aria-hidden="true" /><dt className="sr-only">Fecha</dt><dd>{new Intl.DateTimeFormat('es-CR', { dateStyle: 'long' }).format(new Date(event.startAt))}</dd></div>
                      <div className="flex min-w-0 items-center gap-2"><Clock3 className="size-4 shrink-0 text-brand-primary" aria-hidden="true" /><dt className="sr-only">Hora</dt><dd>{formatTime(event.startAt)}</dd></div>
                      {event.location ? <div className="flex min-w-0 items-center gap-2"><MapPin className="size-4 shrink-0 text-brand-primary" aria-hidden="true" /><dt className="sr-only">Lugar</dt><dd>{event.location}</dd></div> : null}
                    </dl>
                  </div>
                  <Link aria-label={`Ver detalle de ${event.title}`} to={`/eventos/${event.publicId}`} className="col-start-2 mt-1 inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring md:col-start-3 md:mt-0 md:justify-self-end">
                    Ver detalle
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
