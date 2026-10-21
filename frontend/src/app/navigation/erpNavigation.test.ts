import { describe, expect, it } from 'vitest'
import { getErpEntryPath, getErpNavigation } from './erpNavigation'

describe('getErpNavigation', () => {
  it('shows Inicio only with dashboard access and points it to the protected dashboard', () => {
    const items = (codes: string[]) => getErpNavigation(codes).flatMap(section => section.items)
    expect(items([]).find(item => item.label === 'Inicio')).toBeUndefined()
    expect(items(['erp.dashboard.read']).find(item => item.label === 'Inicio')).toMatchObject({ path: '/app/dashboard', capability: 'erp.dashboard.read' })
  })

  it('selects a capability-backed entry before the personal fallback', () => {
    expect(getErpEntryPath(['erp.dashboard.read'])).toBe('/app/dashboard')
    expect(getErpEntryPath(['fin.charges.read', 'erp.dashboard.read'])).toBe('/app/dashboard')
    expect(getErpEntryPath(['fin.charges.read'])).toBe('/app/financial')
    expect(getErpEntryPath(['inv.inventory.read'])).toBe('/inventory')
    expect(getErpEntryPath(['inv.inventory.read', 'fin.charges.read'])).toBe('/app/financial')
    expect(getErpEntryPath([])).toBe('/app/profile')
  })

  it('organizes ERP destinations into institutional sidebar sections', () => {
    const navigation = getErpNavigation([
      'erp.dashboard.read',
      'usr.users.read',
      'adm.affiliates.read',
      'adm.requests.read',
      'usr.user-requests.read',
      'adm.justifications.read',
      'adm.assemblies.read',
      'adm.institutional-profile.read',
      'adm.institutional-board.read',
      'pub.events.manage',
      'ent.ventures.read',
      'vol.opportunities.read',
      'res.reservations.read',
      'inv.inventory.read',
      'fin.charges.read',
      'fin.movements.read',
      'fin.dinadeco.read',
      'don.donations.read',
      'aud.logs.read',
    ])

    expect(navigation.map(section => section.label)).toEqual([
      'Panel principal',
      'Gobierno institucional',
      'Personas y afiliación',
      'Desarrollo comunitario',
      'Recursos y operaciones',
      'Finanzas',
      'Seguridad y auditoría',
      'Mi espacio',
    ])
    expect(navigation.map(section => [section.label, section.items.map(item => item.label)])).toEqual([
      ['Panel principal', ['Inicio']],
      ['Gobierno institucional', ['Perfil institucional', 'Junta Directiva', 'Asambleas', 'Mis asambleas']],
      ['Personas y afiliación', ['Usuarios', 'Afiliados', 'Solicitudes de afiliación', 'Solicitudes de registro', 'Justificaciones de ausencia']],
      ['Desarrollo comunitario', ['Eventos', 'Emprendimientos', 'Voluntariado']],
      ['Recursos y operaciones', ['Reservas', 'Inventario']],
      ['Finanzas', ['Finanzas', 'Donaciones']],
      ['Seguridad y auditoría', ['Bitácora']],
      ['Mi espacio', ['Mi perfil', 'Enviar justificación', 'Mis justificaciones']],
    ])
    expect(navigation.flatMap(section => section.items).flatMap(item => [item.path, ...(item.children?.map(child => child.path) ?? [])])).toEqual(expect.arrayContaining([
      '/app/dashboard',
      '/app/admin/institutional-profile',
      '/app/admin/institutional-board',
      '/app/admin/assemblies',
      '/app/assemblies/mine',
      '/admin/users',
      '/app/admin/affiliates',
      '/app/admin/requests',
      '/admin/user-requests',
      '/app/admin/absence-justifications',
      '/app/events',
      '/app/admin/ventures/summary',
      '/app/admin/ventures',
      '/app/admin/volunteering',
      '/app/reservations',
      '/inventory',
      '/inventory/items',
      '/inventory/categories',
      '/inventory/movements',
      '/inventory/loans',
      '/inventory/alerts',
      '/inventory/reports',
      '/app/financial',
      '/app/financial/movements',
      '/app/financial/dinadeco',
      '/app/donations',
      '/admin/audit-logs',
      '/app/profile',
      '/app/affiliate/absence-justifications/new',
      '/app/affiliate/justifications',
    ]))
  })

  it('uses delivered permission codes for capability-gated navigation', () => {
    const items = getErpNavigation(['adm.assemblies.read', 'adm.justifications.read', 'ent.ventures.read', 'vol.opportunities.read'])
      .flatMap(section => section.items)
    expect(items.find(item => item.label === 'Asambleas')).toMatchObject({ capability: 'adm.assemblies.read' })
    expect(items.find(item => item.label === 'Justificaciones de ausencia')).toMatchObject({ capability: 'adm.justifications.read' })
    expect(items.find(item => item.label === 'Usuarios')).toBeUndefined()
    expect(items.find(item => item.label === 'Emprendimientos')).toMatchObject({
      path: '/app/admin/ventures/summary',
      capability: 'ent.ventures.read',
      children: [
        expect.objectContaining({ label: 'Resumen', path: '/app/admin/ventures/summary', capability: 'ent.ventures.read' }),
        expect.objectContaining({ label: 'Directorio', path: '/app/admin/ventures', capability: 'ent.ventures.read' }),
      ],
    })
    expect(items.find(item => item.label === 'Voluntariado')).toMatchObject({ path: '/app/admin/volunteering', capability: 'vol.opportunities.read' })
  })

  it('does not use role names as authorization input', () => {
    expect(getErpNavigation('Administrador' as unknown as string[]).flatMap(section => section.items).find(item => item.label === 'Asambleas')).toBeUndefined()
  })

  it('keeps the account profile inside the ERP route context', () => {
    const profile = getErpNavigation([]).flatMap(section => section.items).find(item => item.label === 'Mi perfil')
    expect(profile).toMatchObject({ path: '/app/profile' })
  })

  it('keeps public routes out of ERP navigation while preserving administrative routes', () => {
    const items = getErpNavigation(['res.reservations.read', 'adm.affiliates.read', 'adm.requests.read', 'pub.events.manage'])
      .flatMap(section => section.items)
    expect(items.some(item => item.path === '/servicios/reservas' || item.path === '/afiliacion' || item.path === '/eventos')).toBe(false)
    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '/app/reservations' }),
      expect.objectContaining({ path: '/app/admin/affiliates' }),
      expect.objectContaining({ path: '/app/admin/requests' }),
      expect.objectContaining({ path: '/app/events' }),
    ]))
  })

  it('shows finance group only with delivered child capabilities', () => {
    const noFinance = getErpNavigation([]).flatMap(section => section.items)
    const finance = getErpNavigation(['fin.movements.read']).flatMap(section => section.items).find(item => item.label === 'Finanzas')
    expect(noFinance.find(item => item.label === 'Finanzas')).toBeUndefined()
    expect(finance).toMatchObject({ children: [expect.objectContaining({ path: '/app/financial/movements', capability: 'fin.movements.read' })] })
  })

  it('routes a finance parent to its first visible authorized child', () => {
    const movementOnly = getErpNavigation(['fin.movements.read']).flatMap(section => section.items).find(item => item.label === 'Finanzas')
    const dinadecoOnly = getErpNavigation(['fin.dinadeco.read']).flatMap(section => section.items).find(item => item.label === 'Finanzas')
    expect(movementOnly).toMatchObject({ path: '/app/financial/movements', children: [expect.objectContaining({ path: '/app/financial/movements' })] })
    expect(dinadecoOnly).toMatchObject({ path: '/app/financial/dinadeco', children: [expect.objectContaining({ path: '/app/financial/dinadeco' })] })
  })

  it('hides the entrepreneurship group and its destinations without venture read capability', () => {
    const items = getErpNavigation([]).flatMap(section => section.items)
    expect(items.find(item => item.label === 'Emprendimientos')).toBeUndefined()
    expect(items.flatMap(item => item.children ?? []).some(item => item.path === '/app/admin/ventures/summary' || item.path === '/app/admin/ventures')).toBe(false)
  })
})
