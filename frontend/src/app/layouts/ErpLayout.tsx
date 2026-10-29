import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { NotificationCenter } from '@/features/notifications'
import { getErpNavigation, type ErpNavigationItem, type ErpNavigationSection, type NavigationAccent } from '@/app/navigation/erpNavigation'
import { getRoleName } from '@/shared/security/roles'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'

const accentClasses: Record<NavigationAccent, { label: string; rail: string; active: string }> = {
  lime: { label: '!text-[#B5DF52]', rail: 'bg-[#B5DF52]', active: 'bg-[#B5DF52]/15' },
  green: { label: '!text-[#42D69A]', rail: 'bg-[#42D69A]', active: 'bg-[#42D69A]/15' },
  cyan: { label: '!text-[#89C3FF]', rail: 'bg-[#89C3FF]', active: 'bg-[#89C3FF]/15' },
  blue: { label: '!text-[#FF9FAD]', rail: 'bg-[#FF9FAD]', active: 'bg-[#FF9FAD]/15' },
  teal: { label: '!text-[#53D8D0]', rail: 'bg-[#53D8D0]', active: 'bg-[#53D8D0]/15' },
  maize: { label: '!text-[#F3D45C]', rail: 'bg-[#F3D45C]', active: 'bg-[#F3D45C]/15' },
  terracotta: { label: '!text-[#F4AF81]', rail: 'bg-[#F4AF81]', active: 'bg-[#F4AF81]/15' },
  violet: { label: '!text-[#C9B5F5]', rail: 'bg-[#C9B5F5]', active: 'bg-[#C9B5F5]/15' },
}

export function ErpLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navigation = getErpNavigation(user?.permissionCodes)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(true)
  const roleName = getRoleName(user?.role)
  const sidebarExpanded = sidebarPinned
  const pageLabel = findCurrentLabel(navigation, location.pathname)

  const toggleSidebar = () => setSidebarPinned(value => !value)
  const closeSession = () => { setMobileOpen(false); logout(); navigate('/login', { replace: true }) }
  const sidebarNavigation = <ErpNavigation id="sidebar" currentPath={location.pathname} navigation={navigation} compact={!sidebarExpanded} onNavigate={() => undefined} onExpand={() => setSidebarPinned(true)} onLogout={closeSession} showActions={false} />

  return <div className="min-h-dvh bg-erp-canvas font-sans text-erp-text">
    <a className="skip-link" href="#erp-content">Saltar al contenido</a>
    <header className="sticky top-0 z-30 border-b border-erp-border bg-erp-surface-raised">
      <div className={`flex min-h-[4.5rem] items-center gap-3 px-4 transition-[padding] duration-200 motion-reduce:transition-none sm:px-6 md:pr-8 ${sidebarExpanded ? 'md:pl-72' : 'md:pl-28'}`}>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon-sm" className="border-erp-border text-erp-text md:hidden" aria-label="Abrir navegación" />}><Menu aria-hidden="true" /></SheetTrigger>
          <SheetContent side="left" className="w-[min(88vw,20rem)] gap-0 bg-erp-navigation p-0 text-erp-navigation-foreground" aria-label="Navegación móvil">
            <SheetHeader className="border-b border-white/15 px-5 py-5"><SheetTitle className="sr-only">Navegación móvil</SheetTitle><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-ivory shadow-[0_4px_12px_rgba(0,0,0,0.16)]"><img src="/brand/adi-curime-mark-color.png" alt="" width="1254" height="1254" className="block size-full scale-[1.15] object-contain" /></span><div><p className="font-heading text-xl text-erp-navigation-foreground">SGI-Curime</p><SheetDescription className="text-erp-navigation-muted">Área de gestión</SheetDescription></div></div></SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4"><ErpNavigation id="mobile" currentPath={location.pathname} navigation={navigation} onNavigate={() => setMobileOpen(false)} onLogout={closeSession} showActions={false} /></div>
            <SidebarActions onNavigate={() => setMobileOpen(false)} onLogout={closeSession} />
          </SheetContent>
        </Sheet>
        <nav aria-label="Ubicación actual" className="flex min-w-0 flex-1 items-center gap-1.5 text-caption font-medium text-erp-text-muted"><span className="hidden shrink-0 sm:inline">Área de gestión</span><ChevronRight className="hidden size-3 shrink-0 text-erp-text-muted/60 sm:block" aria-hidden="true" /><span className="truncate font-semibold text-erp-text" aria-current="page">{pageLabel}</span></nav>
        <div className="flex shrink-0 items-center gap-2 border-l border-erp-border pl-2 sm:gap-3 sm:pl-5"><NotificationCenter /><ProfileMenu fullName={user?.fullName} email={user?.email} roleName={roleName} onNavigate={navigate} onLogout={closeSession} /></div>
      </div>
    </header>

    <aside id="erp-sidebar-navigation" className={`fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-black/15 bg-[linear-gradient(160deg,#075442_0%,#043d31_52%,#023126_100%)] text-erp-navigation-foreground shadow-xl transition-[width] duration-200 motion-reduce:transition-none md:flex md:flex-col ${sidebarExpanded ? 'w-64' : 'w-20'}`}>
      <div className={`relative flex border-b border-white/12 ${sidebarExpanded ? 'items-center justify-between px-4 py-4' : 'flex-col items-center gap-3 px-2 py-4'}`}>
        <div className={`flex min-w-0 items-center ${sidebarExpanded ? 'gap-3' : 'mx-auto'}`}>
          <span className={`grid place-items-center overflow-hidden rounded-xl bg-brand-ivory shadow-[0_4px_12px_rgba(0,0,0,0.16)] ${sidebarExpanded ? 'size-13' : 'size-12'}`}><img src="/brand/adi-curime-mark-color.png" alt="" width="1254" height="1254" className="block size-full scale-[1.15] object-contain" /></span>
          <div className={sidebarExpanded ? 'min-w-0' : 'sr-only'}><p className="truncate text-label font-bold tracking-[-0.01em] text-white">SGI-Curime</p><p className="mt-0.5 text-caption font-semibold tracking-[0.08em] text-erp-navigation-muted">ADI Curime</p></div>
        </div>
        <button type="button" className={`grid shrink-0 place-items-center !rounded-control !border-white/15 !bg-white/[0.04] !p-0 !text-erp-navigation-foreground transition-colors hover:!bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus ${sidebarExpanded ? 'size-12' : 'size-11'}`} aria-controls="erp-sidebar-navigation" aria-label={sidebarPinned ? 'Contraer navegación' : 'Expandir navegación'} aria-expanded={sidebarExpanded} onClick={toggleSidebar}>{sidebarPinned ? <PanelLeftClose className="size-5" aria-hidden="true" /> : <PanelLeftOpen className="size-5" aria-hidden="true" />}</button>
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/18 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/32">{sidebarNavigation}</div>
      <SidebarActions compact={!sidebarExpanded} onNavigate={() => undefined} onLogout={closeSession} />
    </aside>
    <main id="erp-content" className={`min-w-0 px-4 py-7 transition-[margin] duration-200 motion-reduce:transition-none sm:px-6 md:px-8 ${sidebarExpanded ? 'md:ml-64 xl:px-6 xl:py-9' : 'md:ml-20 xl:px-6 xl:py-9'}`}><div className="mx-auto w-full max-w-[1440px]"><Outlet /></div></main>
  </div>
}

