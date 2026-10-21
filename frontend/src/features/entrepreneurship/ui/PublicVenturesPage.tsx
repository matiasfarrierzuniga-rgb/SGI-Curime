import { useEffect, useState, type FormEvent } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/shared/lib/errors'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Input } from '@/shared/ui/input'
import { LoadingState } from '@/shared/ui/LoadingState'
import { Pagination } from '@/shared/ui/Pagination'
import { usePublicVentures } from '../hooks/usePublicVentures'
import type { PublicVenturesQuery } from '../model/publicVentures.types'

const PAGE_LIMIT = 12
const initialQuery: PublicVenturesQuery = { page: 1, limit: PAGE_LIMIT }

export function PublicVenturesPage() {
  const [query, setQuery] = useState(initialQuery)
  const [search, setSearch] = useState('')
  const venturesQuery = usePublicVentures(query)
  const hasSearch = Boolean(query.search)

  useEffect(() => {
    document.title = 'Emprendimientos | ADI Curime'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.append(meta)
    }
    meta.setAttribute('content', 'Directorio público de emprendimientos de Curime.')
  }, [])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setQuery({ page: 1, limit: PAGE_LIMIT, search: search.trim() || undefined })
  }

  const clearSearch = () => {
    setSearch('')
    setQuery(initialQuery)
  }

  return (
    <section className="bg-brand-ivory py-14 md:py-20">
      <div className="public-container">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Directorio comunitario</p>
          <h1 className="mt-3 font-heading text-heading-1 font-bold text-brand-ink">Emprendimientos</h1>
          <p className="mt-4 text-body-large text-brand-ink/75">Conozca los emprendimientos locales publicados por la Asociación.</p>
        </header>

        <form className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row" onSubmit={submitSearch} role="search">
          <label className="sr-only" htmlFor="venture-search">Buscar emprendimientos</label>
          <Input id="venture-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o descripción" />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-deep px-5 font-semibold text-brand-ivory transition-colors hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" type="submit"><Search className="size-4" aria-hidden="true" />Buscar</button>
          {hasSearch ? <button className="min-h-11 rounded-control border border-brand-deep px-4 font-semibold text-brand-deep transition-colors hover:bg-brand-ivory focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring" type="button" onClick={clearSearch}>Limpiar</button> : null}
        </form>

        <section aria-label="Emprendimientos publicados" className="mt-10">
          {venturesQuery.isPending ? <LoadingState label="Cargando emprendimientos publicados..." /> : null}
          {venturesQuery.isError ? <ErrorState message={getErrorMessage(venturesQuery.error, 'No fue posible cargar los emprendimientos publicados.')} action={<button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={() => void venturesQuery.refetch()}>Reintentar</button>} /> : null}
          {!venturesQuery.isPending && !venturesQuery.isError && venturesQuery.data.data.length === 0 ? <EmptyState title={hasSearch ? 'No hay emprendimientos para esta búsqueda' : 'No hay emprendimientos publicados en este momento'} description={hasSearch ? 'Pruebe con otro término o limpie la búsqueda.' : 'Cuando la Asociación publique un emprendimiento, aparecerá en este directorio.'} action={hasSearch ? <button className="min-h-11 rounded-md border border-border px-4 font-semibold" type="button" onClick={clearSearch}>Limpiar búsqueda</button> : undefined} /> : null}
          {!venturesQuery.isPending && !venturesQuery.isError && venturesQuery.data.data.length > 0 ? <>
            <p className="mb-5 text-body-small text-brand-ink/75" aria-live="polite">{venturesQuery.data.total} {venturesQuery.data.total === 1 ? 'emprendimiento publicado' : 'emprendimientos publicados'}</p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {venturesQuery.data.data.map((venture) => <article key={venture.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md focus-within:border-brand-primary focus-within:shadow-md">
                <h2 className="font-heading text-heading-3 font-semibold text-brand-ink"><Link className="rounded-sm hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary" to={`/ventures/${venture.id}`}>{venture.name}</Link></h2>
                {venture.offerDescription || venture.description ? <p className="mt-3 flex-1 text-body text-brand-ink/75">{venture.offerDescription ?? venture.description}</p> : <div className="flex-1" />}
                {venture.locationText ? <p className="mt-6 flex gap-3 border-t border-border pt-5 text-body-small text-brand-ink/80"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" /><span>{venture.locationText}</span></p> : null}
                <Link aria-label={`Ver detalle de ${venture.name}`} className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary" to={`/ventures/${venture.id}`}>Ver detalle</Link>
              </article>)}
            </div>
            <Pagination className="mt-8" label="Paginación de emprendimientos" page={venturesQuery.data.page} total={venturesQuery.data.total} limit={venturesQuery.data.limit} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
          </> : null}
        </section>
      </div>
    </section>
  )
}
