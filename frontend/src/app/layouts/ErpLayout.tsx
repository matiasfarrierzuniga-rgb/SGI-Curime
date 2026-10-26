import { useState } from 'react'
import { Bell, ChevronDown, ChevronRight, ExternalLink, Landmark, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getErpNavigation, type ErpNavigationItem, type ErpNavigationSection, type NavigationAccent } from '@/app/navigation/erpNavigation'
import { getRoleName } from '@/shared/security/roles'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'

const accentClasses: Record<NavigationAccent, { label: string; rail: string; active: string }> = {
  lime: { label: 'text-[#B5DF52]', rail: 'bg-[#B5DF52]', active: 'bg-[#B5DF52]/15' },
  green: { label: 'text-[#42D69A]', rail: 'bg-[#42D69A]', active: 'bg-[#42D69A]/15' },
  cyan: { label: 'text-[#75B9FF]', rail: 'bg-[#75B9FF]', active: 'bg-[#75B9FF]/15' },
  blue: { label: 'text-[#FF9FAD]', rail: 'bg-[#FF9FAD]', active: 'bg-[#FF9FAD]/15' },
  teal: { label: 'text-[#53D8D0]', rail: 'bg-[#53D8D0]', active: 'bg-[#53D8D0]/15' },
  maize: { label: 'text-[#F3D45C]', rail: 'bg-[#F3D45C]', active: 'bg-[#F3D45C]/15' },
  terracotta: { label: 'text-[#F19A60]', rail: 'bg-[#F19A60]', active: 'bg-[#F19A60]/15' },
  violet: { label: 'text-[#B69AF1]', rail: 'bg-[#B69AF1]', active: 'bg-[#B69AF1]/15' },
}