function ProfileMenu({ fullName, email, roleName, onNavigate, onLogout }: { fullName?: string; email?: string; roleName?: string; onNavigate: ReturnType<typeof useNavigate>; onLogout: () => void }) {
  return <MenuPrimitive.Root modal={false}><MenuPrimitive.Trigger className="flex min-w-0 items-center gap-2 rounded-control !border-transparent !bg-transparent !p-1 text-left transition-colors hover:!bg-erp-surface-subtle focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-erp-navigation sm:gap-3" aria-label="Abrir menú de cuenta"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-erp-navigation text-label font-bold text-erp-navigation-foreground" aria-hidden="true">{getInitials(fullName)}</span><span className="hidden min-w-0 text-left sm:block"><span className="block max-w-32 truncate text-navigation font-semibold text-erp-text md:max-w-44 lg:max-w-56">{fullName}</span>{roleName ? <span className="mt-0.5 block truncate text-caption text-erp-text-muted">{roleName}</span> : null}</span><ChevronDown className="hidden size-4 shrink-0 text-erp-text md:block" aria-hidden="true" /></MenuPrimitive.Trigger><MenuPrimitive.Portal><MenuPrimitive.Positioner side="bottom" align="end" sideOffset={8} className="z-50"><MenuPrimitive.Popup className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-surface border border-erp-border bg-erp-surface-raised p-1 shadow-xl outline-none"><div className="border-b border-erp-border px-3 py-3"><p className="truncate text-body-small font-bold text-erp-text">{fullName}</p>{email ? <p className="mt-0.5 truncate text-caption text-erp-text-muted">{email}</p> : null}{roleName ? <p className="mt-1.5 text-caption font-medium text-erp-navigation">{roleName}</p> : null}</div><div className="py-1"><MenuPrimitive.Item className="flex min-h-10 w-full items-center gap-2 rounded-control px-3 text-body-small font-semibold text-erp-text outline-none data-highlighted:bg-erp-surface-subtle data-highlighted:text-erp-navigation" onClick={() => onNavigate('/app/profile')}><UserRound className="size-4" aria-hidden="true" />Mi perfil</MenuPrimitive.Item><MenuPrimitive.Item className="flex min-h-10 w-full items-center gap-2 rounded-control px-3 text-body-small font-semibold text-erp-text outline-none data-highlighted:bg-erp-surface-subtle data-highlighted:text-erp-navigation" onClick={() => onNavigate('/app/profile#cambiar-contrasena')}><KeyRound className="size-4" aria-hidden="true" />Cambiar contraseña</MenuPrimitive.Item></div><MenuPrimitive.Separator className="my-1 h-px bg-erp-border" /><MenuPrimitive.Item className="flex min-h-10 w-full items-center gap-2 rounded-control px-3 text-body-small font-semibold text-status-danger outline-none data-highlighted:bg-status-danger-surface" onClick={onLogout}><LogOut className="size-4" aria-hidden="true" />Cerrar sesión</MenuPrimitive.Item></MenuPrimitive.Popup></MenuPrimitive.Positioner></MenuPrimitive.Portal></MenuPrimitive.Root>
}

