import { useState } from 'react'
import { ChevronRight, ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getErpNavigation, type ErpNavigationItem } from '@/app/navigation/erpNavigation'
import { getRoleName } from '@/shared/security/roles'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'

export function ErpLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const roleName = getRoleName(user?.role)
  const navigation = getErpNavigation(user?.permissionCodes)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tabletCollapsed, setTabletCollapsed] = useState(true)
  const pageLabel = findCurrentLabel(navigation, location.pathname)
  const userInitials = getInitials(user?.fullName)

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
    <div className="min-h-dvh bg-erp-canvas font-sans text-erp-text">
      <a className="skip-link" href="#erp-content">Saltar al contenido</a>
      <header className="sticky top-0 z-30 border-b border-erp-border bg-erp-surface-raised">
        <div className={`flex min-h-16 items-center gap-3 px-4 sm:px-6 md:pr-8 xl:pl-[18rem] ${tabletCollapsed ? 'md:pl-24' : 'md:pl-[18rem]'}`}>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon-sm" className="border-erp-border text-erp-text md:hidden" aria-label="Abrir navegación" />}>
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,20rem)] bg-erp-navigation p-0 text-erp-navigation-foreground" aria-label="Navegación móvil">
              <SheetHeader className="border-b border-white/15 px-5 py-5">
                <SheetTitle className="font-heading text-xl text-erp-navigation-foreground">Navegación móvil</SheetTitle>
                <SheetDescription className="text-erp-navigation-muted">SGI-Curime · Área de gestión</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">{navigationContent}</div>
            </SheetContent>
          </Sheet>
          <Button type="button" variant="outline" size="icon-sm" className="hidden border-erp-border bg-erp-surface-raised text-erp-text md:inline-flex xl:hidden" aria-controls="erp-sidebar-navigation" aria-label={tabletCollapsed ? 'Expandir navegación' : 'Contraer navegación'} aria-expanded={!tabletCollapsed} onClick={() => setTabletCollapsed((collapsed) => !collapsed)}>
            {tabletCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </Button>
          <div className="min-w-0 flex-1">
            <nav aria-label="Ubicación actual" className="flex min-w-0 items-center gap-1.5 text-caption font-medium text-erp-text-muted">
              <span className="shrink-0">Área de gestión</span><ChevronRight className="size-3 shrink-0 text-erp-text-muted/60" aria-hidden="true" /><span className="truncate font-semibold text-erp-text" aria-current="page">{pageLabel}</span>
            </nav>
            <p className="mt-0.5 hidden truncate text-caption text-erp-text-muted sm:block">Asociación de Desarrollo Integral de Curime</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 border-l border-erp-border pl-3 sm:gap-3 sm:pl-5">
            <span className="grid size-9 place-items-center rounded-full bg-erp-navigation text-label font-bold text-erp-navigation-foreground" aria-hidden="true">{userInitials}</span>
            <div className="min-w-0 text-right">
              <p className="max-w-32 truncate text-navigation font-semibold text-erp-text sm:max-w-56">{user?.fullName}</p>
              {roleName && <Badge variant="secondary" className="mt-0.5 bg-erp-surface-subtle text-erp-text-muted">{roleName}</Badge>}
            </div>
          </div>
        </div>
      </header>

      <aside id="erp-sidebar-navigation" className={`fixed inset-y-0 left-0 z-40 hidden border-r border-erp-navigation-hover bg-erp-navigation text-erp-navigation-foreground transition-[width] motion-reduce:transition-none md:flex md:flex-col xl:w-64 ${tabletCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        <div className="border-b border-white/15 px-4 py-5 xl:px-5">
          <p className={`font-heading text-2xl leading-none ${tabletCollapsed ? 'md:text-center md:text-xl xl:text-left xl:text-2xl' : ''}`}><span className={tabletCollapsed ? 'md:hidden xl:inline' : ''}>SGI-Curime</span><span className={tabletCollapsed ? 'hidden md:inline xl:hidden' : 'hidden'} aria-hidden="true">SGI</span></p>
          <p className={`mt-2 text-caption font-bold uppercase tracking-[0.16em] text-erp-navigation-muted ${tabletCollapsed ? 'md:sr-only xl:not-sr-only' : ''}`}>Área de gestión</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-5 [scrollbar-gutter:stable] xl:px-3"><ErpNavigation id="sidebar" currentPath={location.pathname} navigation={navigation} onNavigate={() => undefined} onExpand={() => setTabletCollapsed(false)} onLogout={closeSession} compact={tabletCollapsed} /></div>
      </aside>

      <main id="erp-content" className={`min-w-0 px-4 py-7 transition-[margin] motion-reduce:transition-none sm:px-6 md:px-8 xl:ml-64 xl:px-10 xl:py-9 ${tabletCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="mx-auto w-full max-w-[1440px]"><Outlet /></div>
      </main>
    </div>
  )
}

function findCurrentLabel(navigation: ReturnType<typeof getErpNavigation>, path: string) {
  for (const section of navigation) {
    for (const item of section.items) {
      if (item.path === path) return item.label
      const child = item.children?.find((candidate) => candidate.path === path)
      if (child) return child.label
    }
  }
  return 'Inicio'
}

function getInitials(fullName?: string) {
  if (!fullName) return 'U'
  return fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0]).join('').toUpperCase()
}

