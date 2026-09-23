import { describe, expect, it } from 'vitest'
import { getErpNavigation } from './erpNavigation'

function labels(role: string | null | undefined) {
  return getErpNavigation(role).map((section) => ({ label: section.label, items: section.items.map((item) => ({ label: item.label, children: item.children?.map((child) => child.label) })) }))
}

describe('getErpNavigation', () => {
  it('shows implemented administrative areas to administrators', () => {
    expect(labels('Administrador')).toEqual([
      { label: 'General', items: [{ label: 'Inicio', children: undefined }] },

      { label: 'Gestión administrativa', items: [
  { label: 'Usuarios', children: undefined },
  { label: 'Afiliados', children: undefined },
  { label: 'Solicitudes de afiliación', children: undefined },
  { label: 'Justificaciones de ausencia', children: undefined },
  { label: 'Asambleas', children: undefined },
  { label: 'Perfil institucional', children: undefined },
  { label: 'Junta Directiva', children: undefined },
  { label: 'Eventos', children: undefined }
] },

      { label: 'Operación', items: [{ label: 'Solicitar una reserva', children: undefined }, { label: 'Reservas', children: undefined }, { label: 'Inventario', children: ['Resumen', 'Artículos', 'Categorías', 'Movimientos', 'Préstamos', 'Alertas', 'Reportes'] }] },
      { label: 'Gestión financiera', items: [{ label: 'Finanzas', children: undefined }, { label: 'Movimientos financieros', children: undefined }, { label: 'DINADECO', children: undefined }, { label: 'Donaciones', children: undefined }] },
      { label: 'Información', items: [{ label: 'Bitácora', children: undefined }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
  })

  it('limits inventory managers to dashboard, inventory, and profile', () => {
    const result = labels('Gestor de Inventario')
    expect(result).toEqual([
      { label: 'General', items: [{ label: 'Inicio', children: undefined }] },
      { label: 'Comunidad', items: [{ label: 'Mis asambleas', children: undefined }] },
      { label: 'Operación', items: [{ label: 'Solicitar una reserva', children: undefined }, { label: 'Inventario', children: ['Resumen', 'Artículos', 'Categorías', 'Movimientos', 'Préstamos', 'Alertas', 'Reportes'] }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
    expect(JSON.stringify(result)).not.toMatch(/Usuarios|Afiliados|Solicitudes de afiliación|Reservas|Finanzas|DINADECO|Bitácora/)
  })

  it('shows the financial area to treasurers and hides admin-only areas', () => {
    const result = labels('Tesorero')
    expect(result).toEqual([
      { label: 'General', items: [{ label: 'Inicio', children: undefined }] },
      { label: 'Comunidad', items: [{ label: 'Mis asambleas', children: undefined }] },
      { label: 'Operación', items: [{ label: 'Solicitar una reserva', children: undefined }] },
      { label: 'Gestión financiera', items: [{ label: 'Finanzas', children: undefined }, { label: 'Movimientos financieros', children: undefined }, { label: 'DINADECO', children: undefined }, { label: 'Donaciones', children: undefined }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }] },
    ])
    expect(JSON.stringify(result)).not.toMatch(/Usuarios|Afiliados|Solicitudes de afiliación|Eventos|Reservas|Inventario|Bitácora/)
  })

  it('shows session-wide navigation and reservation requests to other authenticated roles', () => {
    expect(labels('Vecino/Afiliado')).toEqual([
      { label: 'General', items: [{ label: 'Inicio', children: undefined }] },
      { label: 'Comunidad', items: [{ label: 'Solicitar una reserva', children: undefined }, { label: 'Afiliación', children: undefined }, { label: 'Eventos', children: undefined }, { label: 'Mis asambleas', children: undefined }] },
      { label: 'Cuenta', items: [{ label: 'Mi perfil', children: undefined }, { label: 'Enviar justificación', children: undefined }, { label: 'Mis justificaciones', children: undefined }] },
    ])
  })

  it('keeps public community links out of internal-role navigation', () => {
    for (const role of ['Administrador', 'Tesorero', 'Gestor de Inventario']) {
      const communityLabels = getErpNavigation(role)
        .find((section) => section.label === 'Comunidad')
        ?.items.map((item) => item.label) ?? []

      expect(communityLabels).not.toEqual(expect.arrayContaining(['Afiliación', 'Eventos']))
    }
  })

  it('assigns affiliate navigation to the affiliate read capability', () => {
    const affiliates = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Afiliados')

    expect(affiliates).toMatchObject({ path: '/app/admin/affiliates', capability: 'adm.affiliates.read' })
  })

  it('assigns affiliate requests navigation to its canonical route and capability', () => {
    const requests = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Solicitudes de afiliación')

    expect(requests).toMatchObject({ path: '/app/admin/requests', capability: 'adm.requests.read' })
  })

  it('shows institutional profile navigation only to Administrador', () => {
    const findProfile = (role: string) => getErpNavigation(role).flatMap(section => section.items).find(item => item.label === 'Perfil institucional')
    expect(findProfile('Administrador')).toMatchObject({ path: '/app/admin/institutional-profile', capability: 'adm.institutional-profile.read' })
    for (const role of ['Tesorero', 'Gestor de Inventario', 'Vecino/Afiliado', 'Subscription_L1']) expect(findProfile(role)).toBeUndefined()
  })

  it('shows Junta Directiva only to Administrador with its dedicated capability', () => {
    const findBoard = (role: string) => getErpNavigation(role).flatMap(section => section.items).find(item => item.label === 'Junta Directiva')
    expect(findBoard('Administrador')).toMatchObject({ path: '/app/admin/institutional-board', capability: 'adm.institutional-board.read' })
    for (const role of ['Tesorero', 'Gestor de Inventario', 'Vecino/Afiliado']) expect(findBoard(role)).toBeUndefined()
  })

  it('assigns event navigation to its management capability', () => {
    const events = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Eventos')

    expect(events).toMatchObject({ path: '/app/events', capability: 'pub.events.manage' })
  })

  it('assigns reservations navigation to its read capability', () => {
    const reservations = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Reservas')

    expect(reservations).toMatchObject({ path: '/app/reservations', capability: 'res.reservations.read' })
  })

  it('assigns donations navigation to its read capability and canonical route', () => {
    const donations = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Donaciones')

    expect(donations).toMatchObject({ path: '/app/donations', capability: 'don.donations.read' })
    expect(getErpNavigation('Vecino/Afiliado').flatMap((section) => section.items).find((item) => item.label === 'Donaciones')).toBeUndefined()
  })

  it('exposes reservation requests independently from administrative reservations', () => {
    const requests = getErpNavigation('Vecino/Afiliado').flatMap((section) => section.items).find((item) => item.label === 'Solicitar una reserva')
    const reservations = getErpNavigation('Vecino/Afiliado').flatMap((section) => section.items).find((item) => item.label === 'Reservas')

    expect(requests).toMatchObject({ path: '/servicios/reservas' })
    expect(requests?.capability).toBeUndefined()
    expect(reservations).toBeUndefined()
  })

  it('assigns financial navigation to its read capability', () => {
    const financial = getErpNavigation('Administrador').flatMap((section) => section.items).find((item) => item.label === 'Finanzas')

    expect(financial).toMatchObject({ path: '/app/financial', capability: 'fin.charges.read' })
  })

  it('shows DINADECO only with its dedicated capability roles', () => {
    const findDinadeco = (role: string) => getErpNavigation(role).flatMap((section) => section.items).find((item) => item.label === 'DINADECO')
    expect(findDinadeco('Administrador')).toMatchObject({ path: '/app/financial/dinadeco', capability: 'fin.dinadeco.read' })
    expect(findDinadeco('Tesorero')).toBeDefined()
    expect(findDinadeco('Gestor de Inventario')).toBeUndefined()
    expect(findDinadeco('Vecino/Afiliado')).toBeUndefined()
  })

  it('assigns financial movements navigation to its read capability', () => {
    const movements = getErpNavigation('Tesorero').flatMap((section) => section.items).find((item) => item.label === 'Movimientos financieros')

    expect(movements).toMatchObject({ path: '/app/financial/movements', capability: 'fin.movements.read' })
    expect(getErpNavigation('Gestor de Inventario').flatMap((section) => section.items).find((item) => item.label === 'Movimientos financieros')).toBeUndefined()
  })
})
