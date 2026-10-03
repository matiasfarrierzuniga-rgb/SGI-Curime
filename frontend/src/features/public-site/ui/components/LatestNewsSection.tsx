import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { news } from '@/content/publicSiteContent'

const latestNews = [
  {
    ...news[0],
    image: '/images/public/home/community-curime-wide.webp',
    imageAlt: 'Actividad comunitaria en la cancha de la comunidad.',
    to: `/noticias/${news[0].slug}`,
  },
  {
    category: 'Próximamente',
    date: 'Próximamente',
    title: 'Noticias de la comunidad',
    excerpt: 'Las novedades verificadas de Curime se publicarán en este espacio.',
    image: '/images/public/home/hero-curime-wide.webp',
    imageAlt: 'Paisaje rural de Curime.',
    to: '/noticias',
  },
  {
    category: 'Institucional',
    date: 'Próximamente',
    title: 'Comunicados de la Asociación',
    excerpt: 'Consulte aquí los comunicados oficiales cuando sean publicados.',
    image: '/images/public/home/community-curime-mobile.webp',
    imageAlt: 'Actividad comunitaria en Curime.',
    to: '/noticias',
  },
] as const

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
        <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {latestNews.map((item, index) => {
            const isTabletFeature = index === latestNews.length - 1

            return (
              <article key={item.title} className={`group flex min-w-0 flex-col overflow-hidden rounded-surface border border-brand-sage/80 bg-card-white shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-primary hover:shadow-md focus-within:border-brand-primary focus-within:shadow-md motion-reduce:transform-none ${isTabletFeature ? 'md:col-span-2 md:flex-row lg:col-span-1 lg:flex-col' : ''}`}>
                <div className={`relative aspect-[16/9] overflow-hidden bg-surface-muted ${isTabletFeature ? 'md:w-[42%] md:shrink-0 md:self-stretch md:aspect-auto lg:w-full lg:aspect-[16/9]' : ''}`}>
                  <img src={item.image} alt={item.imageAlt} width="1600" height="900" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none" />
                  <span className="absolute left-4 top-4 rounded-control bg-brand-ivory/95 px-3 py-1 text-caption font-bold uppercase tracking-[0.12em] text-brand-primary shadow-sm">{item.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <p className="text-caption font-bold uppercase tracking-[0.12em] text-brand-primary">{item.date}</p>
                  <h3 className="mt-3 font-heading text-heading-2 font-normal text-brand-ink">
                    <Link to={item.to} className="rounded-sm transition-colors hover:text-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">{item.title}</Link>
                  </h3>
                  <p className="mt-3 flex-1 text-body-small leading-relaxed text-brand-ink/75">{item.excerpt}</p>
                  <Link to={item.to} className="group/link mt-6 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
                    Leer más <ArrowRight className="size-4 transition-transform duration-200 group-hover/link:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
                    <span className="sr-only">: {item.title}</span>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
