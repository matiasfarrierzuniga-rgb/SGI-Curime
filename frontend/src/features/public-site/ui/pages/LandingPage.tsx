import { useEffect } from 'react'
import { HeroSection } from '../components/HeroSection'
import { ServicesSection } from '../components/ServicesSection'
import { AboutSection } from '../components/AboutSection'
import { TransparencySection } from '../components/TransparencySection'
import { AgendaSection } from '../components/AgendaSection'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingPage() {
  useEffect(() => {
    document.title = 'Portal comunitario | ADI Curime'
    const description = 'Portal comunitario de la Asociación de Desarrollo Integral de Curime, Nicoya, Guanacaste.'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.append(meta)
    }
    meta.setAttribute('content', description)
  }, [])

  return (
    <div className="overflow-clip bg-brand-ivory font-sans text-brand-ink">
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <section aria-labelledby="community-title" className="border-y border-brand-sage/70 bg-surface-muted py-12 md:py-16 xl:py-20">
        <div className="public-container grid gap-8 md:grid-cols-[minmax(14rem,5fr)_minmax(0,7fr)] md:items-center md:gap-12 lg:gap-20 xl:gap-28">
          <figure className="relative aspect-[5/4] overflow-hidden rounded-surface border border-brand-sage/80 bg-brand-ivory md:aspect-[4/5]">
            <div className="flex size-full items-end bg-background-subtle p-5">
              <figcaption className="max-w-[24ch] border-l-2 border-brand-accent pl-3 text-body-small leading-relaxed text-brand-ink/75">
                Fotografía comunitaria pendiente de autorización.
              </figcaption>
            </div>
          </figure>
          <div className="max-w-xl md:py-6">
            <p className="public-eyebrow text-brand-primary">Comunidad</p>
            <h2 id="community-title" className="public-heading mt-3 text-brand-ink">Un espacio para encontrarnos</h2>
            <p className="mt-4 max-w-[50ch] text-body leading-relaxed text-brand-ink/75">Conozca los canales públicos y espacios de participación de la Asociación.</p>
            <Link to="/comunidad" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-control border-2 border-brand-deep px-6 py-3 font-bold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
              Visitar comunidad <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <AgendaSection />
      <TransparencySection />
    </div>
  )
}