export function ErpLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navigation = getErpNavigation(user?.permissionCodes)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(true)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const roleName = getRoleName(user?.role)
  const sidebarExpanded = sidebarPinned || sidebarHovered
  const pageLabel = findCurrentLabel(navigation, location.pathname)

  const closeSession = () => { setMobileOpen(false); logout(); navigate('/login', { replace: true }) }
  const sidebarNavigation = <ErpNavigation id="sidebar" currentPath={location.pathname} navigation={navigation} compact={!sidebarExpanded} onNavigate={() => undefined} onExpand={() => setSidebarPinned(true)} onLogout={closeSession} showActions={false} />

  return <div className="min-h-dvh bg-erp-canvas font-sans text-erp-text">
    <a className="skip-link" href="#erp-content">Saltar al contenido</a>
    <header className="sticky top-0 z-30 border-b border-erp-border bg-erp-surface-raised">
      <div className={`flex min-h-19 items-center gap-3 px-4 transition-[padding] duration-300 motion-reduce:transition-none sm:px-6 md:pr-8 ${sidebarPinned ? 'md:pl-[16.25rem]' : 'md:pl-24'}`}>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon-sm" className="border-erp-border text-erp-text md:hidden" aria-label="Abrir navegación" />}><Menu aria-hidden="true" /></SheetTrigger>
          <SheetContent side="left" className="w-[min(88vw,20rem)] gap-0 bg-erp-navigation p-0 text-erp-navigation-foreground" aria-label="Navegación móvil">
            <SheetHeader className="border-b border-white/15 px-5 py-5"><SheetTitle className="sr-only">Navegación móvil</SheetTitle><p className="font-heading text-xl text-erp-navigation-foreground">SGI-Curime</p><SheetDescription className="text-erp-navigation-muted">Área de gestión</SheetDescription></SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4"><ErpNavigation id="mobile" currentPath={location.pathname} navigation={navigation} onNavigate={() => setMobileOpen(false)} onLogout={closeSession} showActions={false} /></div>
            <SidebarActions onNavigate={() => setMobileOpen(false)} onLogout={closeSession} />
          </SheetContent>
        </Sheet>
        <button type="button" className="hidden size-9 place-items-center rounded-control !border-white/20 !bg-erp-navigation !p-0 !text-erp-navigation-foreground transition-colors hover:!bg-erp-navigation-hover focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-erp-focus md:grid" aria-controls="erp-sidebar-navigation" aria-label={sidebarPinned ? 'Contraer navegación' : 'Expandir navegación'} aria-expanded={sidebarPinned} onClick={() => setSidebarPinned(value => !value)}>{sidebarPinned ? <PanelLeftClose className="size-4" aria-hidden="true" /> : <PanelLeftOpen className="size-4" aria-hidden="true" />}</button>
        <div role="search" aria-label="Búsqueda no disponible" className="hidden max-w-xl flex-1 items-center gap-3 rounded-control bg-erp-surface-subtle px-4 py-3 text-body-small text-erp-text-muted lg:flex"><Search className="size-5 shrink-0 text-erp-text" aria-hidden="true" /><span>Buscar en el sistema...</span></div>
        <div className="min-w-0 flex-1 lg:hidden"><nav aria-label="Ubicación actual" className="flex min-w-0 items-center gap-1.5 text-caption font-medium text-erp-text-muted"><span className="shrink-0">Área de gestión</span><ChevronRight className="size-3 shrink-0 text-erp-text-muted/60" aria-hidden="true" /><span className="truncate font-semibold text-erp-text" aria-current="page">{pageLabel}</span></nav></div>
        <div className="flex shrink-0 items-center gap-3 border-l border-erp-border pl-3 sm:pl-5"><span className="grid size-9 place-items-center text-erp-text-muted" aria-hidden="true"><Bell className="size-5" /></span><span className="grid size-10 place-items-center rounded-full bg-erp-navigation text-label font-bold text-erp-navigation-foreground" aria-hidden="true">{getInitials(user?.fullName)}</span><div className="min-w-0 text-left"><p className="max-w-32 truncate text-navigation font-semibold text-erp-text sm:max-w-56">{user?.fullName}</p>{roleName ? <p className="mt-0.5 text-caption text-erp-text-muted">{roleName}</p> : null}</div><ChevronDown className="hidden size-4 text-erp-text sm:block" aria-hidden="true" /></div>
      </div>
    </header>

    <aside id="erp-sidebar-navigation" onMouseEnter={() => setSidebarHovered(true)} onMouseLeave={() => setSidebarHovered(false)} onFocusCapture={() => setSidebarHovered(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && !sidebarPinned) setSidebarHovered(false) }} className={`fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-erp-navigation-hover bg-erp-navigation text-erp-navigation-foreground shadow-xl transition-[width] duration-300 motion-reduce:transition-none md:flex md:flex-col ${sidebarExpanded ? 'w-[15.25rem]' : 'w-20'}`}>
      <div className="flex items-start justify-between border-b border-white/15 px-4 py-5"><div className={`flex items-center gap-3 ${sidebarExpanded ? '' : 'mx-auto'}`}><span className="grid size-10 place-items-center rounded-control bg-erp-navigation-active text-erp-navigation-foreground"><Landmark className="size-6" aria-hidden="true" /></span><div className={sidebarExpanded ? '' : 'sr-only'}><p className="font-heading text-2xl leading-none">SGI-Curime</p><p className="mt-1 text-caption font-medium text-erp-navigation-muted">ADI Curime</p></div></div>{sidebarExpanded ? <button type="button" className="grid size-9 shrink-0 place-items-center rounded-control !border-white/20 !bg-erp-navigation-hover !p-0 !text-erp-navigation-foreground transition-colors hover:!bg-erp-navigation-active focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-erp-focus" aria-label={sidebarPinned ? 'Contraer navegación' : 'Expandir navegación'} onClick={() => setSidebarPinned(value => !value)}>{sidebarPinned ? <PanelLeftClose className="size-4" aria-hidden="true" /> : <PanelLeftOpen className="size-4" aria-hidden="true" />}</button> : null}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4 [scrollbar-gutter:stable]">{sidebarNavigation}</div>
      <SidebarActions compact={!sidebarExpanded} onNavigate={() => undefined} onLogout={closeSession} />
    </aside>
    <main id="erp-content" className={`min-w-0 px-4 py-7 transition-[margin] duration-300 motion-reduce:transition-none sm:px-6 md:px-8 ${sidebarPinned ? 'md:ml-[15.25rem] xl:px-6 xl:py-9' : 'md:ml-20 xl:px-6 xl:py-9'}`}><div className="mx-auto w-full max-w-[1440px]"><Outlet /></div></main>
  </div>
}

function ErpNavigation({ id, currentPath, navigation, onNavigate, onExpand, onLogout, compact = false, showActions = true }: { id: string; currentPath: string; navigation: readonly ErpNavigationSection[]; onNavigate: () => void; onExpand?: () => void; onLogout: () => void; compact?: boolean; showActions?: boolean }) {
  return <nav id={`erp-${id}-navigation`} aria-label="Navegación del sistema" className="flex min-h-full flex-col"><div className="space-y-4">{navigation.map(section => <NavigationSection key={section.label} id={id} section={section} currentPath={currentPath} compact={compact} onNavigate={onNavigate} onExpand={onExpand} />)}</div>{showActions ? <SidebarActions compact={compact} onNavigate={onNavigate} onLogout={onLogout} /> : null}</nav>
}

function SidebarActions({ compact = false, onNavigate, onLogout }: { compact?: boolean; onNavigate: () => void; onLogout: () => void }) {
  return <div className="shrink-0 space-y-1 border-t border-white/15 px-2.5 py-3"><Link to="/" onClick={onNavigate} title={compact ? 'Ver sitio público' : undefined} aria-label={compact ? 'Ver sitio público' : undefined} className={`flex min-h-11 items-center gap-3 rounded-control bg-transparent px-3 text-navigation font-semibold text-erp-navigation-foreground transition-colors hover:bg-erp-navigation-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus ${compact ? 'justify-center' : ''}`}><ExternalLink className="size-5 shrink-0" aria-hidden="true" /><span className={compact ? 'sr-only' : ''}>Ver sitio público</span></Link><button type="button" onClick={onLogout} title={compact ? 'Cerrar sesión' : undefined} aria-label="Cerrar sesión" className={`flex min-h-11 w-full items-center gap-3 rounded-control !border-red-300/25 !bg-erp-navigation px-3 text-navigation font-semibold !text-red-200 transition-colors hover:!bg-red-500/15 hover:!text-red-100 focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-red-200 ${compact ? 'justify-center' : 'justify-start'}`}><LogOut className="size-5 shrink-0" aria-hidden="true" /><span className={compact ? 'sr-only' : ''}>Cerrar sesión</span></button></div>
}

