import { describe, expect, it } from 'vitest'
import {
  ACCESS_CAPABILITIES,
  ACCESS_ROLE_CAPABILITIES,
  hasAuthenticatedSessionCapability,
  hasCapability,
} from './access'

describe('shared security access policy', () => {
  it('grants all accepted capabilities to Administrador', () => {
    expect(ACCESS_CAPABILITIES).toEqual([
      'usr.users.read',
      'usr.roles.read',
      'usr.profile.read',
      'adm.affiliates.read',
      'adm.requests.read',
      'aud.logs.read',
    ])
    expect(ACCESS_ROLE_CAPABILITIES.Administrador).toEqual(ACCESS_CAPABILITIES)
    expect(hasCapability('Administrador', 'adm.requests.read')).toBe(true)
    expect(hasCapability('Administrador', 'aud.logs.read')).toBe(true)
  })

  it('denies known capabilities not granted to a role', () => {
    expect(hasCapability('Gestor de Inventario', 'usr.users.read')).toBe(false)
    expect(hasCapability('Gestor de Inventario', 'aud.logs.read')).toBe(false)
    expect(hasCapability('Usuario básico', 'aud.logs.read')).toBe(false)
    expect(hasCapability(null, 'usr.profile.read')).toBe(false)
    expect(hasCapability(null, 'aud.logs.read')).toBe(false)
  })

  it('denies unknown roles and capabilities', () => {
    expect(hasCapability('Secretaría', 'adm.affiliates.read')).toBe(false)
    expect(hasCapability('Rol desconocido', 'aud.logs.read')).toBe(false)
    expect(hasCapability('Administrador', 'usr.users.create')).toBe(false)
    expect(hasCapability('Administrador', '')).toBe(false)
  })

  it('grants only profile access to authenticated sessions', () => {
    expect(hasAuthenticatedSessionCapability('usr.profile.read')).toBe(true)
    expect(hasAuthenticatedSessionCapability('adm.affiliates.read')).toBe(false)
    expect(hasAuthenticatedSessionCapability('aud.logs.read')).toBe(false)
  })
})
