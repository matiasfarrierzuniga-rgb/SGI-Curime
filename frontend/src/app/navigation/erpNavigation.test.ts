import { describe, expect, it } from 'vitest'
import { getErpNavigation } from './erpNavigation'

describe('getErpNavigation', () => {
  it('uses delivered permission codes for capability-gated navigation', () => {
    const items = getErpNavigation(['adm.assemblies.read', 'adm.justifications.read'])
      .flatMap(section => section.items)
    expect(items.find(item => item.label === 'Asambleas')).toMatchObject({ capability: 'adm.assemblies.read' })
    expect(items.find(item => item.label === 'Justificaciones de ausencia')).toMatchObject({ capability: 'adm.justifications.read' })
    expect(items.find(item => item.label === 'Usuarios')).toBeUndefined()
  })

  it('does not use role names as authorization input', () => {
    expect(getErpNavigation('Administrador' as unknown as string[]).flatMap(section => section.items).find(item => item.label === 'Asambleas')).toBeUndefined()
  })
})
