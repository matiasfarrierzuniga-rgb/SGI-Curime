import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getErpNavigation } from '@/app/navigation/erpNavigation'

export function ErpLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navigation = getErpNavigation(user?.role)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuId = useId()
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        userMenuTriggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [userMenuOpen])

  const closeSession = () => {
    setUserMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-brand-ivory font-body text-brand-ink">
      <a className="skip-link" href="#erp-content">Saltar al contenido</a>
      <header className="border-b border-brand-sage/60 bg-brand-deep text-brand-ivory">
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <div>
            <p className="font-display text-xl leading-none">SGI-Curime</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-brand-accent">Área de gestión</p>
          </div>
           <div className="flex min-w-0 items-center gap-4">
             <div className="relative">
               <button
                 ref={userMenuTriggerRef}
                 type="button"
                 onClick={() => setUserMenuOpen((open) => !open)}
                 aria-label={`Menú de usuario de ${user?.fullName ?? 'sesión'}`}
                 aria-expanded={userMenuOpen}
                 aria-controls={userMenuId}
                 className="inline-flex min-h-11 max-w-48 items-center gap-2 rounded-md px-2 text-sm text-brand-ivory/85 transition-colors hover:bg-brand-ivory/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
               >
                 <span className="hidden truncate text-right sm:block">{user?.fullName}</span>
                 <span aria-hidden="true">▾</span>
               </button>
               {userMenuOpen && (
                 <div id={userMenuId} role="menu" className="absolute right-0 z-10 mt-2 min-w-40 rounded-md border border-brand-sage/60 bg-white p-1 shadow-lg">
                   <button type="button" role="menuitem" onClick={closeSession} className="flex min-h-11 w-full items-center rounded px-3 text-left text-sm font-semibold text-brand-ink hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand-deep">
                     Cerrar sesión
                   </button>
                 </div>
               )}
             </div>
             <Link
              to="/"
              className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-brand-ivory/60 px-4 text-sm font-semibold text-brand-ivory transition-colors hover:bg-brand-ivory/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
            >
              Portal público
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b border-brand-sage/60 bg-white px-4 py-5 lg:min-h-[calc(100dvh-72px)] lg:border-r lg:border-b-0 lg:px-6">
          <nav aria-label="Navegación del sistema">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-deep">Navegación</p>
            <ul className="mt-4 space-y-1">
              {navigation.map((item) => item.children ? (
                <li key={item.label}>
                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-deep">{item.label}</p>
                  <ul className="space-y-1 border-l border-brand-sage/70 pl-2">
                    {item.children.map((child) => <NavigationLink key={child.path} item={child} />)}
                  </ul>
                </li>
              ) : <NavigationLink key={item.path} item={item} />)}
            </ul>
          </nav>
        </aside>
        <main id="erp-content" className="min-w-0 px-4 py-8 sm:px-6 lg:px-10"><Outlet /></main>
      </div>
    </div>
  )
}

function NavigationLink({ item }: { item: { label: string; path: string } }) {
  return (
    <li>
      <NavLink
        to={item.path}
        className={({ isActive }) => `flex min-h-11 items-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${isActive ? 'bg-brand-soft text-brand-deep underline decoration-2 underline-offset-4' : 'text-brand-ink hover:bg-brand-soft/60'}`}
      >
        {item.label}
      </NavLink>
    </li>
  )
}
