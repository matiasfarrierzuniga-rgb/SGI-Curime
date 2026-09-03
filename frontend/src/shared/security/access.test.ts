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
      'erp.dashboard.read',
      'usr.users.read',
      'usr.roles.read',
      'usr.profile.read',
      'adm.affiliates.read',
      'adm.requests.read',
      'aud.logs.read',
      'inv.inventory.read',
      'pub.events.manage',
      'pub.events.publish',
    ])
    expect(ACCESS_ROLE_CAPABILITIES.Administrador).toEqual(ACCESS_CAPABILITIES)
    expect(hasCapability('Administrador', 'adm.requests.read')).toBe(true)
    expect(hasCapability('Administrador', 'aud.logs.read')).toBe(true)
    expect(hasCapability('Administrador', 'pub.events.publish')).toBe(true)
  })

  it('grants capabilities to role objects by name', () => {
    expect(
      hasCapability(
        { name: 'Administrador' },
        'usr.users.read',
      ),
    ).toBe(true)
    expect(
      hasCapability(
        { name: 'Gestor de Inventario' },
        'inv.inventory.read',
      ),
    ).toBe(true)
  })

  it('denies capabilities for unknown role objects (default deny)', () => {
    expect(
      hasCapability(
        { name: 'Secretaría' },
        'adm.affiliates.read',
      ),
    ).toBe(false)
    expect(
      hasCapability(
        { name: 'Gestor de Inventario' },
        'usr.users.read',
      ),
    ).toBe(false)
    expect(hasCapability({}, 'usr.profile.read')).toBe(false)
    expect(hasCapability({ name: null }, 'usr.profile.read')).toBe(false)
  })

  it('denies known capabilities not granted to a role', () => {
    expect(hasCapability('Gestor de Inventario', 'usr.users.read')).toBe(false)
    expect(hasCapability(null, 'usr.profile.read')).toBe(false)
  })

  it('denies unknown roles and capabilities', () => {
    expect(hasCapability('Secretaría', 'adm.affiliates.read')).toBe(false)
    expect(hasCapability('Administrador', 'usr.users.create')).toBe(false)
    expect(hasCapability('Administrador', 'adm.audit.read')).toBe(false)
    expect(hasCapability('Administrador', '')).toBe(false)
  })

  it('grants profile and dashboard access to authenticated sessions', () => {
    expect(hasAuthenticatedSessionCapability('usr.profile.read')).toBe(true)
    expect(hasAuthenticatedSessionCapability('erp.dashboard.read')).toBe(true)
    expect(hasAuthenticatedSessionCapability('adm.affiliates.read')).toBe(false)
  })
})
