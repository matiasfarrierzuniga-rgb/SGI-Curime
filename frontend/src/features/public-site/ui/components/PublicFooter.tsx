import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'
import { Button } from '@/shared/ui/button'

export function PublicFooter() {
  const { isAuthenticated, user, logout } = useAuth()
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className="-mb-px block h-6 w-full text-brand-ink md:h-10"
      >
        <path
          fill="currentColor"
          d="M0,28 C180,48 360,6 540,12 C720,18 900,44 1080,38 C1260,32 1350,14 1440,20 L1440,48 L0,48 Z"
        />
      </svg>
      <footer className="bg-brand-ink pt-8 font-sans text-brand-ivory md:pt-10">
        <div className="public-container grid gap-x-8 gap-y-9 pb-10 md:grid-cols-2 md:gap-x-12 md:gap-y-10 md:pb-12 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-x-8 xl:gap-x-12 xl:pb-14">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-surface bg-brand-ivory p-1">
                <img
                  src="/brand/adi-curime-mark-color.png"
                  alt=""
                  width="1254"
                  height="1254"
                  className="block size-full object-contain"
                />
              </span>
              <strong className="font-heading text-xl font-bold">ADI Curime</strong>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-ivory/75">
              {site.slogan}
            </p>
            <p className="mt-3 text-sm text-brand-ivory/75">{site.location}</p>
          </div>
          <nav aria-label="Contacto">
            <h3 className="font-heading text-heading-3 font-semibold text-brand-ivory">Contacto</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <a aria-label="Enviar correo a ADI Curime" className="inline-flex min-h-11 max-w-full items-center break-words rounded-sm text-brand-ivory underline decoration-brand-accent/60 underline-offset-4 transition-colors hover:text-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </li>
              <li>
                <a aria-label="Abrir Instagram de ADI Curime" className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 underline decoration-brand-accent/50 underline-offset-4 transition-colors hover:text-brand-accent hover:decoration-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" href={site.socialLinks.instagram.url} target="_blank" rel="noopener noreferrer">
                  Instagram: {site.socialLinks.instagram.label}
                </a>
              </li>
              <li>
                <a aria-label="Abrir Facebook de ADI Curime" className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 underline decoration-brand-accent/50 underline-offset-4 transition-colors hover:text-brand-accent hover:decoration-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" href={site.socialLinks.facebook.url} target="_blank" rel="noopener noreferrer">
                  Facebook: {site.socialLinks.facebook.label}
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Enlaces rápidos">
            <h3 className="font-heading text-heading-3 font-semibold text-brand-ivory">Enlaces rápidos</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5 text-sm lg:block lg:space-y-1.5">
              {site.nav.filter((item) => item.to !== '/').map((item) => (
                <li key={item.to} className="min-w-0">
                  <Link className="inline-flex min-h-11 w-full items-center rounded-sm text-brand-ivory/80 underline decoration-brand-accent/50 underline-offset-4 transition-colors hover:text-brand-accent hover:decoration-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory lg:w-auto" to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Acceso al sistema">
            <h3 className="font-heading text-heading-3 font-semibold text-brand-ivory">Sistema</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <Link className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 underline decoration-brand-accent/50 underline-offset-4 transition-colors hover:text-brand-accent hover:decoration-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" to={!isAuthenticated ? '/login' : user?.canAccessErp ? '/app' : '/servicios'}>
                  {!isAuthenticated ? 'Iniciar sesión' : user?.canAccessErp ? 'Ir al panel' : 'Ver servicios'}
                </Link>
              </li>
              {isAuthenticated ? (
                <li>
                  <Button variant="inverse" size="sm" type="button" onClick={() => void logout()}>
                    Cerrar sesión
                  </Button>
                </li>
              ) : (
                <li>
                  <Link className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 underline decoration-brand-accent/50 underline-offset-4 transition-colors hover:text-brand-accent hover:decoration-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" to="/register">
                    Solicitar una cuenta
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
        <div className="border-t border-brand-ivory/15">
          <p className="public-container py-4 text-xs text-brand-ivory/75">
            © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </>
  )
}