function ErpNavigation({ id, currentPath, navigation, onNavigate, onExpand, onLogout, compact = false, showActions = true }: { id: string; currentPath: string; navigation: readonly ErpNavigationSection[]; onNavigate: () => void; onExpand?: () => void; onLogout: () => void; compact?: boolean; showActions?: boolean }) {
  return <nav id={`erp-${id}-navigation`} aria-label="Navegación del sistema" className="flex min-h-full flex-col"><div className="space-y-6">{navigation.map(section => <NavigationSection key={section.label} id={id} section={section} currentPath={currentPath} compact={compact} onNavigate={onNavigate} onExpand={onExpand} />)}</div>{showActions ? <SidebarActions compact={compact} onNavigate={onNavigate} onLogout={onLogout} /> : null}</nav>
}

function SidebarActions({ compact = false, onNavigate, onLogout }: { compact?: boolean; onNavigate: () => void; onLogout: () => void }) {
  const publicActionClass = compact ? 'mx-auto grid size-12 place-items-center rounded-control border border-white/20 bg-white/[0.05] text-erp-navigation-foreground transition-colors hover:bg-white/[0.13] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus' : 'flex min-h-11 items-center gap-3 rounded-control border border-white/20 bg-white/[0.05] px-3 text-navigation font-semibold text-erp-navigation-foreground transition-colors hover:bg-white/[0.13] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus'
  const logoutActionClass = compact ? 'mx-auto grid size-12 place-items-center !rounded-control !border-red-300/40 !bg-red-500/10 !p-0 !text-red-100 transition-colors hover:!bg-red-500/20 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200' : 'flex min-h-11 w-full items-center gap-3 !rounded-control !border-red-300/40 !bg-red-500/10 !px-3 text-navigation font-semibold !text-red-100 transition-colors hover:!bg-red-500/20 active:translate-y-px focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-red-200'
  return <div className={`shrink-0 space-y-2 border-t border-white/12 bg-black/10 ${compact ? 'px-2 py-3' : 'px-3 py-3'}`}><Link to="/" onClick={onNavigate} title={compact ? 'Ver sitio público' : undefined} aria-label={compact ? 'Ver sitio público' : undefined} className={publicActionClass}><ExternalLink className="size-5 shrink-0" aria-hidden="true" /><span className={compact ? 'sr-only' : ''}>Ver sitio público</span></Link><button type="button" onClick={onLogout} title={compact ? 'Cerrar sesión' : undefined} aria-label="Cerrar sesión" className={logoutActionClass}><LogOut className="size-5 shrink-0" aria-hidden="true" /><span className={compact ? 'sr-only' : ''}>Cerrar sesión</span></button></div>
}

