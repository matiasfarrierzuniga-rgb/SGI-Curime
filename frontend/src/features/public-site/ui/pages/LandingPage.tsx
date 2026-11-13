import { useEffect } from 'react'
import { HeroSection } from '../components/HeroSection'
import { AboutSection } from '../components/AboutSection'
import { TransparencySection } from '../components/TransparencySection'
import { AgendaSection } from '../components/AgendaSection'
import { LatestNewsSection } from '../components/LatestNewsSection'
import { QuickLinksSection } from '../components/QuickLinksSection'

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
    <div className="overflow-clip bg-surface-page font-sans text-text-primary">
      <HeroSection />
      <QuickLinksSection />
      <AgendaSection />
      <AboutSection />
      <LatestNewsSection />
      <TransparencySection />
    </div>
  )
}
