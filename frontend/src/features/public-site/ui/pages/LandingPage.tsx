import { useEffect } from 'react'
import { HeroSection } from '../components/HeroSection'
import { ServicesSection } from '../components/ServicesSection'
import { AboutSection } from '../components/AboutSection'
import { TransparencySection } from '../components/TransparencySection'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'

export function LandingPage() {
  const { isAuthenticated, user } = useAuth()
  const accessTo = !isAuthenticated ? '/login' : user?.canAccessErp ? '/app' : '/servicios'
  const accessLabel = !isAuthenticated ? 'Iniciar sesión' : user?.canAccessErp ? 'Ir al panel' : 'Ver servicios'
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
      <section aria-labelledby="portal-access-title" className="border-t border-brand-sage/70 bg-surface-muted/55 py-14 md:py-20 xl:py-24">
        <div className="public-container max-w-5xl border-y border-brand-deep/15 py-10 text-center md:py-12">
          <p className="public-eyebrow text-brand-primary">Acceso privado</p>
          <h2 id="portal-access-title" className="public-heading mx-auto mt-3 max-w-[24ch] text-brand-ink">
            ¿Ya tiene acceso al Sistema de Gestión Integral?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-body-large text-brand-ink/80">
            Ingrese al SGI para utilizar las herramientas disponibles para su cuenta.
          </p>
          <Link
            to={accessTo}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-brand-deep px-6 py-3 font-bold text-brand-ivory shadow-sm transition-[background-color,box-shadow] hover:bg-brand-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
          >
            {accessLabel}
          </Link>
        </div>
      </section>
    </div>
  )
}
