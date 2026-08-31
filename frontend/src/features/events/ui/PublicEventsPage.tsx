import { useEffect } from 'react'
import { CalendarDays, MapPin } from 'lucide-react'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { LoadingState } from '@/shared/ui/LoadingState'
import { usePublicEvents } from '../hooks/useEventsQueries'
import type { EventStatus } from '../model/events.types'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status: EventStatus) {
  return status === 'CANCELLED' ? 'Cancelado' : status === 'COMPLETED' ? 'Finalizado' : 'Programado'
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
    <section className="bg-brand-ivory py-14 md:py-20">
      <div className="public-container">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Agenda comunitaria</p>
          <h1 className="mt-3 font-heading text-heading-1 font-bold text-brand-ink">Eventos</h1>
          <p className="mt-4 text-body-large text-brand-ink/75">Consulte las actividades comunicadas oficialmente por la Asociación.</p>
        </header>
        <section aria-label="Eventos publicados" className="mt-10">
          {eventsQuery.isPending ? <LoadingState label="Cargando eventos publicados..." /> : null}
          {eventsQuery.isError ? <ErrorState message={getErrorMessage(eventsQuery.error, 'No fue posible cargar los eventos publicados.')} action={<button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => void eventsQuery.refetch()}>Reintentar</button>} /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && eventsQuery.data.length === 0 ? <EmptyState title="No hay eventos publicados en este momento" description="Cuando la Asociación publique una actividad, aparecerá en esta agenda." /> : null}
          {!eventsQuery.isPending && !eventsQuery.isError && eventsQuery.data.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {eventsQuery.data.map((event) => (
                <article key={event.publicId} className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-primary">{statusLabel(event.status)}</p>
                    {event.status === 'CANCELLED' ? <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">Cancelado</span> : null}
                  </div>
                  <h2 className="mt-4 font-heading text-heading-3 font-semibold text-brand-ink">{event.title}</h2>
                  <p className="mt-3 flex-1 text-body text-brand-ink/75">{event.summary}</p>
                  <dl className="mt-6 space-y-3 border-t border-border pt-5 text-body-small text-brand-ink/80">
                    <div className="flex gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" /><div><dt className="sr-only">Fecha y hora</dt><dd>{formatDate(event.startAt)}{event.endAt ? ` - ${formatDate(event.endAt)}` : ''}</dd></div></div>
                    {event.location ? <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" /><div><dt className="sr-only">Lugar</dt><dd>{event.location}</dd></div></div> : null}
                  </dl>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  )
}
