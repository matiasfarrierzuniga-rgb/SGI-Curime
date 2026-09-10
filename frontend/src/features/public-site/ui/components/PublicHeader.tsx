import { useEffect, useId, useRef, useState } from 'react'
import { LogIn, Menu, X } from 'lucide-react'
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
      <div className="public-container grid min-h-[4.5rem] grid-cols-[1fr_auto] items-center gap-x-3 py-2 lg:min-h-24 lg:grid-cols-[9rem_minmax(0,1fr)_auto] lg:gap-x-6 xl:grid-cols-[11rem_minmax(0,1fr)_auto] xl:gap-x-8">
        <Link
          to="/"
          aria-label="ADI Curime, inicio"
            className="flex h-12 w-36 shrink-0 items-center rounded-control focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring sm:h-14 sm:w-44 lg:h-14 lg:w-36 xl:h-16 xl:w-44 2xl:h-[72px] 2xl:w-52"
        >
          <img
            src="/brand/adi-curime-logo-horizontal-color.png"
            alt=""
            width="1448"
            height="1086"
            className="block size-full object-contain"
          />
        </Link>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={
            open
              ? 'Cerrar menú de navegación'
              : 'Abrir menú de navegación'
          }
          aria-expanded={open}
          aria-controls={id}
          className="public-menu-toggle size-11 items-center justify-center rounded-control border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>

        <nav
          id={id}
          aria-label="Navegación pública"
          className={`${open ? 'flex' : 'hidden'} col-span-2 mt-2 w-full flex-col items-stretch rounded-surface border border-border bg-surface-muted p-2 shadow-surface lg:col-auto lg:mt-0 lg:flex lg:w-auto lg:flex-row lg:justify-self-start lg:gap-1.5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none xl:gap-2.5 2xl:gap-3`}
        >
          {site.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={close}
              className="relative flex min-h-11 items-center rounded-control px-3 text-base font-medium text-brand-deep transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring lg:px-2 lg:py-2 lg:text-xs xl:px-2.5 xl:text-sm 2xl:px-3 aria-[current=page]:font-semibold aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-2 aria-[current=page]:after:h-0.5 aria-[current=page]:after:w-7 aria-[current=page]:after:bg-brand-accent"
            >
              {item.label}
            </NavLink>
          ))}

          <Button
            nativeButton={false}
            render={<Link to={accessTo} />}
            onClick={close}
            size="sm"
            className="mt-2 w-full lg:hidden"
          >
            {accessLabel}
          </Button>
        </nav>

        <Button
          nativeButton={false}
          render={<Link to={accessTo} />}
          size="sm"
          className="hidden justify-self-end lg:inline-flex lg:px-4"
        >
          <LogIn className="size-4" aria-hidden="true" />{accessLabel}
        </Button>
      </div>
    </header>
  )
}
