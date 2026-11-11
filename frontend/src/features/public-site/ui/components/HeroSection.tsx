import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-brand-sage/70 bg-surface-muted py-0">
      <div className="relative z-10 grid min-w-0 gap-0 px-4 sm:px-5 md:px-6 lg:grid-cols-2 lg:px-0 lg:items-stretch">
        <div className="relative z-10 flex min-w-0 flex-col justify-center px-1 py-12 sm:py-16 lg:py-20 lg:pl-[max(2rem,calc((100vw-var(--container-max))/2+2rem))] lg:pr-12 xl:pl-[max(3rem,calc((100vw-var(--container-max))/2+3rem))] xl:pr-20">
          <p className="public-eyebrow text-brand-primary">
            CURIME · NICOYA · GUANACASTE
          </p>
          <h1 id="hero-title" className="public-heading mt-4 max-w-[14ch] text-display tracking-[-0.025em] text-brand-ink">
            Curime, más cerca de su comunidad
          </h1>
          <p className="mt-5 w-full max-w-[calc(100vw-2.5rem)] text-pretty text-body-large leading-relaxed text-brand-ink/75 md:max-w-[48ch]">
            La Asociación de Desarrollo Integral de Curime pone a disposición de la comunidad un espacio para informarse, participar y realizar las gestiones disponibles.
          </p>
          <div className="mt-8 flex w-full max-w-[calc(100vw-2.5rem)] flex-col gap-3 md:max-w-none md:flex-row md:flex-wrap lg:mt-9 lg:gap-4">
            <Link
              to="/servicios"
              className="inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-6 py-3 text-center font-bold text-primary-foreground shadow-md transition-[background-color,box-shadow] hover:bg-interaction-primary-hover hover:shadow-lg focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Explorar servicios
            </Link>
            <Link
              to="/nosotros"
              className="inline-flex min-h-12 items-center justify-center rounded-control border-2 border-primary bg-brand-ivory px-6 py-3 text-center font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Conocer la Asociación
            </Link>
          </div>
        </div>
        <figure className="relative min-h-64 w-full min-w-0 overflow-hidden rounded-surface border border-brand-sage/70 bg-surface-muted shadow-surface md:min-h-80 lg:min-h-full lg:rounded-none lg:border-0 lg:shadow-none">
          <picture className="absolute inset-0 block">
            <source media="(max-width: 767px)" srcSet="/images/public/home/hero-curime-mobile.webp" />
            <source srcSet="/images/public/home/hero-curime-wide.webp" />
            <img
              src="/images/public/home/hero-curime-fallback.jpg"
              alt="Paisaje rural con un gran árbol, potrero y cerca de madera."
              width="1600"
              height="1200"
              fetchPriority="high"
              loading="eager"
              className="size-full object-cover object-[58%_59%]"
            />
          </picture>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-brand-ink/25 to-transparent lg:hidden" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[30%] bg-gradient-to-r from-surface-muted via-surface-muted/70 to-transparent lg:block" />
        </figure>
      </div>
    </section>
  )
}
