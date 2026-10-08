import { describe, expect, it } from 'vitest'
import { getErpNavigation } from './erpNavigation'

describe('getErpNavigation', () => {
  it('uses delivered permission codes for capability-gated navigation', () => {
    const items = getErpNavigation(['adm.assemblies.read', 'adm.justifications.read', 'ent.ventures.read', 'vol.opportunities.read'])
      .flatMap(section => section.items)
    expect(items.find(item => item.label === 'Asambleas')).toMatchObject({ capability: 'adm.assemblies.read' })
    expect(items.find(item => item.label === 'Justificaciones de ausencia')).toMatchObject({ capability: 'adm.justifications.read' })
    expect(items.find(item => item.label === 'Usuarios')).toBeUndefined()
    expect(items.find(item => item.label === 'Emprendimientos')).toMatchObject({ path: '/app/admin/ventures', capability: 'ent.ventures.read' })
    expect(items.find(item => item.label === 'Voluntariado')).toMatchObject({ path: '/app/admin/volunteering', capability: 'vol.opportunities.read' })
  })

  it('does not use role names as authorization input', () => {
    expect(getErpNavigation('Administrador' as unknown as string[]).flatMap(section => section.items).find(item => item.label === 'Asambleas')).toBeUndefined()
  })

  it('keeps the account profile inside the ERP route context', () => {
    const profile = getErpNavigation([]).flatMap(section => section.items).find(item => item.label === 'Mi perfil')
    expect(profile).toMatchObject({ path: '/app/profile' })
  })

  it('hides affiliate justification navigation without a linked affiliate', () => {
    const items = getErpNavigation([], null).flatMap(section => section.items)

    expect(items.find(item => item.label === 'Enviar justificación')).toBeUndefined()
    expect(items.find(item => item.label === 'Mis justificaciones')).toBeUndefined()
    expect(items.find(item => item.label === 'Mi perfil')).toBeDefined()
  })

  it('shows affiliate justification navigation when an affiliate is linked', () => {
    const items = getErpNavigation([], '18').flatMap(section => section.items)

    expect(items.find(item => item.label === 'Enviar justificación')).toMatchObject({ path: '/app/affiliate/absence-justifications/new' })
    expect(items.find(item => item.label === 'Mis justificaciones')).toMatchObject({ path: '/app/affiliate/justifications' })
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
})
