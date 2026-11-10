import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LatestNewsSection() {
  return (
    <section aria-labelledby="latest-news-title" className="public-section bg-[#f3eee3]">
      <div className="public-container">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="max-w-2xl">
            <p className="public-eyebrow text-brand-primary">Actualidad</p>
            <h2 id="latest-news-title" className="public-heading mt-3 text-brand-ink">Lo más reciente</h2>
            <p className="mt-4 max-w-[54ch] text-body leading-relaxed text-brand-ink/75">Información y comunicados compartidos con la comunidad de Curime.</p>
          </div>
          <Link to="/noticias" className="group inline-flex min-h-11 items-center gap-2 self-start font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring md:self-auto">
            Ver todo <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
          </Link>
        </header>
        <div className="mt-8 grid overflow-hidden rounded-surface border border-dashed border-brand-sage bg-[#fffcf5] shadow-sm md:mt-10 md:grid-cols-[minmax(0,1fr)_minmax(15rem,.65fr)]">
          <div className="p-6 md:p-8"><p className="public-eyebrow text-brand-primary">Información verificada</p><h3 className="mt-3 font-heading text-heading-2 font-normal text-brand-ink">Aún no hay noticias publicadas</h3><p className="mt-4 max-w-xl text-body leading-relaxed text-foreground-muted">Los comunicados y novedades aparecerán aquí cuando la Asociación los revise y autorice.</p><Link to="/noticias" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Consultar noticias <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          <div className="flex min-h-44 items-end border-t border-brand-sage/70 bg-brand-deep p-6 text-brand-ivory md:min-h-full md:border-l md:border-t-0"><p className="max-w-[18ch] font-heading text-heading-2 leading-tight">Las publicaciones oficiales aparecerán en este espacio.</p></div>
        </div>
      </div>
    </section>
  )
}
