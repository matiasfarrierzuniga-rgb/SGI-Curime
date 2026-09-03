import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'

export function PublicFooter() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className="-mb-px block h-8 w-full text-brand-ink md:h-12"
      >
        <path
          fill="currentColor"
          d="M0,28 C180,48 360,6 540,12 C720,18 900,44 1080,38 C1260,32 1350,14 1440,20 L1440,48 L0,48 Z"
        />
      </svg>
      <footer className="bg-brand-ink pt-6 font-sans text-brand-ivory md:pt-8">
        <div className="public-container grid gap-8 pb-10 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-8 xl:gap-12 xl:pb-12">
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
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <a aria-label="Enviar correo a ADI Curime" className="inline-flex min-h-11 items-center break-all rounded-sm text-brand-ivory/80 hover:text-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </li>
              <li>
                <a aria-label="Abrir Instagram de ADI Curime" className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 hover:text-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" href={site.socialLinks.instagram.url} target="_blank" rel="noopener noreferrer">
                  Instagram: {site.socialLinks.instagram.label}
                </a>
              </li>
              <li>
                <a aria-label="Abrir Facebook de ADI Curime" className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 hover:text-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" href={site.socialLinks.facebook.url} target="_blank" rel="noopener noreferrer">
                  Facebook: {site.socialLinks.facebook.label}
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Enlaces rápidos">
            <h3 className="font-heading text-heading-3 font-semibold text-brand-ivory">Enlaces rápidos</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm lg:block lg:space-y-1">
              {site.nav.filter((item) => item.to !== '/').map((item) => (
                <li key={item.to}>
                  <Link className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 hover:text-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Acceso al sistema">
            <h3 className="font-heading text-heading-3 font-semibold text-brand-ivory">Sistema</h3>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <Link className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 hover:text-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" to={isAuthenticated ? '/app' : '/login'}>
                  {isAuthenticated ? 'Ir al panel' : 'Iniciar sesión'}
                </Link>
              </li>
              <li>
                <Link className="inline-flex min-h-11 items-center rounded-sm text-brand-ivory/80 hover:text-brand-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-ivory" to="/register">
                  Solicitar una cuenta
                </Link>
              </li>
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
