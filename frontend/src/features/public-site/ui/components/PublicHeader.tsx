import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'

export function PublicHeader() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const id = useId()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return

    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [open])
  const close = () => setOpen(false)
  const accessTo = isAuthenticated ? '/app' : '/login'
  const accessLabel = isAuthenticated ? 'Ir al panel' : 'Iniciar sesión'
  const publicNavItems = site.nav.filter((item) =>
    ['/', '/nosotros', '/comunidad', '/servicios', '/transparencia', '/contacto'].includes(item.to),
  )
  return (
    <header className="sticky top-0 z-20 border-b border-brand-deep/15 bg-brand-ivory font-sans text-brand-deep">
      <div className="public-container grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-3 py-1 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(160px,1fr)] lg:gap-x-4">
        <Link
          to="/"
          aria-label="ADI Curime, inicio"
          className="min-w-0 justify-self-start rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep"
        >
          <img
            src="/brand/adi-curime-logo-horizontal-color.png"
            alt=""
            width="1448"
            height="1086"
            className="block h-auto w-48 sm:w-52 lg:w-56 xl:w-60"
          />
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={open}
          aria-controls={id}
          className="inline-flex size-11 items-center justify-center rounded-md border border-brand-deep/50 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-soft/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep lg:hidden"
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
        <nav
          id={id}
          aria-label="Navegación pública"
          className={`${open ? 'flex' : 'hidden'} col-span-2 w-full flex-col items-stretch border-t border-brand-deep/15 py-3 lg:col-auto lg:flex lg:w-auto lg:flex-row lg:justify-self-center lg:gap-3 lg:border-0 lg:py-0 xl:gap-5`}
        >
          {publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={close}
              className="relative flex min-h-11 items-center px-3 text-base font-medium text-brand-deep transition-colors hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep lg:min-h-0 lg:px-0 lg:py-2 lg:text-sm xl:text-base aria-[current=page]:font-semibold aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:w-7 aria-[current=page]:after:bg-brand-accent"
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={accessTo}
            onClick={close}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-accent px-5 font-semibold text-brand-deep transition-colors hover:bg-brand-accent/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep lg:hidden"
          >
            {accessLabel}
          </Link>
        </nav>
        <Link
          to={accessTo}
          className="hidden min-h-12 justify-self-end rounded-md bg-brand-accent px-4 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-accent/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-deep lg:inline-flex lg:items-center lg:justify-center xl:px-6 xl:text-base"
        >
          {accessLabel}
        </Link>
      </div>
    </header>
  )
}
