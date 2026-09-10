import { Link } from 'react-router-dom'
import { site } from '@/content/publicSiteContent'

export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="border-t border-brand-sage/70 bg-brand-ivory py-12 md:py-16 xl:py-20">
      <div className="public-container grid gap-9 md:grid-cols-[minmax(13rem,5fr)_minmax(0,7fr)] md:gap-12 lg:gap-20 xl:gap-28">
        <div className="max-w-lg">
          <p className="public-eyebrow text-brand-primary">
            Sobre Curime
          </p>
          <h2 id="about-title" className="public-heading mt-3 text-brand-ink">
            Un pueblo unido, un futuro compartido
          </h2>
        </div>
        <div className="max-w-2xl md:border-l md:border-brand-sage md:pl-8 lg:pl-12 xl:pl-16">
          <p className="max-w-[56ch] leading-relaxed text-brand-ink/80">
            La Asociación de Desarrollo Integral de Curime, en el corazón de la península de Nicoya, coordina esfuerzos vecinales para el desarrollo del distrito. Este sistema acompaña esa labor con información clara y gestiones digitales al servicio de la comunidad.
          </p>
          <p className="mt-5 max-w-[52ch] border-l-2 border-brand-accent pl-4 font-heading leading-relaxed text-brand-ink/80">
            {site.slogan}
          </p>
          <Link
            to="/nosotros"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md border-2 border-brand-deep px-6 py-3 text-center font-bold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
          >
            Conozca la Asociación
          </Link>
        </div>
      </div>
    </section>
  )
}
