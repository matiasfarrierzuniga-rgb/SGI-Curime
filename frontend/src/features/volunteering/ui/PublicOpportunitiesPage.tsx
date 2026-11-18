import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Pagination } from '@/shared/ui/Pagination'
import { PublicPageContent, PublicPageHeader } from '@/shared/ui/PublicPageLayout'
import { usePublicOpportunities } from '../hooks/usePublicOpportunities'
import type { PublicOpportunitiesQuery } from '../model/publicOpportunities.types'

const initialQuery: PublicOpportunitiesQuery = { page: 1, limit: 12 }
const deadlineFormatter = new Intl.DateTimeFormat('es-CR', { dateStyle: 'long' })

function formatDeadline(value: string) {
  return deadlineFormatter.format(new Date(value))
}

export function PublicOpportunitiesPage() {
  const [query, setQuery] = useState(initialQuery)
  const [search, setSearch] = useState('')
  const opportunities = usePublicOpportunities(query)
  const isEmpty = !opportunities.isPending && !opportunities.isError && opportunities.data?.data.length === 0
  const emptyDescription = query.search
    ? `No hay oportunidades publicadas que coincidan con “${query.search}”. Pruebe otro término o use el botón “Limpiar” para ver todas las oportunidades.`
    : 'Actualmente no hay oportunidades de voluntariado publicadas. Consulte nuevamente más adelante.'

  useEffect(() => { document.title = 'Voluntariado | ADI Curime' }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setQuery({ ...initialQuery, search: search.trim() || undefined })
  }

  return <>
    <PublicPageHeader breadcrumb="Voluntariado" eyebrow="Participación comunitaria" title="Voluntariado" intro="Conozca las oportunidades publicadas por la Asociación." image={{ src: '/images/public/home/community-curime-wide.webp', mobileSrc: '/images/public/home/community-curime-mobile.webp', alt: 'Actividad comunitaria en Curime.' }} />
    <PublicPageContent className="min-w-0 bg-surface-page" spacing="spacious">
      <form role="search" onSubmit={submit} className="flex w-full max-w-2xl min-w-0 flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="volunteer-search">Buscar oportunidades</label>
        <Input className="min-w-0 flex-1" id="volunteer-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar oportunidades" />
        <button type="submit" className="min-h-11 shrink-0 rounded-control bg-brand-deep px-5 font-semibold text-white transition-colors hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Buscar</button>
        {query.search ? <button type="button" onClick={() => { setSearch(''); setQuery(initialQuery) }} className="min-h-11 shrink-0 rounded-control border border-brand-deep px-4 font-semibold text-brand-deep transition-colors hover:bg-surface-page focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Limpiar</button> : null}
      </form>

      <section aria-label="Oportunidades publicadas" className="mt-8 min-w-0 md:mt-10">
        {opportunities.isPending ? <LoadingState className="rounded-surface border border-border bg-surface-card p-6" label="Cargando oportunidades..." /> : null}
        {opportunities.isError ? <ErrorState title="No fue posible cargar las oportunidades" message={getErrorMessage(opportunities.error)} action={<button type="button" onClick={() => void opportunities.refetch()} className="min-h-11 rounded-control border border-border px-4 font-semibold">Reintentar</button>} /> : null}
        {isEmpty ? <div role="status" aria-live="polite" className="min-w-0"><EmptyState className="mx-auto w-full min-w-0 max-w-2xl border-brand-accent/25 p-5 sm:p-7 [&>h2]:break-words [&>p]:break-words" title={query.search ? 'No encontramos coincidencias' : 'No hay oportunidades por ahora'} description={emptyDescription} /></div> : null}
        {!opportunities.isPending && !opportunities.isError && opportunities.data && opportunities.data.data.length > 0 ? <>
          <p className="mb-5 text-body-small text-text-primary/75" aria-live="polite">{opportunities.data.total} {opportunities.data.total === 1 ? 'oportunidad publicada' : 'oportunidades publicadas'}</p>
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.data.data.map(item => <article key={item.id} className="flex h-full min-w-0 flex-col rounded-surface border border-border bg-surface-card p-5 shadow-sm transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none hover:border-brand-primary hover:shadow-md md:p-6">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 flex-1 font-heading text-heading-3 font-semibold text-text-primary"><Link to={`/voluntariado/${item.id}`} className="break-words text-pretty hover:text-brand-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{item.title}</Link></h2>
                {item.acceptingApplications !== undefined ? <Badge variant={item.acceptingApplications ? 'success' : 'neutral'} className="max-w-full whitespace-normal text-left">{item.acceptingApplications ? 'Postulaciones abiertas' : 'Convocatoria cerrada'}</Badge> : null}
              </div>
              {item.description ? <p className="mt-3 min-w-0 flex-1 break-words text-pretty text-body leading-relaxed text-text-primary/75">{item.description}</p> : <div className="flex-1" />}
              {item.location || item.applicationDeadline ? <dl className="mt-5 grid min-w-0 gap-3 border-t border-border pt-4 text-body-small text-text-primary/75">
                {item.location ? <div className="min-w-0"><dt className="font-semibold text-text-primary">Ubicación</dt><dd className="break-words">{item.location}</dd></div> : null}
                {item.applicationDeadline ? <div className="min-w-0"><dt className="font-semibold text-text-primary">Fecha límite</dt><dd className="break-words">{formatDeadline(item.applicationDeadline)}</dd></div> : null}
              </dl> : null}
              <Link to={`/voluntariado/${item.id}`} aria-label={`Ver detalle de ${item.title}`} className="mt-5 inline-flex min-h-11 w-fit max-w-full items-center break-words font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Ver detalle</Link>
            </article>)}
          </div>
          <Pagination className="mt-8" label="Paginación de oportunidades" page={opportunities.data.page} total={opportunities.data.total} limit={opportunities.data.limit} onChange={page => setQuery(current => ({ ...current, page }))} />
        </> : null}
      </section>

      <aside className="mt-10 grid gap-4 border-t border-border/70 pt-7 md:grid-cols-[auto_minmax(0,1fr)]"><span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-brand-accent/20 font-heading text-brand-deep">1</span><div><p className="public-eyebrow text-brand-primary">Proceso de participación</p><h2 className="mt-2 font-heading text-heading-2 text-text-primary">Las postulaciones se revisan</h2><p className="mt-2 max-w-2xl text-body leading-relaxed text-foreground-muted">Cada oportunidad publicada explica cómo participar. Enviar una postulación no confirma automáticamente una asignación.</p></div></aside>
    </PublicPageContent>
  </>
}