function NavigationSection({ id, section, currentPath, compact, onNavigate, onExpand }: { id: string; section: ErpNavigationSection; currentPath: string; compact: boolean; onNavigate: () => void; onExpand?: () => void }) {
  const accent = accentClasses[section.accent]
  const activeItem = section.items.find(item => isCurrent(item, currentPath))
  const items = compact ? [activeItem ?? section.items[0]] : section.items
  const collapsible = id === 'mobile'
  const [open, setOpen] = useState(!collapsible || Boolean(activeItem))
  const headingId = `${id}-${section.label.replace(/\s/g, '-').toLowerCase()}`
  return <section aria-labelledby={headingId} className="relative"><span aria-hidden="true" className={`absolute bottom-0 left-0 top-0 w-0.75 rounded-full ${accent.rail}`} />{collapsible ? <button id={headingId} type="button" className={`flex min-h-10 w-full items-center justify-between px-3 text-left text-caption font-bold uppercase tracking-[0.14em] ${accent.label} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus`} aria-expanded={open} onClick={() => setOpen(value => !value)}>{section.label}{open ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}</button> : <h2 id={headingId} className={`px-3 text-caption font-bold uppercase tracking-[0.14em] ${accent.label} ${compact ? 'sr-only' : ''}`}>{section.label}</h2>}{(!collapsible || open) ? <ul className={`space-y-1 ${compact ? '' : 'mt-2'}`}>{items.map(item => <NavigationItem key={item.label} item={item} currentPath={currentPath} compact={compact} accent={accent} onNavigate={onNavigate} onExpand={onExpand} />)}</ul> : null}</section>
}

function NavigationItem({ item, currentPath, compact, accent, onNavigate, onExpand }: { item: ErpNavigationItem; currentPath: string; compact: boolean; accent: { label: string; rail: string; active: string }; onNavigate: () => void; onExpand?: () => void }) {
  const Icon = item.icon
  const active = isCurrent(item, currentPath)
  const [subnavOpen, setSubnavOpen] = useState(active)
  const hasChildren = Boolean(item.children?.length)
  const showChildren = !compact && hasChildren && (active || subnavOpen)
  const navigate = () => { if (compact && hasChildren) onExpand?.(); onNavigate() }
  return <li><div className={`group flex items-center rounded-control transition-colors ${active ? `${accent.active} text-white` : 'text-erp-navigation-foreground hover:bg-erp-navigation-hover'}`}><NavLink end to={item.path ?? '#'} onClick={navigate} title={compact ? item.label : undefined} aria-label={compact ? item.label : undefined} className={({ isActive }) => `flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-control bg-transparent px-3 text-navigation font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-erp-focus ${(isActive || active) ? 'text-white' : ''} ${compact ? 'justify-center' : ''}`}>{Icon ? <Icon className="size-5 shrink-0" aria-hidden="true" /> : null}<span className={compact ? 'sr-only' : 'truncate'}>{item.label}</span></NavLink>{hasChildren && !compact ? <button type="button" className="mr-1 grid size-9 place-items-center rounded-control !border-transparent !bg-transparent !p-0 !text-erp-navigation-foreground hover:!bg-white/10 focus-visible:!outline-2 focus-visible:!outline-erp-focus" aria-label={`${showChildren ? 'Contraer' : 'Expandir'} ${item.label}`} aria-expanded={showChildren} onClick={() => setSubnavOpen(value => !value)}>{showChildren ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}</button> : null}</div>{showChildren ? <ul className="ml-5 mt-1 space-y-1 border-l border-white/20 pl-3">{item.children!.map(child => <NavigationItem key={child.label} item={child} currentPath={currentPath} compact={false} accent={accent} onNavigate={onNavigate} />)}</ul> : null}</li>
}

function isCurrent(item: ErpNavigationItem, path: string) { return item.path === path || item.children?.some(child => child.path === path) === true }
function findCurrentLabel(navigation: readonly ErpNavigationSection[], path: string) { for (const section of navigation) for (const item of section.items) { if (item.path === path) return item.label; const child = item.children?.find(candidate => candidate.path === path); if (child) return child.label } return 'Inicio' }
function getInitials(fullName?: string) { return fullName?.split(/\s+/).filter(Boolean).slice(0, 2).map(name => name[0]).join('').toUpperCase() || 'U' }
