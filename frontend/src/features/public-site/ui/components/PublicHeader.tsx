import { useEffect, useId, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'

export function PublicHeader() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const id = useId()
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])
  const close = () => setOpen(false)
  return (
    <header className="sticky top-0 z-10 border-b border-brand-deep/15 bg-brand-ivory/95 font-body backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-5 px-4 py-3 min-[375px]:px-6 md:min-h-[78px]">
        <Link
          to="/"
          aria-label={`${site.shortName}, inicio`}
          className="mr-auto flex items-center gap-2.5 text-brand-deep"
        >
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-[50%_50%_45%_45%] bg-brand-deep font-display text-xl font-bold text-brand-ivory"
          >
            C
          </span>
          <span>
            <strong className="block">{site.shortName}</strong>
            <small className="block text-xs text-brand-ink/60">
              Desarrollo comunitario
            </small>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={open}
          aria-controls={id}
          className="inline-flex min-h-11 items-center justify-center border border-brand-deep bg-transparent px-4 font-semibold text-brand-deep md:hidden"
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
        <nav
          id={id}
          aria-label="Navegación pública"
          className={`${open ? 'flex' : 'hidden'} w-full flex-col items-stretch pb-4 md:flex md:w-auto md:flex-row md:items-center md:gap-4 md:pb-0`}
        >
          {site.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={close}
              className="flex min-h-11 items-center text-sm text-brand-ink hover:text-brand-primary md:min-h-0 md:py-1 aria-[current=page]:font-bold aria-[current=page]:text-brand-primary"
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={isAuthenticated ? '/app' : '/login'}
            onClick={close}
            className="inline-flex min-h-11 items-center justify-center bg-brand-deep px-4 py-2 text-sm font-bold text-brand-ivory hover:bg-brand-primary md:min-h-0"
          >
            {isAuthenticated ? 'Ir al SGI' : 'Iniciar sesión'}
          </Link>
        </nav>
      </div>
    </header>
  )
}
