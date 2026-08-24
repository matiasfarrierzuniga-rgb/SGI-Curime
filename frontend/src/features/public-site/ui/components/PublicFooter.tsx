import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'

export function PublicFooter() {
  const { isAuthenticated } = useAuth()
  return (
    <footer className="bg-brand-ink font-body text-brand-ivory">
      <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-12 min-[375px]:px-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <strong className="font-display text-xl">{site.shortName}</strong>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-ivory/80">
            {site.slogan}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-ivory/80">
            {site.location}
            <br />
            <a className="text-brand-accent hover:underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            <br />
            <span>Instagram: {site.instagram}</span>
          </p>
        </div>
        <nav aria-label="Enlaces del pie" className="flex flex-col gap-2 text-sm">
          <strong className="mb-1">Navegación</strong>
          {site.nav.slice(0, 5).map((item) => (
            <Link key={item.to} to={item.to} className="text-brand-accent hover:underline">
              {item.label}
            </Link>
          ))}
          <Link to={isAuthenticated ? '/app' : '/login'} className="text-brand-accent hover:underline">
            {isAuthenticated ? 'Ir al SGI' : 'Acceso al SGI'}
          </Link>
        </nav>
      </div>
      <div className="border-t border-brand-ivory/15">
        <p className="mx-auto w-full max-w-[1180px] px-4 py-4 text-xs text-brand-ivory/60 min-[375px]:px-6">
          © {new Date().getFullYear()} {site.shortName}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
