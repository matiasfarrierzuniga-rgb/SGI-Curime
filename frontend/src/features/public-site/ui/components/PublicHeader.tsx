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
  const accessLabel = isAuthenticated ? 'Volver al SGI' : 'Ir al SGI'
  const publicNavItems = site.nav.filter((item) =>
    ['/', '/nosotros', '/servicios', '/noticias', '/contacto'].includes(item.to),
  )
  return (
    <header className="sticky top-0 z-20 border-b border-brand-ivory/10 bg-brand-deep font-body text-brand-ivory">
      <div className="public-container grid min-h-20 grid-cols-[1fr_auto] items-center gap-x-4 md:min-h-[88px] lg:grid-cols-[minmax(270px,1fr)_auto_minmax(180px,1fr)] xl:min-h-[104px]">
        <Link
          to="/"
          aria-label="ADI Curime, inicio"
          className="flex min-w-0 items-center gap-3 justify-self-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
        >
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-[50%_50%_45%_45%] bg-brand-accent font-display text-[1.35rem] font-bold leading-none text-brand-deep lg:size-14 lg:text-2xl"
          >
            ADI
          </span>
          <span className="min-w-0">
            <strong className="block font-display text-[clamp(1.65rem,2vw,2.15rem)] font-normal leading-none tracking-wide">
              ADI Curime
            </strong>
            <small className="mt-1 hidden text-[0.68rem] font-medium uppercase tracking-[0.12em] text-brand-accent min-[375px]:block lg:text-xs">
              Asociación de Desarrollo Integral
            </small>
          </span>
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={open}
          aria-controls={id}
          className="inline-flex size-11 items-center justify-center rounded-md border border-brand-ivory/60 text-sm font-semibold text-brand-ivory transition-colors hover:bg-brand-ivory/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent lg:hidden"
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
        <nav
          id={id}
          aria-label="Navegación pública"
          className={`${open ? 'flex' : 'hidden'} col-span-2 w-full flex-col items-stretch border-t border-brand-ivory/15 py-3 lg:col-auto lg:flex lg:w-auto lg:flex-row lg:justify-self-center lg:gap-7 lg:border-0 lg:py-0 xl:gap-10`}
        >
          {publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={close}
              className="relative flex min-h-11 items-center px-3 text-base font-medium text-brand-ivory transition-colors hover:text-brand-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent lg:min-h-0 lg:px-0 lg:py-2 aria-[current=page]:font-semibold aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:w-7 aria-[current=page]:after:bg-brand-accent"
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={accessTo}
            onClick={close}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-accent px-5 font-semibold text-brand-deep transition-colors hover:bg-brand-accent/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ivory lg:hidden"
          >
            {accessLabel}
          </Link>
        </nav>
        <Link
          to={accessTo}
          className="hidden min-h-12 justify-self-end rounded-md bg-brand-accent px-6 text-base font-semibold text-brand-deep transition-colors hover:bg-brand-accent/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ivory lg:inline-flex lg:items-center lg:justify-center xl:px-7"
        >
          {accessLabel}
        </Link>
      </div>
    </header>
  )
}
