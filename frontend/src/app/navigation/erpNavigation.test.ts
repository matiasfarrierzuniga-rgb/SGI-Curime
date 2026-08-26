import { describe, expect, it } from 'vitest'
import { getErpNavigation } from './erpNavigation'

function labels(role: string | null | undefined) {
  return getErpNavigation(role).map((item) => ({ label: item.label, children: item.children?.map((child) => child.label) }))
}

describe('getErpNavigation', () => {
  it('shows all Sprint 1 navigation for administrators', () => {
    expect(labels('Administrador')).toEqual([
      { label: 'Inicio', children: undefined },
      { label: 'Mi perfil', children: undefined },
      { label: 'Usuarios', children: ['Usuarios', 'Roles'] },
      { label: 'Administrativo', children: ['Afiliados', 'Solicitudes'] },
    ])
  })

  it('hides privileged items when an authenticated basic user lacks their capabilities', () => {
    expect(labels('Vecino/Afiliado')).toEqual([
      { label: 'Inicio', children: undefined },
      { label: 'Mi perfil', children: undefined },
    ])
  })

  it('denies privileged navigation to an unknown role', () => {
    expect(labels('Rol desconocido')).toEqual([
      { label: 'Inicio', children: undefined },
      { label: 'Mi perfil', children: undefined },
    ])
  })

  it('hides groups when none of their capability-gated children are visible', () => {
    const basicNavigation = getErpNavigation('Vecino/Afiliado')
    expect(basicNavigation.some((item) => item.children?.length === 0)).toBe(false)
    expect(basicNavigation.map((item) => item.label)).not.toContain('Usuarios')
    expect(basicNavigation.map((item) => item.label)).not.toContain('Administrativo')
  })
})
