import { useEffect } from 'react'
import { HeroSection } from '../components/HeroSection'
import { ServicesSection } from '../components/ServicesSection'
import { AboutSection } from '../components/AboutSection'
import { TransparencySection } from '../components/TransparencySection'
import { AgendaSection } from '../components/AgendaSection'
import { LatestNewsSection } from '../components/LatestNewsSection'
import { QuickLinksSection } from '../components/QuickLinksSection'
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
      <QuickLinksSection />
      <LatestNewsSection />
      <AboutSection />
      <ServicesSection />
      <section aria-labelledby="community-title" className="border-y border-brand-sage/70 bg-surface-muted py-12 md:py-16 lg:flex lg:min-h-[min(44rem,calc(100svh-var(--size-header-desktop)))] lg:min-h-[min(44rem,calc(100dvh-var(--size-header-desktop)))] lg:items-center xl:py-20">
        <div className="public-container grid gap-8 md:gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-20 xl:gap-28">
          <figure className="order-2 relative aspect-[4/3] overflow-hidden rounded-surface border border-brand-sage/80 bg-brand-ivory shadow-sm lg:order-1 lg:aspect-[3/2]">
            <picture className="block size-full">
              <source media="(max-width: 767px)" srcSet="/images/public/home/community-curime-mobile.webp" type="image/webp" />
              <source srcSet="/images/public/home/community-curime-wide.webp" type="image/webp" />
              <img src="/images/public/home/community-curime-fallback.jpg" alt="Actividad comunitaria en la cancha de la comunidad." width="1500" height="1000" loading="lazy" className="size-full object-cover object-[50%_42%]" />
            </picture>
          </figure>
          <div className="order-1 max-w-xl md:py-6 lg:order-2">
            <p className="public-eyebrow text-brand-primary">Comunidad</p>
            <h2 id="community-title" className="public-heading mt-3 text-brand-ink">Un espacio para encontrarnos</h2>
            <p className="mt-4 max-w-[50ch] text-pretty text-body leading-relaxed text-brand-ink/75">Conozca los espacios, actividades e iniciativas que fortalecen la participación y el encuentro en Curime.</p>
            <Link to="/comunidad" className="group mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-control border-2 border-brand-deep px-6 py-3 font-bold text-brand-deep transition-[background-color,color,box-shadow] duration-200 hover:bg-brand-deep hover:text-brand-ivory hover:shadow-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
              Visitar comunidad <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <AgendaSection />
      <TransparencySection />
    </div>
  )
}
