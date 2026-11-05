import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Pagination } from '@/shared/ui/Pagination'
import { usePublicOpportunities } from '../hooks/usePublicOpportunities'
import type { PublicOpportunitiesQuery } from '../model/publicOpportunities.types'

const initialQuery: PublicOpportunitiesQuery = { page: 1, limit: 12 }

export function PublicOpportunitiesPage() {
  const [query, setQuery] = useState(initialQuery)
  const [search, setSearch] = useState('')
  const opportunities = usePublicOpportunities(query)

  useEffect(() => { document.title = 'Voluntariado | ADI Curime' }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setQuery({ ...initialQuery, search: search.trim() || undefined })
  }

  return <section className="bg-brand-ivory py-14 md:py-20"><div className="public-container">
    <header className="max-w-3xl"><p className="public-eyebrow text-brand-primary">Participación comunitaria</p><h1 className="public-heading mt-3 text-brand-ink">Voluntariado</h1><p className="mt-4 text-body-large text-brand-ink/75">Conozca las oportunidades publicadas por la Asociación.</p></header>
    <form role="search" onSubmit={submit} className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="volunteer-search">Buscar oportunidades</label><Input id="volunteer-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar oportunidades" /><button type="submit" className="min-h-11 rounded-control bg-brand-deep px-5 font-semibold text-brand-ivory hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Buscar</button>{query.search ? <button type="button" onClick={() => { setSearch(''); setQuery(initialQuery) }} className="min-h-11 rounded-control border border-brand-deep px-4 font-semibold text-brand-deep focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Limpiar</button> : null}</form>
    <section aria-label="Oportunidades publicadas" className="mt-10">
      {opportunities.isPending ? <LoadingState label="Cargando oportunidades..." /> : null}
      {opportunities.isError ? <ErrorState title="No fue posible cargar las oportunidades" message={getErrorMessage(opportunities.error)} action={<button type="button" onClick={() => void opportunities.refetch()} className="min-h-11 rounded-control border border-border px-4 font-semibold">Reintentar</button>} /> : null}
      {opportunities.data?.data.length === 0 ? <EmptyState title="No hay oportunidades publicadas" description="Las oportunidades aparecerán aquí cuando la Asociación las publique." /> : null}
      {opportunities.data && opportunities.data.data.length > 0 ? <><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{opportunities.data.data.map(item => <article key={item.id} className="flex flex-col rounded-surface border border-border bg-white p-6 shadow-sm"><h2 className="text-heading-3 font-semibold text-brand-ink"><Link to={`/voluntariado/${item.id}`} className="hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{item.title}</Link></h2>{item.description ? <p className="mt-3 line-clamp-3 flex-1 text-body text-brand-ink/75">{item.description}</p> : null}{item.location ? <p className="mt-5 text-body-small text-brand-ink/75">{item.location}</p> : null}<Link to={`/voluntariado/${item.id}`} className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Ver detalle</Link></article>)}</div><Pagination className="mt-8" label="Paginación de oportunidades" page={opportunities.data.page} total={opportunities.data.total} limit={opportunities.data.limit} onChange={page => setQuery(current => ({ ...current, page }))} /></> : null}
    </section>
  </div></section>
}
