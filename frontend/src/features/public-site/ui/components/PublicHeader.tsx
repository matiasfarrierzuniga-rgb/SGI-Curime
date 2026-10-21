import { useEffect, useId, useRef, useState } from 'react'
import { LogIn, LogOut, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'
import { Button } from '@/shared/ui/button'

export function PublicHeader() {
  const { isAuthenticated, user, logout } = useAuth()
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
  const accessTo = !isAuthenticated ? '/login' : user?.canAccessErp ? '/app' : '/servicios'
  const accessLabel = !isAuthenticated ? 'Iniciar sesión' : user?.canAccessErp ? 'Ir al panel' : 'Ver servicios'
  const desktopGrid = 'min-[1200px]:grid-cols-[11rem_minmax(0,1fr)_auto] min-[1200px]:gap-x-6'
  const desktopNav = 'min-[1200px]:col-auto min-[1200px]:mt-0 min-[1200px]:flex min-[1200px]:w-auto min-[1200px]:flex-row min-[1200px]:justify-self-start min-[1200px]:border-0 min-[1200px]:bg-transparent min-[1200px]:p-0 min-[1200px]:shadow-none'
  const desktopNavList = 'min-[1200px]:flex min-[1200px]:w-auto min-[1200px]:flex-row min-[1200px]:gap-0.5'
  const desktopItem = 'min-[1200px]:min-h-11 min-[1200px]:px-2.5 min-[1200px]:py-2 min-[1200px]:text-sm 2xl:px-3'
  const handleLogout = () => {
    close()
    void logout()
  }

  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-border/90 bg-brand-ivory/95 font-sans text-brand-deep backdrop-blur-sm">
      <div className={`public-container grid min-h-[4.25rem] grid-cols-[1fr_auto] items-center gap-x-3 py-2 min-[1200px]:min-h-[4.75rem] ${desktopGrid}`}>
        <Link
          to="/"
          aria-label="ADI Curime, inicio"
          className="flex h-10 w-36 shrink-0 items-center rounded-control focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring sm:h-11 sm:w-40 min-[1200px]:h-14 min-[1200px]:w-44 2xl:w-48"
        >
          <img
            src="/brand/adi-curime-logo-horizontal-color-header-tight.png"
            alt=""
            width="1331"
            height="535"
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
          className="inline-flex size-11 items-center justify-center rounded-control border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring min-[1200px]:hidden"
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>

        <nav
          id={id}
          aria-label="Navegación pública"
          className={`${open ? 'flex' : 'hidden'} col-span-2 mt-2 w-full flex-col items-stretch rounded-surface border border-border bg-surface-muted p-2 shadow-surface ${desktopNav}`}
        >
          <ul className={`flex flex-col gap-0.5 ${desktopNavList}`}>
            {site.nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={close}
                  className={`relative flex min-h-11 items-center rounded-control px-3 text-base font-medium text-brand-deep transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring ${desktopItem} aria-[current=page]:font-semibold aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-2 aria-[current=page]:after:h-0.5 aria-[current=page]:after:w-7 aria-[current=page]:after:bg-brand-accent`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 min-[1200px]:hidden">
            <Button
              nativeButton={false}
              render={<Link to={accessTo} />}
              onClick={close}
              size="sm"
              className="mt-2 w-full"
            >
              {accessLabel}
            </Button>
            {isAuthenticated && (
              <Button onClick={handleLogout} size="sm" variant="outline" className="w-full">
                <LogOut className="size-4" aria-hidden="true" />Cerrar sesión
              </Button>
            )}
          </div>
        </nav>

        <div className="hidden items-center justify-self-end gap-2.5 min-[1200px]:flex">
          <Button nativeButton={false} render={<Link to={accessTo} />} size="sm" className="px-3.5 min-[1200px]:px-4">
            <LogIn className="size-4" aria-hidden="true" />{accessLabel}
          </Button>
          {isAuthenticated && (
            <Button onClick={handleLogout} size="sm" variant="outline" className="px-3.5 min-[1200px]:px-4">
              <LogOut className="size-4" aria-hidden="true" />Cerrar sesión
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
