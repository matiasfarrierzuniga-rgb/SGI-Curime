import { useEffect } from 'react'
import { HeroSection } from '../components/HeroSection'
import { ValueStrip } from '../components/ValueStrip'
import { ServicesSection } from '../components/ServicesSection'
import { AboutSection } from '../components/AboutSection'
import { ProjectsNewsSection } from '../components/ProjectsNewsSection'

export function LandingPage() {
  useEffect(() => {
    document.title = 'SGI-Curime | ADI Curime'
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
      <ValueStrip />
      <ServicesSection />
      <AboutSection />
      <ProjectsNewsSection />
    </div>
  )
}
