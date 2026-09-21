import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
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
  Wallet,
} from 'lucide-react'
import { hasCapability, type AccessCapability } from '@/shared/security/access'

export type ErpNavigationItem = {
  label: string
  path?: string
  capability?: AccessCapability
  icon?: LucideIcon
  children?: readonly ErpNavigationItem[]
  role?: string
  excludedRole?: string
}

export type ErpNavigationSection = { label: string; items: readonly ErpNavigationItem[] }

const navigation: readonly ErpNavigationSection[] = [
  {
    label: 'General',
    items: [
      {
        label: 'Inicio',
        path: '/app',
        icon: Home,
      },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      {
        label: 'Solicitar una reserva',
        path: '/servicios/reservas',
        role: 'Vecino/Afiliado',
        icon: CalendarPlus,
      },
      {
        label: 'Afiliación',
        path: '/afiliacion',
        role: 'Vecino/Afiliado',
        icon: Handshake,
      },
      {
        label: 'Eventos',
        path: '/eventos',
        role: 'Vecino/Afiliado',
        icon: CalendarDays,
      },
      {
        label: 'Mis asambleas',
        path: '/app/assemblies/mine',
        excludedRole: 'Administrador',
        icon: CalendarCheck,
      },
    ],
  },
  {
    label: 'Gestión administrativa',
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
        label: 'Justificaciones de ausencia',
        path: '/app/admin/absence-justifications',
        capability: 'adm.justifications.read',
        icon: FileCheck2,
      },
      {
        label: 'Asambleas',
        path: '/app/admin/assemblies',
        capability: 'adm.assemblies.read',
        icon: CalendarCheck,
      },
      {
        label: 'Perfil institucional',
        path: '/app/admin/institutional-profile',
        capability: 'adm.institutional-profile.read',
        icon: Building2,
      },
      {
        label: 'Eventos',
        path: '/app/events',
        capability: 'pub.events.manage',
        icon: CalendarDays,
      },
    ],
  },
  {
    label: 'Operación',
    items: [
      {
        label: 'Solicitar una reserva',
        path: '/servicios/reservas',
        excludedRole: 'Vecino/Afiliado',
        icon: CalendarPlus,
      },
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
    label: 'Gestión financiera',
    items: [
      {
        label: 'Finanzas',
        path: '/app/financial',
        capability: 'fin.charges.read',
        icon: Wallet,
      },
      {
        label: 'Movimientos financieros',
        path: '/app/financial/movements',
        capability: 'fin.movements.read',
        icon: HandCoins,
      },
      {
        label: 'DINADECO',
        path: '/app/financial/dinadeco',
        capability: 'fin.dinadeco.read',
        icon: FileText,
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
    label: 'Información',
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
    label: 'Cuenta',
    items: [
      {
        label: 'Mi perfil',
        path: '/profile',
        icon: UserRound,
      },
      {
        label: 'Enviar justificación',
        path: '/app/affiliate/absence-justifications/new',
        role: 'Vecino/Afiliado',
        icon: FileCheck2,
      },
      {
        label: 'Mis justificaciones',
        path: '/app/affiliate/justifications',
        role: 'Vecino/Afiliado',
        icon: FileCheck2,
      },
    ],
  },
]

function isVisible(item: ErpNavigationItem, role: string | null | undefined): boolean {
  return (
    (item.role === undefined || item.role === role) &&
    item.excludedRole !== role &&
    (item.capability === undefined || hasCapability(role, item.capability))
  )
}

export function getErpNavigation(role: string | null | undefined): ErpNavigationSection[] {
  return navigation.flatMap((section) => {
    const items = section.items.flatMap((item) => {
      if (!isVisible(item, role)) return []

      return [
        {
          ...item,
          children: item.children?.filter((child) => isVisible(child, role)),
        },
      ]
    })

    return items.length > 0 ? [{ ...section, items }] : []
  })
}
