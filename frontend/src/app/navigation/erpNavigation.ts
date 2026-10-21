import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarDays,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ClipboardList,
  FileCheck2,
  FileClock,
  FileText,
  HandCoins,
  Handshake,
  HeartHandshake,
  Home,
  Package,
  Tags,
  TriangleAlert,
  UserRound,
  Users,
  UserRoundCog,
  Wallet,
} from 'lucide-react'
import { hasCapability, type AccessCapability } from '@/shared/security/access'

export type ErpNavigationItem = {
  label: string
  path?: string
  capability?: AccessCapability
  icon?: LucideIcon
  children?: readonly ErpNavigationItem[]
}

export type ErpNavigationSection = { label: string; items: readonly ErpNavigationItem[] }

const navigation: readonly ErpNavigationSection[] = [
  {
    label: 'Panel principal',
    items: [
      {
        label: 'Inicio',
        path: '/app/dashboard',
        capability: 'erp.dashboard.read',
        icon: Home,
      },
    ],
  },
  {
    label: 'Gobierno institucional',
    items: [
      {
        label: 'Perfil institucional',
        path: '/app/admin/institutional-profile',
        capability: 'adm.institutional-profile.read',
        icon: Building2,
      },
      {
        label: 'Junta Directiva',
        path: '/app/admin/institutional-board',
        capability: 'adm.institutional-board.read',
        icon: UserRoundCog,
      },
      {
        label: 'Asambleas',
        path: '/app/admin/assemblies',
        capability: 'adm.assemblies.read',
        icon: CalendarCheck,
      },
      {
        label: 'Mis asambleas',
        path: '/app/assemblies/mine',
        icon: CalendarCheck,
      },
    ],
  },
  {
    label: 'Personas y afiliación',
    items: [
      {
        label: 'Usuarios',
        path: '/admin/users',
        capability: 'usr.users.read',
        icon: Users,
      },
      {
        label: 'Afiliados',
        path: '/app/admin/affiliates',
        capability: 'adm.affiliates.read',
        icon: Handshake,
      },
      {
        label: 'Solicitudes de afiliación',
        path: '/app/admin/requests',
        capability: 'adm.requests.read',
        icon: ClipboardList,
      },
      {
        label: 'Solicitudes de registro',
        path: '/admin/user-requests',
        capability: 'usr.user-requests.read',
        icon: ClipboardList,
      },
      {
        label: 'Justificaciones de ausencia',
        path: '/app/admin/absence-justifications',
        capability: 'adm.justifications.read',
        icon: FileCheck2,
      },
    ],
  },
  {
    label: 'Desarrollo comunitario',
    items: [
      {
        label: 'Eventos',
        path: '/app/events',
        capability: 'pub.events.manage',
        icon: CalendarDays,
      },
      {
        label: 'Emprendimientos',
        path: '/app/admin/ventures/summary',
        capability: 'ent.ventures.read',
        icon: BriefcaseBusiness,
        children: [
          { label: 'Resumen', path: '/app/admin/ventures/summary', capability: 'ent.ventures.read', icon: ChartNoAxesCombined },
          { label: 'Directorio', path: '/app/admin/ventures', capability: 'ent.ventures.read', icon: BriefcaseBusiness },
        ],
      },
      {
        label: 'Voluntariado',
        path: '/app/admin/volunteering',
        capability: 'vol.opportunities.read',
        icon: HeartHandshake,
      },
    ],
  },
  {
    label: 'Recursos y operaciones',
    items: [
      {
        label: 'Reservas',
        path: '/app/reservations',
        capability: 'res.reservations.read',
        icon: CalendarCheck,
      },
      {
        label: 'Inventario',
        path: '/inventory',
        capability: 'inv.inventory.read',
        icon: Boxes,
        children: [
          { label: 'Resumen', path: '/inventory', icon: Boxes },
          { label: 'Artículos', path: '/inventory/items', icon: Package },
          { label: 'Categorías', path: '/inventory/categories', icon: Tags },
          { label: 'Movimientos', path: '/inventory/movements', icon: ArrowLeftRight },
          { label: 'Préstamos', path: '/inventory/loans', icon: Handshake },
          { label: 'Alertas', path: '/inventory/alerts', icon: TriangleAlert },
          { label: 'Reportes', path: '/inventory/reports', icon: ChartNoAxesCombined },
        ],
      },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      {
        label: 'Finanzas',
        path: '/app/financial',
        icon: Wallet,
        children: [
          { label: 'Resumen', path: '/app/financial', capability: 'fin.charges.read', icon: Wallet },
          { label: 'Movimientos financieros', path: '/app/financial/movements', capability: 'fin.movements.read', icon: HandCoins },
          { label: 'DINADECO', path: '/app/financial/dinadeco', capability: 'fin.dinadeco.read', icon: FileText },
        ],
      },
      {
        label: 'Donaciones',
        path: '/app/donations',
        capability: 'don.donations.read',
        icon: HeartHandshake,
      },
    ],
  },
  {
    label: 'Seguridad y auditoría',
    items: [
      {
        label: 'Bitácora',
        path: '/admin/audit-logs',
        capability: 'aud.logs.read',
        icon: FileClock,
      },
    ],
  },
  {
    label: 'Mi espacio',
    items: [
      {
        label: 'Mi perfil',
        path: '/app/profile',
        icon: UserRound,
      },
      {
        label: 'Enviar justificación',
        path: '/app/affiliate/absence-justifications/new',
        icon: FileCheck2,
      },
      {
        label: 'Mis justificaciones',
        path: '/app/affiliate/justifications',
        icon: FileCheck2,
      },
    ],
  },
]

function isVisible(item: ErpNavigationItem, permissionCodes: readonly string[] | null | undefined): boolean {
  return item.capability === undefined || hasCapability(permissionCodes, item.capability)
}

export function getErpNavigation(permissionCodes: readonly string[] | null | undefined): ErpNavigationSection[] {
  return navigation.flatMap((section) => {
    const items = section.items.flatMap((item) => {
      const children = item.children?.filter((child) => isVisible(child, permissionCodes))
      if (!isVisible(item, permissionCodes) || (item.children !== undefined && children?.length === 0)) return []

      return [
        {
          ...item,
          path: children && children.length > 0 ? children[0].path : item.path,
          children,
        },
      ]
    })

    return items.length > 0 ? [{ ...section, items }] : []
  })
}

export function getErpEntryPath(permissionCodes: readonly string[] | null | undefined): string {
  if (hasCapability(permissionCodes, 'erp.dashboard.read')) return '/app/dashboard'
  if (hasCapability(permissionCodes, 'fin.charges.read')) return '/app/financial'
  if (hasCapability(permissionCodes, 'inv.inventory.read')) return '/inventory'

  for (const section of getErpNavigation(permissionCodes)) {
    for (const item of section.items) {
      if (item.capability && item.path) return item.path
      const authorizedChild = item.children?.find((child) => child.capability && child.path)
      if (authorizedChild?.path) return authorizedChild.path
    }
  }

  return '/app/profile'
}
