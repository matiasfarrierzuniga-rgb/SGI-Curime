import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight, Building2, CalendarCheck2, CalendarClock, CalendarDays, ChevronRight, CircleUserRound,
  ClipboardList, ContactRound, FilePenLine, Files, HandHeart, HeartHandshake, House, Package,
  Presentation, ScrollText, Store, Tags, TriangleAlert, UserRoundCog, UserRoundPlus, UsersRound, Wallet,
} from 'lucide-react'
import { hasCapability, type AccessCapability } from '@/shared/security/access'

export type NavigationAccent = 'lime' | 'green' | 'cyan' | 'blue' | 'teal' | 'maize' | 'terracotta' | 'violet'

export type ErpNavigationItem = { label: string; path?: string; capability?: AccessCapability; anyOfCapabilities?: readonly AccessCapability[]; icon?: LucideIcon; children?: readonly ErpNavigationItem[] }
export type ErpNavigationSection = { label: string; accent: NavigationAccent; items: readonly ErpNavigationItem[] }

const navigation: readonly ErpNavigationSection[] = [
  { label: 'Panel principal', accent: 'lime', items: [{ label: 'Inicio', path: '/app/dashboard', capability: 'erp.dashboard.read', icon: House }] },
  {
    label: 'Gobierno institucional', accent: 'green', items: [
      { label: 'Perfil institucional', path: '/app/admin/institutional-profile', capability: 'adm.institutional-profile.read', icon: Building2 },
      { label: 'Junta Directiva', path: '/app/admin/institutional-board', capability: 'adm.institutional-board.read', icon: UsersRound },
      { label: 'Asambleas', path: '/app/admin/assemblies', capability: 'adm.assemblies.read', icon: Presentation },
      { label: 'Mis asambleas', path: '/app/assemblies/mine', icon: CalendarCheck2 },
    ],
  },
  {
    label: 'Personas y accesos', accent: 'cyan', items: [
      { label: 'Usuarios', path: '/admin/users', capability: 'usr.users.read', icon: UserRoundCog },
      { label: 'Afiliados', path: '/app/admin/affiliates', capability: 'adm.affiliates.read', icon: ContactRound },
      { label: 'Solicitudes de cuenta', path: '/admin/user-requests', capability: 'usr.user-requests.read', icon: UserRoundPlus },
      { label: 'Solicitudes de afiliación', path: '/app/admin/requests', capability: 'adm.requests.read', icon: ClipboardList },
      { label: 'Justificaciones de ausencia', path: '/app/admin/absence-justifications', capability: 'adm.justifications.read', icon: Files },
    ],
  },
  {
    label: 'Desarrollo comunitario', accent: 'blue', items: [
      { label: 'Eventos', path: '/app/events', capability: 'pub.events.manage', icon: CalendarDays },
      { label: 'Emprendimientos', path: '/app/admin/ventures/summary', capability: 'ent.ventures.read', icon: Store, children: [{ label: 'Resumen', path: '/app/admin/ventures/summary', capability: 'ent.ventures.read', icon: ChevronRight }, { label: 'Directorio', path: '/app/admin/ventures', capability: 'ent.ventures.read', icon: Store }] },
      { label: 'Voluntariado', path: '/app/admin/volunteering', capability: 'vol.opportunities.read', icon: HandHeart },
    ],
  },
  {
    label: 'Recursos y operaciones', accent: 'teal', items: [
      { label: 'Reservas', path: '/app/reservations', capability: 'res.reservations.read', icon: CalendarClock },
      { label: 'Inventario', path: '/inventory', capability: 'inv.inventory.read', icon: Package, children: [{ label: 'Resumen', path: '/inventory', icon: Package }, { label: 'Artículos', path: '/inventory/items', icon: Package }, { label: 'Categorías', path: '/inventory/categories', icon: Tags }, { label: 'Movimientos', path: '/inventory/movements', icon: ArrowLeftRight }, { label: 'Préstamos', path: '/inventory/loans', icon: ContactRound }, { label: 'Alertas', path: '/inventory/alerts', icon: TriangleAlert }, { label: 'Reportes', path: '/inventory/reports', icon: ScrollText }] },
    ],
  },
  { label: 'Finanzas', accent: 'maize', items: [{ label: 'Finanzas', path: '/app/financial/dashboard', icon: Wallet, children: [{ label: 'Dashboard financiero', path: '/app/financial/dashboard', anyOfCapabilities: ['fin.movements.read', 'fin.charges.read'], icon: Wallet }, { label: 'Resumen', path: '/app/financial', capability: 'fin.charges.read', icon: Wallet }, { label: 'Movimientos financieros', path: '/app/financial/movements', capability: 'fin.movements.read', icon: ArrowLeftRight }, { label: 'DINADECO', path: '/app/financial/dinadeco', capability: 'fin.dinadeco.read', icon: ScrollText }] }, { label: 'Donaciones', path: '/app/donations', capability: 'don.donations.read', icon: HeartHandshake }] },
  { label: 'Seguridad y auditoría', accent: 'terracotta', items: [{ label: 'Bitácora', path: '/admin/audit-logs', capability: 'aud.logs.read', icon: ScrollText }] },
  { label: 'Mi espacio', accent: 'violet', items: [{ label: 'Mi perfil', path: '/app/profile', icon: CircleUserRound }, { label: 'Enviar justificación', path: '/app/affiliate/absence-justifications/new', icon: FilePenLine }, { label: 'Mis justificaciones', path: '/app/affiliate/justifications', icon: Files }] },
]

function isVisible(item: ErpNavigationItem, permissionCodes: readonly string[] | null | undefined) {
  return (item.capability === undefined || hasCapability(permissionCodes, item.capability))
    && (item.anyOfCapabilities === undefined || item.anyOfCapabilities.some(capability => hasCapability(permissionCodes, capability)))
}

export function getErpNavigation(permissionCodes: readonly string[] | null | undefined): ErpNavigationSection[] {
  return navigation.flatMap((section) => {
    const items = section.items.flatMap((item) => {
      const children = item.children?.filter((child) => isVisible(child, permissionCodes))
      if (!isVisible(item, permissionCodes) || (item.children !== undefined && children?.length === 0)) return []
      return [{ ...item, path: children?.[0]?.path ?? item.path, children }]
    })
    return items.length ? [{ ...section, items }] : []
  })
}

export function getErpEntryPath(permissionCodes: readonly string[] | null | undefined): string {
  if (hasCapability(permissionCodes, 'erp.dashboard.read')) return '/app/dashboard'
  if (hasCapability(permissionCodes, 'fin.charges.read')) return '/app/financial'
  if (hasCapability(permissionCodes, 'inv.inventory.read')) return '/inventory'
  for (const section of getErpNavigation(permissionCodes)) for (const item of section.items) {
    if (item.capability && item.path) return item.path
    const child = item.children?.find((candidate) => candidate.capability && candidate.path)
    if (child?.path) return child.path
  }
  return '/app/profile'
}
