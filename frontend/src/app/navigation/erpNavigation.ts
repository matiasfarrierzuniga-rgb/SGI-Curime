import {
  hasAuthenticatedSessionCapability,
  hasCapability,
  type AccessCapability,
} from '@/shared/security/access'

export type ErpNavigationItem = {
  label: string
  path: string
  capability?: AccessCapability
  children?: ErpNavigationItem[]
}

const navigation: readonly ErpNavigationItem[] = [
  { label: 'Inicio', path: '/app' },
  { label: 'Mi perfil', path: '/app/profile', capability: 'usr.profile.read' },
  {
    label: 'Usuarios',
    path: '/app/users',
    children: [
      { label: 'Usuarios', path: '/app/users', capability: 'usr.users.read' },
      { label: 'Roles', path: '/app/roles', capability: 'usr.roles.read' },
    ],
  },
  {
    label: 'Administrativo',
    path: '/app/admin/affiliates',
    children: [
      { label: 'Afiliados', path: '/app/admin/affiliates', capability: 'adm.affiliates.read' },
      { label: 'Solicitudes', path: '/app/admin/requests', capability: 'adm.requests.read' },
    ],
  },
  {
    label: 'Información',
    path: '/app/audit-logs',
    children: [
      { label: 'Bitácora', path: '/app/audit-logs', capability: 'aud.logs.read' },
    ],
  },
]

function isVisible(item: ErpNavigationItem, role: string | null | undefined): boolean {
  return item.capability === undefined ||
    hasAuthenticatedSessionCapability(item.capability) ||
    hasCapability(role, item.capability)
}

export function getErpNavigation(role: string | null | undefined): ErpNavigationItem[] {
  return navigation.flatMap((item) => {
    if (item.children) {
      const children = item.children.filter((child) => isVisible(child, role))
      return children.length > 0 ? [{ ...item, children }] : []
    }

    return isVisible(item, role) ? [item] : []
  })
}
