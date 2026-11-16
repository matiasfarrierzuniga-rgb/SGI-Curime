import { Link } from 'react-router-dom'
import { ArrowRight, LogOut, Mail } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'
import { Button } from '@/shared/ui/button'
import { SocialIcon } from '@/shared/ui/SocialIcon'

export function PublicFooter() {
  const { isAuthenticated, user, logout } = useAuth()
  const footerLinkClassName = 'inline-flex min-h-11 max-w-full items-center rounded-sm text-text-inverse/80 transition-colors hover:text-brand-accent hover:underline hover:decoration-brand-accent hover:underline-offset-4 focus-visible:text-brand-accent focus-visible:underline focus-visible:decoration-brand-accent focus-visible:underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-text-inverse'
  return (
    <footer className="bg-brand-ink font-sans text-text-inverse">
        <div className="mx-auto grid w-full max-w-[75rem] gap-x-8 gap-y-7 px-4 py-7 min-[375px]:px-5 md:grid-cols-2 md:gap-x-10 md:gap-y-8 md:px-6 md:py-8 lg:grid-cols-[1.2fr_1fr_1.35fr_0.85fr] lg:gap-x-8 lg:px-8 lg:py-10 xl:gap-x-12">
          <div className="lg:pr-2">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-surface bg-brand-ivory p-1 sm:size-14">
                <img
                  src="/brand/adi-curime-mark-color.png"
                  alt=""
                  width="1254"
                  height="1254"
                  className="block size-full object-contain"
                />
              </span>
              <strong className="font-heading text-2xl font-bold tracking-tight text-text-inverse">ADI Curime</strong>
            </div>
            <p className="mt-3 max-w-sm text-pretty text-body text-text-inverse/85">
              {site.slogan}
            </p>
            <p className="mt-3 border-t border-text-inverse/15 pt-3 text-body-small text-text-inverse/70">{site.location}</p>
          </div>
          <nav aria-label="Contacto" className="lg:border-l lg:border-text-inverse/15 lg:pl-6">
            <h3 className="text-caption font-bold uppercase tracking-[0.14em] text-text-inverse">Contacto</h3>
            <ul className="mt-2 space-y-1 text-body-small">
              <li>
                <a aria-label="Enviar correo a ADI Curime" className={`${footerLinkClassName} gap-2 break-words text-text-inverse`} href={`mailto:${site.email}`}>
                  <Mail aria-hidden="true" className="size-4 shrink-0" />
                  {site.email}
                </a>
              </li>
              <li>
                <a aria-label="Abrir Instagram de ADI Curime" className={`${footerLinkClassName} gap-2`} href={site.socialLinks.instagram.url} target="_blank" rel="noopener noreferrer">
                  <SocialIcon platform="instagram" className="size-4" />
                  Instagram: {site.socialLinks.instagram.label}
                </a>
              </li>
              <li>
                <a aria-label="Abrir Facebook de ADI Curime" className={`${footerLinkClassName} gap-2`} href={site.socialLinks.facebook.url} target="_blank" rel="noopener noreferrer">
                  <SocialIcon platform="facebook" className="size-4" />
                  Facebook: {site.socialLinks.facebook.label}
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Enlaces rápidos" className="lg:border-l lg:border-text-inverse/15 lg:pl-6">
            <h3 className="text-caption font-bold uppercase tracking-[0.14em] text-text-inverse">Enlaces rápidos</h3>
            <ul className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-body-small lg:grid-cols-3">
              {site.nav.filter((item) => item.to !== '/').map((item) => (
                <li key={item.to} className="min-w-0">
                  <Link className={`${footerLinkClassName} w-full`} to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Acceso al sistema" className="lg:border-l lg:border-text-inverse/15 lg:pl-6">
            <h3 className="text-caption font-bold uppercase tracking-[0.14em] text-text-inverse">Sistema</h3>
            <ul className="mt-3 space-y-2 text-body-small">
              <li>
                <Link className="inline-flex min-h-11 items-center gap-2 rounded-control bg-interaction-primary-default px-4 font-semibold text-white shadow-sm transition-colors hover:bg-interaction-primary-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-text-inverse" to={!isAuthenticated ? '/login' : user?.canAccessErp ? '/app' : '/servicios'}>
                  {!isAuthenticated ? 'Iniciar sesión' : user?.canAccessErp ? 'Ir al panel' : 'Ver servicios'}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </li>
              {isAuthenticated ? (
                <li>
                  <Button variant="ghost" size="sm" type="button" className="min-h-11 !bg-transparent px-2 !text-text-inverse/80 hover:!bg-brand-ivory/10 hover:!text-brand-accent active:!bg-brand-ivory/15 disabled:!bg-transparent disabled:!text-text-inverse/50 focus-visible:border-text-inverse focus-visible:ring-text-inverse/40" onClick={() => void logout()}>
                    <LogOut aria-hidden="true" className="size-3.5" />
                    Cerrar sesión
                  </Button>
                </li>
              ) : (
                <li>
                  <Link className={footerLinkClassName} to="/register">
                    Solicitar una cuenta
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
        <div className="border-t border-text-inverse/15">
          <p className="mx-auto w-full max-w-[75rem] px-4 py-3 text-caption text-text-inverse/70 min-[375px]:px-5 md:px-6 lg:px-8">
            © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
          </p>
        </div>
    </footer>
  )
}
