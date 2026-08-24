import { Link } from 'react-router-dom'
import { site } from '@/content/publicSiteContent'

export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="bg-brand-ivory py-20 md:py-28">
      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-4 min-[375px]:px-6 md:grid-cols-[45fr_55fr] md:gap-16">
        <div
          aria-hidden="true"
          className="relative min-h-[260px] overflow-hidden rounded-[2rem] bg-brand-soft/40 md:min-h-[380px]"
        >
          <span className="absolute right-[12%] top-[14%] aspect-square w-24 rounded-full bg-brand-accent/80" />
          <span className="absolute -bottom-[24%] -left-[20%] aspect-[1.8] w-[130%] -rotate-[7deg] rounded-[50%_50%_0_0] bg-brand-primary/85" />
          <span className="absolute -bottom-[30%] -right-[30%] aspect-[1.8] w-[120%] -rotate-[7deg] rounded-[50%_50%_0_0] bg-brand-deep/90" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">
            Sobre Curime
          </p>
          <h2
            id="about-title"
            className="mt-3 font-display text-4xl font-normal leading-tight text-brand-ink md:text-5xl"
          >
            Un pueblo unido, un futuro compartido
          </h2>
          <p className="mt-6 max-w-[52ch] leading-relaxed text-brand-ink/75">
            La Asociación de Desarrollo Integral de Curime, en el corazón de la península de Nicoya, coordina esfuerzos vecinales para el desarrollo del distrito. Este sistema acompaña esa labor con información clara y gestiones digitales al servicio de la comunidad.
          </p>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-brand-ink/60">
            {site.slogan}
          </p>
          <Link
            to="/nosotros"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-md border-2 border-brand-deep px-6 font-bold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory"
          >
            Conozca la Asociación
          </Link>
        </div>
      </div>
    </section>
  )
}
