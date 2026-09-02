import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'
import { homePathForRole } from '@/shared/security/roles'

export function PublicFooter() {
  const { isAuthenticated, user } = useAuth()
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        className="-mb-px block h-12 w-full text-brand-ink md:h-16"
      >
        <path
          fill="currentColor"
          d="M0,40 C180,64 360,8 540,16 C720,24 900,60 1080,52 C1260,44 1350,20 1440,28 L1440,64 L0,64 Z"
        />
      </svg>
      <footer className="bg-brand-ink pt-8 font-sans text-brand-ivory">
        <div className="public-container grid gap-10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-14 xl:gap-20 xl:pb-16">
          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-[50%_50%_45%_45%] bg-brand-accent font-heading text-xl font-bold text-brand-ink"
              >
                ADI
              </span>
              <strong className="font-heading text-xl font-bold">ADI Curime</strong>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-ivory/75">
              {site.slogan}
            </p>
            <p className="mt-3 text-sm text-brand-ivory/60">{site.location}</p>
          </div>
          <nav aria-label="Contacto">
            <h3 className="font-heading text-heading-3 font-semibold text-brand-accent">Contacto</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a aria-label="Enviar correo a ADI Curime" className="inline-flex min-h-11 items-center break-all text-brand-ivory/80 hover:text-brand-accent" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </li>
              <li>
                <a aria-label="Abrir Instagram de ADI Curime" className="inline-flex min-h-11 items-center text-brand-ivory/80 hover:text-brand-accent" href={site.socialLinks.instagram.url} target="_blank" rel="noopener noreferrer">
                  Instagram: {site.socialLinks.instagram.label}
                </a>
              </li>
              <li>
                <a aria-label="Abrir Facebook de ADI Curime" className="inline-flex min-h-11 items-center text-brand-ivory/80 hover:text-brand-accent" href={site.socialLinks.facebook.url} target="_blank" rel="noopener noreferrer">
                  Facebook: {site.socialLinks.facebook.label}
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Enlaces rápidos">
            <h3 className="font-heading text-heading-3 font-semibold text-brand-accent">Enlaces rápidos</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {site.nav.slice(1, 6).map((item) => (
                <li key={item.to}>
                  <Link className="text-brand-ivory/80 hover:text-brand-accent" to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Acceso al sistema">
            <h3 className="font-heading text-heading-3 font-semibold text-brand-accent">Sistema</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link className="text-brand-ivory/80 hover:text-brand-accent" to={isAuthenticated ? homePathForRole(user?.role) : '/login'}>
                  Mi cuenta
                </Link>
              </li>
              <li>
                <Link className="text-brand-ivory/80 hover:text-brand-accent" to="/register">
                  Solicitar una cuenta
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-brand-ivory/15">
          <p className="public-container py-5 text-xs text-brand-ivory/55">
            © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </>
  )
}
