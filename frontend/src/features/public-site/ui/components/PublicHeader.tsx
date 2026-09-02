import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'
import { Button } from '@/shared/ui/button'

export function PublicHeader() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const id = useId()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

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

  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-border bg-brand-ivory/95 font-sans text-brand-deep backdrop-blur-sm">
      <div className="public-container grid min-h-20 grid-cols-[1fr_auto] items-center gap-x-3 py-2 lg:min-h-24 lg:grid-cols-[11rem_minmax(0,1fr)_auto] lg:gap-x-5">
        <Link
          to="/"
          aria-label="ADI Curime, inicio"
          className="relative block h-14 w-40 shrink-0 overflow-hidden rounded-control focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring sm:h-16 sm:w-48 lg:h-[72px] lg:w-52"
        >
          <img
            src="/brand/adi-curime-logo-horizontal-color.png"
            alt=""
            width="1448"
            height="1086"
            className="absolute top-1/2 block h-auto w-full -translate-y-1/2"
          />
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={open}
          aria-controls={id}
          className="public-menu-toggle size-11 items-center justify-center rounded-control border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
        <nav
          id={id}
          aria-label="Navegación pública"
          className={`${open ? 'flex' : 'hidden'} col-span-2 mt-2 w-full flex-col items-stretch rounded-surface border border-border bg-surface-muted p-2 shadow-surface lg:col-auto lg:mt-0 lg:flex lg:w-auto lg:flex-row lg:justify-self-center lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none xl:gap-4`}
        >
          {site.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={close}
              className="relative flex min-h-11 items-center rounded-control px-3 text-base font-medium text-brand-deep transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring lg:min-h-0 lg:px-1 lg:py-2 lg:text-xs xl:text-sm aria-[current=page]:font-semibold aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-1 aria-[current=page]:after:h-0.5 aria-[current=page]:after:w-7 aria-[current=page]:after:bg-brand-accent"
            >
              {item.label}
            </NavLink>
          ))}
          <Button
            render={<Link to={accessTo} />}
            onClick={close}
            size="sm"
            className="mt-2 w-full lg:hidden"
          >
            {accessLabel}
          </Button>
        </nav>
        <Button
          render={<Link to={accessTo} />}
          size="sm"
          className="hidden justify-self-end lg:inline-flex"
        >
          {accessLabel}
        </Button>
      </div>
    </header>
  )
}
