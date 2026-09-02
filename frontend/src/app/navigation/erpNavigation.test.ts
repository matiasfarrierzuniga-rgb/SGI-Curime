import { describe, expect, it } from 'vitest'
import { getErpNavigation } from './erpNavigation'

function labels(role: string | null | undefined) {
  return getErpNavigation(role).map((section) => ({ label: section.label, items: section.items.map((item) => ({ label: item.label, children: item.children?.map((child) => child.label) })) }))
}

describe('getErpNavigation', () => {
  it('shows implemented administrative areas to administrators', () => {
    expect(labels('Administrador')).toEqual([
      { label: 'General', items: [{ label: 'Dashboard', children: undefined }] },
      { label: 'Gestión administrativa', items: [{ label: 'Usuarios', children: undefined }, { label: 'Afiliados', children: undefined }, { label: 'Solicitudes de afiliación', children: undefined }, { label: 'Eventos', children: undefined }] },
      { label: 'Operación', items: [{ label: 'Inventario', children: ['Resumen', 'Artículos', 'Categorías', 'Movimientos', 'Préstamos', 'Alertas', 'Reportes'] }] },
      { label: 'Información', items: [{ label: 'Bitácora', children: undefined }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
  })

  it('limits inventory managers to dashboard, inventory, and profile', () => {
    const result = labels('Gestor de Inventario')
    expect(result).toEqual([
      { label: 'General', items: [{ label: 'Dashboard', children: undefined }] },
      { label: 'Operación', items: [{ label: 'Inventario', children: ['Resumen', 'Artículos', 'Categorías', 'Movimientos', 'Préstamos', 'Alertas', 'Reportes'] }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
    expect(JSON.stringify(result)).not.toMatch(/Usuarios|Afiliados|Solicitudes de afiliación|Bitácora/)
  })

  it('does not expose ERP dashboard navigation to personal roles', () => {
    expect(labels('Usuario')).toEqual([{ label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] }])
    expect(labels('Vecino/Afiliado')).toEqual([{ label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] }])
    expect(labels('Tesorero')).toEqual([{ label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] }])
    expect(labels('Rol desconocido')).toEqual([])
  })

  it('assigns affiliate navigation to the affiliate read capability', () => {
    const affiliates = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Afiliados')

    expect(affiliates).toMatchObject({ path: '/app/admin/affiliates', capability: 'adm.affiliates.read' })
  })

  it('assigns affiliate requests navigation to its canonical route and capability', () => {
    const requests = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Solicitudes de afiliación')

    expect(requests).toMatchObject({ path: '/app/admin/requests', capability: 'adm.requests.read' })
  })

  it('assigns event navigation to its management capability', () => {
    const events = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Eventos')

    expect(events).toMatchObject({ path: '/app/events', capability: 'pub.events.manage' })
  })
})
