import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, LayoutDashboard, LogIn, LogOut, Menu, UserRound, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'

const primaryNavigation = [
  { label: 'Inicio', to: '/' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Comunidad', to: '/comunidad' },
  { label: 'Servicios', to: '/servicios' },
] as const

const exploreNavigation = [
  { label: 'Emprendimientos', to: '/ventures' },
  { label: 'Noticias', to: '/noticias' },
  { label: 'Eventos', to: '/eventos' },
  { label: 'Transparencia', to: '/transparencia' },
] as const

export function PublicHeader() {
  const { isAuthenticated, user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const navigationId = useId()
  const accountMenuId = useId()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const accountButtonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  const closeMenus = () => {
    setMobileOpen(false)
    setExploreOpen(false)
    setAccountOpen(false)
  }
  const panelTo = user?.canAccessErp ? '/app' : '/servicios'
  const panelLabel = user?.canAccessErp ? 'Ir al panel' : 'Ver servicios'

  useEffect(() => {
    closeMenus()
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen && !accountOpen) return

    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (accountOpen) {
        setAccountOpen(false)
        accountButtonRef.current?.focus()
        return
      }

      setMobileOpen(false)
      menuButtonRef.current?.focus()
    }

    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [accountOpen, mobileOpen])

  const handleLogout = () => {
    closeMenus()
    void logout()
  }

  const navigationLinkClass = 'relative flex min-h-11 items-center justify-between rounded-control px-3 text-base font-medium text-brand-deep transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold aria-[current=page]:text-primary min-[1280px]:justify-center min-[1280px]:px-4 min-[1280px]:py-2 min-[1280px]:text-[1.05rem] min-[1280px]:aria-[current=page]:after:absolute min-[1280px]:aria-[current=page]:after:bottom-0 min-[1280px]:aria-[current=page]:after:left-1/2 min-[1280px]:aria-[current=page]:after:h-0.5 min-[1280px]:aria-[current=page]:after:w-9 min-[1280px]:aria-[current=page]:after:-translate-x-1/2 min-[1280px]:aria-[current=page]:after:bg-brand-accent'

  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-border/90 bg-brand-ivory/95 font-sans text-brand-deep shadow-[0_2px_10px_rgb(23_76_91_/_0.08)] backdrop-blur-sm">
      <div className="public-container relative flex min-h-[5.25rem] items-center gap-3 py-2 sm:min-h-[5.5rem] min-[1280px]:min-h-[5.125rem] min-[1280px]:justify-between min-[1280px]:py-2">
        <Link to="/" aria-label="ADI Curime, inicio" className="flex h-12 w-40 shrink-0 items-center rounded-control focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring sm:h-14 sm:w-44 min-[1280px]:h-14 min-[1280px]:w-44">
          <img src="/brand/adi-curime-logo-horizontal-color-header-tight.png" alt="" width="1331" height="535" className="block size-full object-contain" />
        </Link>

        <nav id={navigationId} aria-label="Navegación pública" className={`${mobileOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full z-20 mx-3 flex-col rounded-surface border border-border bg-brand-ivory p-3 shadow-surface min-[1280px]:static min-[1280px]:mx-0 min-[1280px]:flex min-[1280px]:flex-1 min-[1280px]:items-center min-[1280px]:border-0 min-[1280px]:bg-transparent min-[1280px]:p-0 min-[1280px]:shadow-none`}>
          <ul className="flex w-full flex-col gap-0.5 min-[1280px]:w-auto min-[1280px]:flex-row min-[1280px]:items-center min-[1280px]:gap-1">
            {primaryNavigation.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} onClick={closeMenus} className={navigationLinkClass}>
                  {item.label}<ChevronRight className="size-4 min-[1280px]:hidden" aria-hidden="true" />
                </NavLink>
              </li>
            ))}
            <li className="relative">
              <button type="button" onClick={() => setExploreOpen(!exploreOpen)} aria-expanded={exploreOpen} aria-controls={`${navigationId}-explore`} className={`${navigationLinkClass} w-full min-[1280px]:w-auto`}>
                Explorar<ChevronDown className={`size-4 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              <ul id={`${navigationId}-explore`} className={`${exploreOpen ? 'flex' : 'hidden'} flex-col gap-0.5 py-1 min-[1280px]:absolute min-[1280px]:right-0 min-[1280px]:top-[calc(100%+0.5rem)] min-[1280px]:w-52 min-[1280px]:rounded-surface min-[1280px]:border min-[1280px]:border-border min-[1280px]:bg-brand-ivory min-[1280px]:p-2 min-[1280px]:shadow-surface`}>
                {exploreNavigation.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} onClick={closeMenus} className="flex min-h-10 items-center rounded-control px-3 text-sm font-medium text-brand-deep transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>

        <div className="relative ml-auto flex shrink-0 items-center gap-2">
          {isAuthenticated ? (
            <button ref={accountButtonRef} type="button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} aria-controls={accountMenuId} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-brand-deep bg-brand-ivory px-3 text-sm font-semibold text-brand-deep shadow-sm transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring sm:px-4 sm:text-base">
              <UserRound className="size-5" aria-hidden="true" /><span>Mi espacio</span><ChevronDown className={`size-4 transition-transform ${accountOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          ) : (
            <Link to="/login" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-brand-deep bg-brand-ivory px-3 text-sm font-semibold text-brand-deep shadow-sm transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring sm:px-4 sm:text-base">
              <LogIn className="size-5" aria-hidden="true" /><span>Mi espacio</span><ChevronDown className="size-4" aria-hidden="true" />
            </Link>
          )}
          <button ref={menuButtonRef} type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} aria-expanded={mobileOpen} aria-controls={navigationId} className="inline-flex size-11 items-center justify-center rounded-control border border-brand-deep text-brand-deep transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring min-[1280px]:hidden">
            {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>

          {isAuthenticated && accountOpen && (
            <div id={accountMenuId} aria-label="Opciones de Mi espacio" className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[20.75rem] rounded-surface border border-border bg-brand-ivory p-3 shadow-surface">
              <Link to={panelTo} onClick={closeMenus} className="flex items-center gap-4 rounded-control px-3 py-3 transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <UserRound className="size-7 shrink-0 text-brand-deep" aria-hidden="true" />
                <span className="flex flex-col"><span className="text-base font-semibold">Mi espacio</span><span className="text-sm text-muted-foreground">Acceso al sistema</span></span>
              </Link>
              <div className="my-1 border-t border-border" />
              <Link to={panelTo} onClick={closeMenus} className="flex items-center gap-4 rounded-control px-3 py-3 transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <LayoutDashboard className="size-7 shrink-0 text-brand-deep" aria-hidden="true" />
                <span className="flex flex-col"><span className="text-base font-semibold">{panelLabel}</span><span className="text-sm text-muted-foreground">{user?.canAccessErp ? 'Gestionar el sistema' : 'Consultar servicios disponibles'}</span></span>
              </Link>
              <div className="my-1 border-t border-border" />
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-4 rounded-control px-3 py-3 text-left transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <LogOut className="size-7 shrink-0 text-brand-accent" aria-hidden="true" />
                <span className="flex flex-col"><span className="text-base font-semibold">Cerrar sesión</span><span className="text-sm text-muted-foreground">Salir de forma segura</span></span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
