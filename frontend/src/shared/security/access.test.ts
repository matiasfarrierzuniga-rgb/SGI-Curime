import { describe, expect, it } from 'vitest'
import { hasCapability } from './access'

describe('permission-code access policy', () => {
  it('grants only codes delivered in session', () => {
    const codes = ['adm.assemblies.read', 'adm.justifications.approve']
    expect(hasCapability(codes, 'adm.assemblies.read')).toBe(true)
    expect(hasCapability(codes, 'adm.justifications.reject')).toBe(false)
  })

  it('never derives access from role names or arbitrary values', () => {
    expect(hasCapability('Administrador', 'adm.assemblies.manage')).toBe(false)
    expect(hasCapability({ name: 'Administrador' }, 'adm.assemblies.manage')).toBe(false)
    expect(hasCapability(null, 'adm.assemblies.manage')).toBe(false)
  })
})
