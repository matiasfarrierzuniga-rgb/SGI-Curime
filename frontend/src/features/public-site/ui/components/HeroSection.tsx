import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="public-section bg-brand-ivory pt-14 md:pt-16 lg:pt-20">
      <div className="public-container grid items-center gap-10 md:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] md:gap-12 lg:gap-16 xl:gap-24">
        <div className="flex min-w-0 flex-col md:self-center">
          <p className="public-eyebrow text-brand-primary">
            Curime • Nicoya, Guanacaste
          </p>
          <h1
            id="hero-title"
            className="public-heading mt-4 max-w-[16ch] text-display tracking-[-0.02em] text-brand-ink"
          >
            Información, participación y servicios para Curime
          </h1>
          <p className="mt-6 max-w-[58ch] text-body-large leading-relaxed text-brand-ink/75 lg:mt-7">
            Plataforma digital de la Asociación de Desarrollo Integral de Curime para consultar información, participar en la comunidad y acceder a servicios habilitados.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:mt-9 lg:gap-4">
            <Link
              to="/comunidad"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-brand-primary px-6 py-3 text-center font-bold text-brand-ivory transition-colors hover:bg-brand-brown focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
            >
              Conozca la comunidad
            </Link>
            <Link
              to="/servicios"
              className="inline-flex min-h-12 items-center justify-center rounded-md border-2 border-brand-deep px-6 py-3 text-center font-bold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
            >
              Ver servicios comunitarios
            </Link>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="relative aspect-[16/9] w-full justify-self-stretch overflow-hidden rounded-[1.5rem_4.5rem_1.5rem_1.5rem] bg-brand-deep md:aspect-square md:rounded-[2rem_6rem_2rem_2rem] lg:aspect-[5/4] xl:aspect-[6/5] xl:rounded-[2.5rem_8rem_2.5rem_2.5rem]"
        >
          <span className="absolute -bottom-[38%] -right-[14%] aspect-square w-[82%] rotate-[-8deg] rounded-[42%_58%_48%_52%] bg-brand-soft" />
          <span className="absolute right-[14%] top-[14%] aspect-square w-[clamp(3.5rem,8vw,6rem)] rotate-12 rounded-[62%_38%_55%_45%] bg-brand-accent" />
        </div>
      </div>
    </section>
  )
}
