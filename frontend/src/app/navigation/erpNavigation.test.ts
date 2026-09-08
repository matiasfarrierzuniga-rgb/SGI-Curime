import { describe, expect, it } from 'vitest'
import { getErpNavigation } from './erpNavigation'

function labels(role: string | null | undefined) {
  return getErpNavigation(role).map((section) => ({ label: section.label, items: section.items.map((item) => ({ label: item.label, children: item.children?.map((child) => child.label) })) }))
}

describe('getErpNavigation', () => {
  it('shows implemented administrative areas to administrators', () => {
    expect(labels('Administrador')).toEqual([
      { label: 'General', items: [{ label: 'Dashboard', children: undefined }] },
      { label: 'Gestión administrativa', items: [{ label: 'Usuarios', children: undefined }, { label: 'Afiliados', children: undefined }, { label: 'Solicitudes de afiliación', children: undefined }, { label: 'Eventos', children: undefined }, { label: 'Reservas', children: undefined }, { label: 'Financiero', children: undefined }] },
      { label: 'Operación', items: [{ label: 'Solicitar reserva', children: undefined }, { label: 'Inventario', children: ['Resumen', 'Artículos', 'Categorías', 'Movimientos', 'Préstamos', 'Alertas', 'Reportes'] }] },
      { label: 'Información', items: [{ label: 'Bitácora', children: undefined }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
  })

  it('limits inventory managers to dashboard, inventory, and profile', () => {
    const result = labels('Gestor de Inventario')
    expect(result).toEqual([
      { label: 'General', items: [{ label: 'Dashboard', children: undefined }] },
      { label: 'Operación', items: [{ label: 'Solicitar reserva', children: undefined }, { label: 'Inventario', children: ['Resumen', 'Artículos', 'Categorías', 'Movimientos', 'Préstamos', 'Alertas', 'Reportes'] }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
    expect(JSON.stringify(result)).not.toMatch(/Usuarios|Afiliados|Solicitudes de afiliación|Reservas|Financiero|Bitácora/)
  })

  it('shows the financial area to treasurers and hides admin-only areas', () => {
    const result = labels('Tesorero')
    expect(result).toEqual([
      { label: 'General', items: [{ label: 'Dashboard', children: undefined }] },
      { label: 'Gestión administrativa', items: [{ label: 'Financiero', children: undefined }] },
      { label: 'Operación', items: [{ label: 'Solicitar reserva', children: undefined }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
    expect(JSON.stringify(result)).not.toMatch(/Usuarios|Afiliados|Solicitudes de afiliación|Eventos|Reservas|Inventario|Bitácora/)
  })

  it('shows session-wide navigation and reservation requests to other authenticated roles', () => {
    expect(labels('Vecino/Afiliado')).toEqual([
      { label: 'General', items: [{ label: 'Dashboard', children: undefined }] },
      { label: 'Operación', items: [{ label: 'Solicitar reserva', children: undefined }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
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

  it('assigns reservations navigation to its read capability', () => {
    const reservations = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Reservas')

    expect(reservations).toMatchObject({ path: '/app/reservations', capability: 'res.reservations.read' })
  })

  it('exposes reservation requests independently from administrative reservations', () => {
    const requests = getErpNavigation('Vecino/Afiliado').flatMap((section) => section.items).find((item) => item.label === 'Solicitar reserva')
    const reservations = getErpNavigation('Vecino/Afiliado').flatMap((section) => section.items).find((item) => item.label === 'Reservas')

    expect(requests).toMatchObject({ path: '/app/reservations/new' })
    expect(requests?.capability).toBeUndefined()
    expect(reservations).toBeUndefined()
  })

  it('assigns financial navigation to its read capability', () => {
    const financial = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Financiero')

    expect(financial).toMatchObject({ path: '/app/financial', capability: 'fin.charges.read' })
  })
})
