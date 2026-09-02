import { useState } from 'react'
import { CircleUserRound, ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getErpNavigation, type ErpNavigationItem } from '@/app/navigation/erpNavigation'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'

export function ErpLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navigation = getErpNavigation(user?.role)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tabletCollapsed, setTabletCollapsed] = useState(true)

  const closeSession = () => {
    setMobileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const navigationContent = (
    <ErpNavigation
      id="mobile"
      currentPath={location.pathname}
      navigation={navigation}
      onNavigate={() => setMobileOpen(false)}
      onLogout={closeSession}
    />
  )

  return (
    <div className="min-h-dvh bg-brand-ivory font-sans text-brand-ink">
      <a className="skip-link" href="#erp-content">Saltar al contenido</a>
      <header className="sticky top-0 z-30 border-b border-brand-sage/60 bg-white/95 backdrop-blur">
        <div className={`flex min-h-16 items-center gap-3 px-4 sm:px-6 md:pr-8 xl:pl-[18rem] ${tabletCollapsed ? 'md:pl-24' : 'md:pl-[18rem]'}`}>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon-lg" className="md:hidden" aria-label="Abrir navegación" />}>
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,20rem)] bg-white p-0" aria-label="Navegación móvil">
              <SheetHeader className="border-b border-border px-5 py-5">
                <SheetTitle className="font-heading text-xl text-brand-deep">Navegación móvil</SheetTitle>
                <SheetDescription>SGI-Curime · Área de gestión</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">{navigationContent}</div>
            </SheetContent>
          </Sheet>
          <Button type="button" variant="outline" size="icon-lg" className="hidden md:inline-flex xl:hidden" aria-label={tabletCollapsed ? 'Expandir navegación' : 'Contraer navegación'} aria-expanded={!tabletCollapsed} onClick={() => setTabletCollapsed((collapsed) => !collapsed)}>
            {tabletCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-deep">Área de gestión</p>
            <p className="hidden truncate text-xs text-foreground-muted sm:block">Asociación de Desarrollo Integral de Curime</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="max-w-40 truncate text-sm font-semibold text-brand-ink sm:max-w-64">{user?.fullName}</p>
            {user?.role && <Badge variant="secondary" className="mt-1">{user.role}</Badge>}
          </div>
        </div>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-brand-sage/60 bg-brand-deep text-brand-ivory transition-[width] motion-reduce:transition-none md:flex md:flex-col xl:w-64 ${tabletCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        <div className="border-b border-white/15 px-6 py-5">
          <p className={`font-heading text-2xl ${tabletCollapsed ? 'md:text-center md:text-xl xl:text-left xl:text-2xl' : ''}`}><span className={tabletCollapsed ? 'md:hidden xl:inline' : ''}>SGI-Curime</span><span className={tabletCollapsed ? 'hidden md:inline xl:hidden' : 'hidden'} aria-hidden="true">SGI</span></p>
          <p className={`mt-1 text-xs font-bold uppercase tracking-[0.12em] text-brand-accent ${tabletCollapsed ? 'md:sr-only xl:not-sr-only' : ''}`}>Área de gestión</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4"><ErpNavigation id="sidebar" currentPath={location.pathname} navigation={navigation} onNavigate={() => undefined} onLogout={closeSession} compact={tabletCollapsed} /></div>
      </aside>

      <main id="erp-content" className={`min-w-0 px-4 py-7 transition-[margin] motion-reduce:transition-none sm:px-6 md:px-8 xl:ml-64 xl:px-10 xl:py-9 ${tabletCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="mx-auto w-full max-w-[1280px]"><Outlet /></div>
      </main>
    </div>
  )
}

type NavigationProps = {
  id: string
  currentPath: string
  navigation: ReturnType<typeof getErpNavigation>
  onNavigate: () => void
  onLogout: () => void
  compact?: boolean
}

function ErpNavigation({ id, currentPath, navigation, onNavigate, onLogout, compact = false }: NavigationProps) {
  return (
    <nav aria-label="Navegación del sistema" className="flex min-h-full flex-col">
      <div className="space-y-5">
        {navigation.map((section) => (
          <section key={section.label} aria-labelledby={`${id}-nav-${section.label.replace(/\s/g, '-').toLowerCase()}`}>
            <h2 id={`${id}-nav-${section.label.replace(/\s/g, '-').toLowerCase()}`} className={`px-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-current opacity-65 ${compact ? 'md:sr-only xl:not-sr-only' : ''}`}>{section.label}</h2>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => <NavigationItem key={item.label} item={item} currentPath={currentPath} onNavigate={onNavigate} compact={compact} />)}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-auto space-y-1 border-t border-current/15 pt-4">
        <Link to="/mi-cuenta" onClick={onNavigate} title={compact ? 'Mi cuenta' : undefined} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-current hover:bg-brand-soft/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">
          <CircleUserRound className="size-4 shrink-0" aria-hidden="true" /> <span className={compact ? 'md:sr-only xl:not-sr-only' : ''}>Mi cuenta</span>
        </Link>
        <Link to="/" onClick={onNavigate} title={compact ? 'Ver sitio público' : undefined} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-current hover:bg-brand-soft/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">
          <ExternalLink className="size-4 shrink-0" aria-hidden="true" /> <span className={compact ? 'md:sr-only xl:not-sr-only' : ''}>Ver sitio público</span>
        </Link>
        <button type="button" onClick={onLogout} title={compact ? 'Cerrar sesión' : undefined} className="flex min-h-11 w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left text-sm font-semibold text-current hover:bg-brand-soft/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent">
          <LogOut className="size-4 shrink-0" aria-hidden="true" /> <span className={compact ? 'md:sr-only xl:not-sr-only' : ''}>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  )
}

function NavigationItem({ item, currentPath, onNavigate, compact }: { item: ErpNavigationItem; currentPath: string; onNavigate: () => void; compact: boolean }) {
  const Icon = item.icon
  const groupActive = item.children?.some((child) => child.path === currentPath) ?? false
  return (
    <li>
      {item.path && (
        <NavLink end={item.path === '/app' || item.path === '/inventory'} to={item.path} onClick={onNavigate} title={compact ? item.label : undefined} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent ${(isActive || groupActive) ? 'bg-brand-accent text-brand-deep shadow-sm' : 'text-current hover:bg-brand-soft/20'}`}>
          {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}<span className={compact ? 'md:sr-only xl:not-sr-only' : ''}>{item.label}</span>
        </NavLink>
      )}
      {item.children && groupActive && (
        <ul className="ml-5 mt-1 space-y-1 border-l border-current/25 pl-3" aria-label={`Secciones de ${item.label}`}>
          {item.children.map((child) => <NavigationItem key={child.path} item={child} currentPath={currentPath} onNavigate={onNavigate} compact={compact} />)}
        </ul>
      )}
    </li>
  )
}
