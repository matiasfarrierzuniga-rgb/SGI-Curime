import { Link } from 'react-router-dom'
import { site } from '@/content/publicSiteContent'

export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="relative overflow-hidden border-y border-border/70 bg-surface-card py-12 md:py-16 xl:py-20">
      <div className="public-container relative grid gap-8 md:gap-10 lg:grid-cols-[minmax(13rem,4fr)_minmax(0,8fr)] lg:gap-20 xl:gap-28">
        <div className="max-w-md">
          <p className="public-eyebrow text-brand-primary">
            Nuestra Asociación
          </p>
          <h2 id="about-title" className="public-heading mt-3 text-text-primary">
            Un pueblo unido, un futuro compartido
          </h2>
        </div>
        <div className="grid gap-8 border-t border-border/80 pt-8 md:gap-10 lg:grid-cols-[minmax(0,.85fr)_minmax(12rem,1.15fr)] lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 xl:gap-14 xl:pl-16">
          <div className="flex max-w-[38rem] flex-col items-start">
            <p className="max-w-[56ch] text-pretty text-body leading-relaxed text-text-primary/80">
              La Asociación de Desarrollo Integral de Curime, en el corazón de la península de Nicoya, coordina esfuerzos vecinales para el desarrollo del distrito. Este sistema acompaña esa labor con información clara y gestiones digitales al servicio de la comunidad.
            </p>
            <p className="mt-6 max-w-[40ch] border-l-2 border-brand-accent pl-4 font-heading text-body-large leading-relaxed text-text-primary/85">
              {site.slogan}
            </p>
            <Link
              to="/nosotros"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-control border-2 border-brand-deep px-6 py-3 text-center font-bold text-brand-deep transition-[background-color,color,box-shadow] duration-200 hover:bg-brand-deep hover:text-white hover:shadow-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Conozca la Asociación
            </Link>
          </div>
          <figure className="relative aspect-[5/4] overflow-hidden rounded-surface border border-border/80 bg-background-subtle shadow-sm md:aspect-[3/2] lg:aspect-[5/6]">
            <picture className="block size-full"><source media="(max-width: 767px)" srcSet="/images/public/home/community-curime-mobile.webp" type="image/webp" /><img src="/images/public/home/community-curime-wide.webp" alt="Actividad comunitaria en Curime." width="1500" height="1000" className="size-full object-cover" /></picture>
            <figcaption className="absolute inset-x-0 bottom-0 border-t border-border/80 bg-surface-page/95 p-4 text-body-small leading-relaxed text-text-primary/75">Imagen institucional de la vida comunitaria en Curime.</figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
