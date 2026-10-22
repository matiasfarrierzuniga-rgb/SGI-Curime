import { Link } from 'react-router-dom'
import { site } from '@/content/publicSiteContent'
import { CurimeBrandAccent } from '@/shared/ui/brand/CurimeBrandAccent'
import { Eye } from 'lucide-react'

export function AboutSection() {
  return (
    <section aria-labelledby="about-title" className="relative overflow-hidden border-y border-brand-sage/70 bg-surface-muted py-12 md:py-16 lg:flex lg:min-h-[min(44rem,calc(100svh-var(--size-header-desktop)))] lg:min-h-[min(44rem,calc(100dvh-var(--size-header-desktop)))] lg:items-center xl:py-20">
      <CurimeBrandAccent className="absolute -bottom-10 -left-6 hidden size-36 opacity-15 md:block md:size-44 lg:-left-4 lg:size-52" />
      <div className="public-container relative grid gap-8 md:gap-10 lg:grid-cols-[minmax(13rem,4fr)_minmax(0,8fr)] lg:gap-20 xl:gap-28">
        <div className="max-w-md">
          <p className="public-eyebrow text-brand-primary">
            Nuestra Asociación
          </p>
          <h2 id="about-title" className="public-heading mt-3 text-brand-ink">
            Un pueblo unido, un futuro compartido
          </h2>
        </div>
        <div className="grid gap-8 border-t border-brand-sage/80 pt-8 md:gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(12rem,4fr)] lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 xl:gap-14 xl:pl-16">
          <div className="flex max-w-[38rem] flex-col items-start">
            <p className="max-w-[56ch] text-pretty text-body leading-relaxed text-brand-ink/80">
              La Asociación de Desarrollo Integral de Curime, en el corazón de la península de Nicoya, coordina esfuerzos vecinales para el desarrollo del distrito. Este sistema acompaña esa labor con información clara y gestiones digitales al servicio de la comunidad.
            </p>
            <p className="mt-6 max-w-[40ch] border-l-2 border-brand-accent pl-4 font-heading text-body-large leading-relaxed text-brand-ink/85">
              {site.slogan}
            </p>
            <Link
              to="/nosotros"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-control border-2 border-brand-deep px-6 py-3 text-center font-bold text-brand-deep transition-[background-color,color,box-shadow] duration-200 hover:bg-brand-deep hover:text-brand-ivory hover:shadow-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Conozca la Asociación
            </Link>
          </div>
          <div className="grid gap-4">
            <figure className="relative aspect-[2/1] overflow-hidden rounded-surface border border-brand-sage/80 bg-background-subtle shadow-sm">
              <figcaption className="absolute inset-x-0 bottom-0 border-t border-brand-sage/80 bg-brand-ivory/95 p-4 text-body-small leading-relaxed text-brand-ink/75">Fotografía institucional pendiente de autorización.</figcaption>
            </figure>
            <aside className="rounded-surface border border-brand-sage/80 bg-brand-ivory p-5 shadow-sm">
              <Eye className="size-6 text-brand-primary" aria-hidden="true" />
              <h3 className="mt-3 font-heading text-heading-3 text-brand-ink">Transparencia y rendición de cuentas</h3>
              <p className="mt-2 text-body-small leading-relaxed text-brand-ink/75">Acceda a información pública de la Asociación.</p>
              <Link to="/transparencia" className="mt-4 inline-flex min-h-11 items-center rounded-control bg-brand-deep px-4 text-body-small font-bold text-brand-ivory hover:bg-brand-primary focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">Ir a transparencia</Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
