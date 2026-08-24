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
  const accessTo = isAuthenticated ? '/app' : '/login'
  const accessLabel = isAuthenticated ? 'Ir al SGI' : 'Acceso al sistema'
  return (
    <header className="sticky top-0 z-20 bg-brand-deep font-body text-brand-ivory">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 min-[375px]:px-6 md:min-h-[80px] md:flex-nowrap md:gap-y-0 md:py-0">
        <Link
          to="/"
          aria-label={`${site.shortName}, inicio`}
          className="mr-auto flex items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-[50%_50%_45%_45%] bg-brand-accent font-display text-xl font-bold text-brand-ink"
          >
            C
          </span>
          <span>
            <strong className="block font-display text-xl font-normal tracking-wide">
              {site.shortName}
            </strong>
            <small className="block text-[0.7rem] uppercase tracking-[0.14em] text-brand-ivory/70">
              Nicoya · Guanacaste
            </small>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={open}
          aria-controls={id}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand-ivory/60 px-4 font-semibold text-brand-ivory hover:bg-brand-ivory/10 md:hidden"
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
        <nav
          id={id}
          aria-label="Navegación pública"
          className={`${open ? 'flex' : 'hidden'} w-full flex-col items-stretch pb-4 md:flex md:w-auto md:flex-1 md:flex-row md:justify-center md:gap-1 md:pb-0`}
        >
          {site.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={close}
              className="flex min-h-11 items-center rounded-md px-3 text-sm text-brand-ivory/85 hover:text-brand-accent md:min-h-0 md:py-2 aria-[current=page]:font-bold aria-[current=page]:text-brand-accent aria-[current=page]:underline aria-[current=page]:decoration-brand-accent aria-[current=page]:underline-offset-8"
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={accessTo}
            onClick={close}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-accent px-5 font-bold text-brand-ink hover:bg-brand-accent/85 md:hidden"
          >
            {accessLabel}
          </Link>
        </nav>
        <Link
          to={accessTo}
          className="hidden h-11 items-center justify-center rounded-md bg-brand-accent px-5 font-bold text-brand-ink hover:bg-brand-accent/85 md:inline-flex"
        >
          {accessLabel}
        </Link>
      </div>
    </header>
  )
}
