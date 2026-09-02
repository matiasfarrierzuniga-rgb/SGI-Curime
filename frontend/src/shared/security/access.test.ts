import { describe, expect, it } from 'vitest'
import {
  ACCESS_CAPABILITIES,
  ACCESS_ROLE_CAPABILITIES,
  hasAuthenticatedSessionCapability,
  hasCapability,
  hasManagementCapabilities,
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
    ])
    expect(ACCESS_ROLE_CAPABILITIES.Administrador).toEqual(ACCESS_CAPABILITIES)
    expect(hasCapability('Administrador', 'adm.requests.read')).toBe(true)
    expect(hasCapability('Administrador', 'aud.logs.read')).toBe(true)
  })

  it('denies known capabilities not granted to a role', () => {
    expect(hasCapability('Gestor de Inventario', 'usr.users.read')).toBe(false)
    expect(hasCapability(null, 'usr.profile.read')).toBe(false)
  })

  it('gives Usuario and legacy Vecino/Afiliado only profile access', () => {
    expect(ACCESS_ROLE_CAPABILITIES.Usuario).toEqual(['usr.profile.read'])
    expect(ACCESS_ROLE_CAPABILITIES['Vecino/Afiliado']).toEqual(['usr.profile.read'])
    expect(hasCapability('Usuario', 'erp.dashboard.read')).toBe(false)
    expect(hasCapability('Vecino/Afiliado', 'inv.inventory.read')).toBe(false)
  })

  it('does not invent operational capabilities for Tesorero', () => {
    expect(ACCESS_ROLE_CAPABILITIES.Tesorero).toEqual(['usr.profile.read'])
  })

  it('derives ERP access from management capabilities', () => {
    expect(hasManagementCapabilities('Administrador')).toBe(true)
    expect(hasManagementCapabilities('Gestor de Inventario')).toBe(true)
    expect(hasManagementCapabilities('Tesorero')).toBe(false)
    expect(hasManagementCapabilities('Usuario')).toBe(false)
    expect(hasManagementCapabilities('Vecino/Afiliado')).toBe(false)
    expect(hasManagementCapabilities('Rol desconocido')).toBe(false)
  })

  it('denies unknown roles and capabilities', () => {
    expect(hasCapability('Secretaría', 'adm.affiliates.read')).toBe(false)
    expect(hasCapability('Administrador', 'usr.users.create')).toBe(false)
    expect(hasCapability('Administrador', 'adm.audit.read')).toBe(false)
    expect(hasCapability('Administrador', '')).toBe(false)
  })

  it('only identifies profile as a universal authenticated-session capability', () => {
    expect(hasAuthenticatedSessionCapability('usr.profile.read')).toBe(true)
    expect(hasAuthenticatedSessionCapability('erp.dashboard.read')).toBe(false)
    expect(hasAuthenticatedSessionCapability('adm.affiliates.read')).toBe(false)
  })
})
