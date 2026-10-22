import { ArrowRight, BriefcaseBusiness } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePublicVentures } from '@/features/entrepreneurship'

export function FeaturedVenturesSection() {
  const venturesQuery = usePublicVentures({ page: 1, limit: 3 })
  const ventures = venturesQuery.data?.data ?? []

  return (
    <section aria-labelledby="ventures-title" className="border-t border-brand-sage/60 bg-surface-muted py-14 md:py-20">
      <div className="public-container grid gap-8 lg:grid-cols-[minmax(15rem,3fr)_minmax(0,9fr)] lg:gap-12">
        <header className="max-w-sm">
          <p className="public-eyebrow text-brand-primary">Emprendimientos destacados</p>
          <h2 id="ventures-title" className="public-heading mt-3 text-brand-ink">Talento local que impulsa Curime</h2>
          <p className="mt-4 text-pretty text-body leading-relaxed text-brand-ink/75">Conozca emprendimientos publicados por nuestra comunidad.</p>
          <Link to="/ventures" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-primary hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Ver emprendimientos <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </header>
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {ventures.slice(0, 3).map((venture) => (
            <article key={venture.id} className="overflow-hidden rounded-surface border border-brand-sage/70 bg-card-white shadow-sm">
              <div aria-hidden="true" className="grid aspect-[3/2] place-items-center bg-surface-muted text-brand-primary"><BriefcaseBusiness className="size-7" /></div>
              <div className="p-4"><h3 className="font-heading text-heading-3 text-brand-ink"><Link to={`/ventures/${venture.id}`} className="hover:text-brand-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">{venture.name}</Link></h3><p className="mt-2 line-clamp-2 text-body-small text-brand-ink/70">{venture.offerDescription ?? venture.description ?? 'Información disponible en el directorio comunitario.'}</p></div>
            </article>
          ))}
          {!venturesQuery.isPending && ventures.length === 0 ? <div className="rounded-surface border border-dashed border-brand-sage bg-card-white p-5 text-body-small leading-relaxed text-brand-ink/75 sm:col-span-2 xl:col-span-3">Aún no hay emprendimientos publicados. El directorio estará disponible cuando la Asociación autorice sus publicaciones.</div> : null}
        </div>
      </div>
    </section>
  )
}
