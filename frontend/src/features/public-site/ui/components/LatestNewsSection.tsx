import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LatestNewsSection() {
  return (
    <section aria-labelledby="latest-news-title" className="public-section bg-brand-ivory">
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
        <div className="mt-8 grid overflow-hidden rounded-surface border border-brand-sage/80 bg-card-white shadow-sm md:mt-10 md:grid-cols-[minmax(0,7fr)_minmax(16rem,5fr)]">
          <div className="p-6 md:p-8"><p className="public-eyebrow text-brand-primary">Información verificada</p><h3 className="mt-3 font-heading text-heading-2 font-normal text-brand-ink">Aún no hay noticias publicadas</h3><p className="mt-4 max-w-xl text-body leading-relaxed text-foreground-muted">Los comunicados y novedades aparecerán aquí cuando la Asociación los revise y autorice.</p><Link to="/noticias" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Consultar noticias <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          <div className="relative min-h-48 overflow-hidden bg-brand-deep"><img src="/images/public/home/community-curime-wide.webp" alt="Actividad comunitaria en la cancha de la comunidad." width="1600" height="900" loading="lazy" className="size-full object-cover opacity-75" /><span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-brand-deep/35 to-transparent" /></div>
        </div>
      </div>
    </section>
  )
}
