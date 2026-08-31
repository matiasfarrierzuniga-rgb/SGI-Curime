import { useEffect } from 'react'
import { HeroSection } from '../components/HeroSection'
import { ServicesSection } from '../components/ServicesSection'
import { AboutSection } from '../components/AboutSection'
import { TransparencySection } from '../components/TransparencySection'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'

export function LandingPage() {
  const { isAuthenticated } = useAuth()
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
      <ServicesSection />
      <TransparencySection />
      <AboutSection />
      <section aria-labelledby="portal-access-title" className="bg-brand-ivory py-20 md:py-24 xl:py-28">
        <div className="public-container border-y border-brand-deep/15 py-12 text-center md:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Acceso privado</p>
          <h2 id="portal-access-title" className="mx-auto mt-3 max-w-[24ch] font-heading text-heading-1 font-bold text-brand-ink">
            ¿Ya tiene acceso al Sistema de Gestión Integral?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-body-large text-brand-ink/75">
            Ingrese al SGI para utilizar las herramientas disponibles para su cuenta.
          </p>
          <Link
            to={isAuthenticated ? '/app' : '/login'}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-brand-deep px-6 py-3 font-bold text-brand-ivory transition-colors hover:bg-brand-primary"
          >
            {isAuthenticated ? 'Ir al SGI' : 'Ingresar al SGI'}
          </Link>
        </div>
      </section>
    </div>
  )
}
