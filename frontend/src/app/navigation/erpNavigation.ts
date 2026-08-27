import type { LucideIcon } from 'lucide-react'
import { ArrowLeftRight, Boxes, ChartNoAxesCombined, ClipboardList, FileClock, Handshake, Home, Package, Tags, TriangleAlert, UserRound, Users } from 'lucide-react'
import { hasAuthenticatedSessionCapability, hasCapability, type AccessCapability } from '@/shared/security/access'

export type ErpNavigationItem = {
  label: string
  path?: string
  capability?: AccessCapability
  icon?: LucideIcon
  children?: readonly ErpNavigationItem[]
}

export type ErpNavigationSection = { label: string; items: readonly ErpNavigationItem[] }

const navigation: readonly ErpNavigationSection[] = [
  { label: 'General', items: [{ label: 'Dashboard', path: '/app', capability: 'erp.dashboard.read', icon: Home }] },
  {
    label: 'Gestión administrativa',
    items: [
      { label: 'Usuarios', path: '/admin/users', capability: 'usr.users.read', icon: Users },
      { label: 'Solicitudes', path: '/admin/user-requests', capability: 'adm.requests.read', icon: ClipboardList },
    ],
  },
  {
    label: 'Operación',
    items: [{
      label: 'Inventario', path: '/inventory', capability: 'inv.inventory.read', icon: Boxes,
      children: [
        { label: 'Resumen', path: '/inventory', icon: Boxes },
        { label: 'Artículos', path: '/inventory/items', icon: Package },
        { label: 'Categorías', path: '/inventory/categories', icon: Tags },
        { label: 'Movimientos', path: '/inventory/movements', icon: ArrowLeftRight },
        { label: 'Préstamos', path: '/inventory/loans', icon: Handshake },
        { label: 'Alertas', path: '/inventory/alerts', icon: TriangleAlert },
        { label: 'Reportes', path: '/inventory/reports', icon: ChartNoAxesCombined },
      ],
    }],
  },
  { label: 'Información', items: [{ label: 'Bitácora', path: '/admin/audit-logs', capability: 'adm.audit.read', icon: FileClock }] },
  { label: 'Cuenta', items: [{ label: 'Mi perfil', path: '/profile', capability: 'usr.profile.read', icon: UserRound }] },
]

function isVisible(item: ErpNavigationItem, role: string | null | undefined): boolean {
  return item.capability === undefined || hasAuthenticatedSessionCapability(item.capability) || hasCapability(role, item.capability)
}

export function getErpNavigation(role: string | null | undefined): ErpNavigationSection[] {
  return navigation.flatMap((section) => {
    const items = section.items.flatMap((item) => {
      if (!isVisible(item, role)) return []
      return [{ ...item, children: item.children?.filter((child) => isVisible(child, role)) }]
    })
    return items.length > 0 ? [{ ...section, items }] : []
  })
}