function NavigationSection({ id, section, currentPath, compact, onNavigate, onExpand }: { id: string; section: ErpNavigationSection; currentPath: string; compact: boolean; onNavigate: () => void; onExpand?: () => void }) {
  const accent = accentClasses[section.accent]
  const activeItem = section.items.find(item => isCurrent(item, currentPath))
  const items = compact ? [activeItem ?? section.items[0]] : section.items
  const collapsible = id === 'mobile'
  const [open, setOpen] = useState(!collapsible || Boolean(activeItem))
  const headingId = `${id}-${section.label.replace(/\s/g, '-').toLowerCase()}`
  const headingClass = `flex min-h-8 items-center gap-2 px-3 text-caption font-bold uppercase tracking-[0.14em] ${accent.label} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus`
  return <section aria-labelledby={headingId}><>{collapsible ? <button id={headingId} type="button" className={`${headingClass} w-full justify-between !rounded-control !border-transparent !bg-transparent !p-0 !text-left`} aria-expanded={open} onClick={() => setOpen(value => !value)}><span className="flex items-center gap-2"><span aria-hidden="true" className={`size-1.5 rounded-full ${accent.rail}`} />{section.label}</span>{open ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}</button> : <h2 id={headingId} className={`${headingClass} ${compact ? 'sr-only' : ''}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${accent.rail}`} />{section.label}</h2>}{(!collapsible || open) ? <ul className={`space-y-1.5 ${compact ? '' : 'mt-2'}`}>{items.map(item => <NavigationItem key={item.label} navigationId={id} item={item} currentPath={currentPath} compact={compact} accent={accent} onNavigate={onNavigate} onExpand={onExpand} />)}</ul> : null}</></section>
}

function NavigationItem({ navigationId, item, currentPath, compact, accent, onNavigate, onExpand }: { navigationId: string; item: ErpNavigationItem; currentPath: string; compact: boolean; accent: { label: string; rail: string; active: string }; onNavigate: () => void; onExpand?: () => void }) {
  const Icon = item.icon
  const active = isCurrent(item, currentPath)
  const [subnavOpen, setSubnavOpen] = useState(active)
  const hasChildren = Boolean(item.children?.length)
  const submenuId = `${navigationId}-${item.label.replace(/\s/g, '-').toLowerCase()}-subnav`
  useEffect(() => { if (active) setSubnavOpen(true) }, [active, currentPath])
  const showChildren = !compact && hasChildren && subnavOpen
  const navigate = () => { if (compact && hasChildren) onExpand?.(); onNavigate() }
  return <li><div className={`group relative flex items-center rounded-control transition-colors ${active ? `${accent.active} shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] text-white` : 'text-erp-navigation-foreground hover:bg-white/[0.09]'}`}><span aria-hidden="true" className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${accent.rail} transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`} /><NavLink end to={item.path ?? '#'} onClick={navigate} title={compact ? item.label : undefined} aria-label={compact ? item.label : undefined} className={({ isActive }) => `flex min-h-12 min-w-0 flex-1 items-center gap-3.5 rounded-control bg-transparent px-3.5 text-navigation font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus ${(isActive || active) ? 'text-white' : ''} ${compact ? 'justify-center px-0' : ''}`}>{Icon ? <Icon className="size-5 shrink-0" aria-hidden="true" /> : null}<span className={compact ? 'sr-only' : item.label === 'Dashboard financiero' ? 'min-w-0 text-[0.8125rem] leading-tight whitespace-normal' : 'min-w-0 truncate'}>{item.label}</span></NavLink>{hasChildren && !compact ? <button type="button" className="mr-1 grid size-10 place-items-center !rounded-control !border-transparent !bg-transparent !p-0 !text-erp-navigation-foreground transition-colors hover:!bg-white/10 focus-visible:!outline-2 focus-visible:!outline-erp-focus" aria-controls={submenuId} aria-label={`${showChildren ? 'Contraer' : 'Expandir'} ${item.label}`} aria-expanded={showChildren} onClick={() => setSubnavOpen(value => !value)}>{showChildren ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}</button> : null}</div>{showChildren ? <ul id={submenuId} className="ml-5 mt-1.5 space-y-1.5 border-l border-white/15 pl-3">{item.children!.map(child => <NavigationItem key={child.label} navigationId={navigationId} item={child} currentPath={currentPath} compact={false} accent={accent} onNavigate={onNavigate} />)}</ul> : null}</li>
}

function isCurrent(item: ErpNavigationItem, path: string) { return item.path === path || item.children?.some(child => child.path === path) === true }
function findCurrentLabel(navigation: readonly ErpNavigationSection[], path: string) { for (const section of navigation) for (const item of section.items) { if (item.path === path) return item.label; const child = item.children?.find(candidate => candidate.path === path); if (child) return child.label } return 'Inicio' }
function getInitials(fullName?: string) { return fullName?.split(/\s+/).filter(Boolean).slice(0, 2).map(name => name[0]).join('').toUpperCase() || 'U' }
