import { Link } from 'react-router-dom'
import { site } from '@/content/publicSiteContent'
import { CurimeBrandAccent } from '@/shared/ui/brand/CurimeBrandAccent'

export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="relative overflow-hidden border-y border-brand-sage/70 bg-surface-muted py-12 md:py-16 xl:py-20">
      <CurimeBrandAccent className="absolute -bottom-10 -left-6 hidden size-36 opacity-15 md:block md:size-44 lg:-left-4 lg:size-52" />
      <div className="public-container relative grid gap-9 md:grid-cols-[minmax(13rem,4fr)_minmax(0,8fr)] md:gap-12 lg:gap-20 xl:gap-28">
        <div className="max-w-md">
          <p className="public-eyebrow text-brand-primary">
            Sobre Curime
          </p>
          <h2 id="about-title" className="public-heading mt-3 text-brand-ink">
            Un pueblo unido, un futuro compartido
          </h2>
        </div>
        <div className="grid gap-8 border-t border-brand-sage/80 pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0 lg:grid-cols-[minmax(0,7fr)_minmax(12rem,4fr)] lg:gap-10 lg:pl-12 xl:gap-14 xl:pl-16">
          <div className="flex max-w-[38rem] flex-col items-start">
            <p className="max-w-[56ch] text-body leading-relaxed text-brand-ink/80">
              La Asociación de Desarrollo Integral de Curime, en el corazón de la península de Nicoya, coordina esfuerzos vecinales para el desarrollo del distrito. Este sistema acompaña esa labor con información clara y gestiones digitales al servicio de la comunidad.
            </p>
            <p className="mt-6 max-w-[40ch] border-l-2 border-brand-accent pl-4 font-heading text-body-large leading-relaxed text-brand-ink/85">
              {site.slogan}
            </p>
            <Link
              to="/nosotros"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-control border-2 border-brand-deep px-6 py-3 text-center font-bold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Conozca la Asociación
            </Link>
          </div>
          <figure className="relative aspect-[5/4] overflow-hidden rounded-surface border border-brand-sage/80 bg-brand-ivory md:aspect-[4/5] lg:aspect-[5/6]">
            <figcaption className="absolute inset-x-0 bottom-0 border-t border-brand-sage/80 bg-brand-ivory/95 p-4 text-body-small leading-relaxed text-brand-ink/75">
              Fotografía institucional pendiente de autorización.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
