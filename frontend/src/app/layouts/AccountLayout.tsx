import { ExternalLink, Home, LogOut, UserRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'

const accountNavigation = [
  { label: 'Inicio', to: '/mi-cuenta', icon: Home, end: true },
  { label: 'Mi perfil', to: '/profile', icon: UserRound, end: false },
] as const

export function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const closeSession = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-brand-ivory font-sans text-brand-ink">
      <a className="skip-link" href="#account-content">Saltar al contenido</a>
      <header className="border-b border-brand-soft/50 bg-brand-deep text-brand-ivory">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-heading text-xl font-bold">SGI-Curime</p>
            <p className="mt-1 text-sm text-brand-accent">Mi cuenta</p>
          </div>
          <p className="truncate text-sm font-semibold">{user?.fullName}</p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[13rem_minmax(0,1fr)] md:py-10">
        <nav aria-label="Navegación de Mi cuenta" className="flex flex-wrap gap-2 md:flex-col">
          {accountNavigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${isActive ? 'bg-brand-deep text-brand-ivory' : 'bg-white text-brand-ink hover:bg-brand-soft/20'}`}>
              <Icon className="size-4" aria-hidden="true" />{label}
            </NavLink>
          ))}
          <NavLink to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-soft/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep">
            <ExternalLink className="size-4" aria-hidden="true" />Ver sitio público
          </NavLink>
          <button type="button" onClick={closeSession} className="inline-flex min-h-11 items-center gap-2 rounded-lg border-0 bg-white px-4 py-2 text-left text-sm font-semibold text-brand-ink hover:bg-brand-soft/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep">
            <LogOut className="size-4" aria-hidden="true" />Cerrar sesión
          </button>
        </nav>
        <main id="account-content" className="min-w-0"><Outlet /></main>
      </div>
    </div>
  )
}
