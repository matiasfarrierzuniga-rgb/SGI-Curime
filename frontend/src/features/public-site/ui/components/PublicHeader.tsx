import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, LogIn, LogOut, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { site } from '@/content/publicSiteContent'
import { Button } from '@/shared/ui/button'

type Group = 'Comunidad' | 'Servicios'
const groups: Record<Group, readonly string[]> = {
  Comunidad: ['Comunidad', 'Emprendimientos', 'Noticias', 'Eventos'],
  Servicios: ['Servicios', 'Transparencia'],
}
const mainItems = ['Inicio', 'Nosotros', 'Comunidad', 'Servicios', 'Contacto'] as const
const linkClass = 'flex min-h-11 items-center rounded-control px-3 text-navigation font-medium text-brand-deep transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold aria-[current=page]:text-primary'
const linkHoverClass = 'hover:bg-primary/10'

export function PublicHeader() {
  const { isAuthenticated, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<Group | null>(null)
  const id = useId()
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const groupButtons = useRef<Partial<Record<Group, HTMLButtonElement | null>>>({})
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
    setOpenGroup(null)
  }, [pathname])

  useEffect(() => {
    if (!open && !openGroup) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (openGroup) {
        groupButtons.current[openGroup]?.focus()
        setOpenGroup(null)
      } else {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    const onOutside = (event: PointerEvent) => {
      if (headerRef.current?.contains(event.target as Node)) return
      setOpenGroup(null)
      setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onOutside)
    }
  }, [open, openGroup])

  const close = () => { setOpen(false); setOpenGroup(null) }
  const accessTo = !isAuthenticated ? '/login' : user?.canAccessErp ? '/app' : '/servicios'
  const accessLabel = !isAuthenticated ? 'Iniciar sesión' : user?.canAccessErp ? 'Ir al panel' : 'Ver servicios'
  const handleLogout = () => { close(); void logout() }

  return (
    <header ref={headerRef} className="sticky top-0 z-[var(--z-nav)] border-b border-border/90 bg-brand-ivory/95 font-sans text-brand-deep backdrop-blur-sm">
      <div className="public-container grid min-h-[4.25rem] grid-cols-[1fr_auto] items-center gap-x-3 py-2 min-[1200px]:min-h-[4.75rem] min-[1200px]:grid-cols-[11rem_minmax(0,1fr)_auto] min-[1200px]:gap-x-5">
        <Link to="/" aria-label="ADI Curime, inicio" className="flex h-10 w-36 shrink-0 items-center rounded-control focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring sm:h-11 sm:w-40 min-[1200px]:h-14 min-[1200px]:w-44">
          <img src="/brand/adi-curime-logo-horizontal-color-header-tight.png" alt="" width="1331" height="535" className="block size-full object-contain" />
        </Link>
        <button ref={menuButtonRef} type="button" onClick={() => { setOpen(!open); setOpenGroup(null) }} aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'} aria-expanded={open} aria-controls={id} className="inline-flex size-11 items-center justify-center rounded-control border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring min-[1200px]:hidden">
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
        <nav id={id} aria-label="Navegación pública" className={`${open ? 'flex' : 'hidden'} col-span-2 mt-2 w-full flex-col items-stretch rounded-surface border border-border bg-surface-muted p-2 shadow-surface min-[1200px]:col-auto min-[1200px]:mt-0 min-[1200px]:flex min-[1200px]:w-auto min-[1200px]:flex-row min-[1200px]:justify-self-center min-[1200px]:border-0 min-[1200px]:bg-transparent min-[1200px]:p-0 min-[1200px]:shadow-none`}>
          <ul className="flex flex-col gap-0.5 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-1 2xl:gap-2">
            {mainItems.map((label) => {
              if (label !== 'Comunidad' && label !== 'Servicios') {
                const item = site.nav.find((entry) => entry.label === label)!
                return <li key={label}><NavLink to={item.to} end={item.to === '/'} onClick={close} className={`${linkClass} ${linkHoverClass}`}>{label}</NavLink></li>
              }
              const destinations = groups[label]
              const expanded = openGroup === label
              const active = destinations.some((destination) => {
                const route = site.nav.find((item) => item.label === destination)!.to
                return pathname === route || pathname.startsWith(`${route}/`)
              })
              const panelId = `${id}-${label.toLowerCase()}`
              const focusItem = (index: number) => document.getElementById(panelId)?.querySelectorAll<HTMLAnchorElement>('a')[index]?.focus()
              return (
                <li key={label} className="relative">
                  <button ref={(node) => { groupButtons.current[label] = node }} type="button" aria-expanded={expanded} aria-controls={panelId} data-active={active || undefined} onClick={() => setOpenGroup(expanded ? null : label)} onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      setOpenGroup(label)
                      requestAnimationFrame(() => focusItem(event.key === 'ArrowDown' ? 0 : destinations.length - 1))
                    }
                  }} className={`${linkClass} public-nav-trigger w-full justify-between gap-2 text-left data-[active=true]:font-semibold data-[active=true]:text-primary min-[1200px]:w-auto`}>
                    {label}<ChevronDown className={`size-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  <ul id={panelId} hidden={!expanded} className="mt-1 space-y-0.5 rounded-control border border-border bg-brand-ivory p-1.5 shadow-surface min-[1200px]:absolute min-[1200px]:left-0 min-[1200px]:top-full min-[1200px]:z-10 min-[1200px]:mt-2 min-[1200px]:min-w-48">
                    {destinations.map((destination) => {
                      const item = site.nav.find((entry) => entry.label === destination)!
                      return <li key={destination}><NavLink to={item.to} onClick={close} className={`${linkClass} ${linkHoverClass}`}>{destination}</NavLink></li>
                    })}
                  </ul>
                </li>
              )
            })}
          </ul>
          <div className="flex flex-col gap-2 min-[1200px]:hidden">
            <Button nativeButton={false} render={<Link to={accessTo} />} onClick={close} size="sm" className="mt-2 w-full">{accessLabel}</Button>
            {isAuthenticated && <Button onClick={handleLogout} size="sm" variant="outline" className="w-full"><LogOut className="size-4" aria-hidden="true" />Cerrar sesión</Button>}
          </div>
        </nav>
        <div className="hidden items-center justify-self-end gap-2.5 min-[1200px]:flex">
          <Button nativeButton={false} render={<Link to={accessTo} />} size="sm" className="px-4"><LogIn className="size-4" aria-hidden="true" />{accessLabel}</Button>
          {isAuthenticated && <Button onClick={handleLogout} size="sm" variant="outline" className="px-4"><LogOut className="size-4" aria-hidden="true" />Cerrar sesión</Button>}
        </div>
      </div>
    </header>
  )
}