type NavigationProps = {
  id: string
  currentPath: string
  navigation: ReturnType<typeof getErpNavigation>
  onNavigate: () => void
  onExpand?: () => void
  onLogout: () => void
  compact?: boolean
}

function ErpNavigation({ id, currentPath, navigation, onNavigate, onExpand, onLogout, compact = false }: NavigationProps) {
  return (
    <nav id={`erp-${id}-navigation`} aria-label="Navegación del sistema" className="flex min-h-full flex-col">
      <div className="space-y-7">
        {navigation.map((section) => (
          <section key={section.label} aria-labelledby={`${id}-nav-${section.label.replace(/\s/g, '-').toLowerCase()}`}>
            <h2 id={`${id}-nav-${section.label.replace(/\s/g, '-').toLowerCase()}`} className={`px-3 text-caption font-bold uppercase tracking-[0.16em] text-erp-navigation-muted ${compact ? 'md:sr-only xl:not-sr-only' : ''}`}>{section.label}</h2>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => <NavigationItem key={item.label} item={item} currentPath={currentPath} onNavigate={onNavigate} onExpand={onExpand} compact={compact} />)}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-auto space-y-1 border-t border-white/15 pt-4">
        <Link to="/" onClick={onNavigate} title={compact ? 'Ver sitio público' : undefined} aria-label={compact ? 'Ver sitio público' : undefined} className="flex min-h-11 items-center gap-3 rounded-control px-3 text-navigation font-semibold text-erp-navigation-foreground transition-colors hover:bg-erp-navigation-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus">
          <ExternalLink className="size-4 shrink-0" aria-hidden="true" /> <span className={compact ? 'md:sr-only xl:not-sr-only' : ''}>Ver sitio público</span>
        </Link>
        <Button type="button" variant="danger" onClick={onLogout} title={compact ? 'Cerrar sesión' : undefined} aria-label={compact ? 'Cerrar sesión' : undefined} className="w-full justify-start rounded-control text-left">
          <LogOut className="size-4 shrink-0" aria-hidden="true" /> <span className={compact ? 'md:sr-only xl:not-sr-only' : ''}>Cerrar sesión</span>
        </Button>
      </div>
    </nav>
  )
}

function NavigationItem({ item, currentPath, onNavigate, onExpand, compact }: { item: ErpNavigationItem; currentPath: string; onNavigate: () => void; onExpand?: () => void; compact: boolean }) {
  const Icon = item.icon
  const activeChild = item.children?.find((child) => child.path === currentPath)
  const groupActive = activeChild !== undefined
  const handleNavigation = () => {
    if (item.children) onExpand?.()
    onNavigate()
  }
  return (
    <li>
        {item.path && (
          <NavLink end to={item.path} onClick={handleNavigation} title={compact ? item.label : undefined} aria-label={compact ? item.label : undefined} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-control px-3 text-navigation font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus ${groupActive ? 'bg-erp-navigation-hover text-erp-navigation-foreground' : isActive ? 'bg-erp-navigation-active text-erp-navigation-active-foreground shadow-sm' : 'text-erp-navigation-foreground hover:bg-erp-navigation-hover'}`}>
          {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}<span className={compact ? 'md:sr-only xl:not-sr-only' : ''}>{item.label}</span>
        </NavLink>
      )}
      {item.children && groupActive && (
        <ul className="ml-5 mt-1.5 space-y-1 border-l border-erp-navigation-muted/40 pl-3" aria-label={`Secciones de ${item.label}`}>
          {item.children.map((child) => <NavigationItem key={child.path} item={child} currentPath={currentPath} onNavigate={onNavigate} compact={compact} />)}
        </ul>
      )}
    </li>
  )
}
