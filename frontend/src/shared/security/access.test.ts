import { describe, expect, it } from 'vitest'
import {
  ACCESS_CAPABILITIES,
  ACCESS_ROLE_CAPABILITIES,
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
      'adm.justifications.read',
      'abs.justifications.read',
      'aud.logs.read',
      'inv.inventory.read',
      'pub.events.manage',
      'pub.events.publish',
      'res.reservations.read',
      'res.reservations.approve',
      'res.reservations.reject',
      'res.reservations.cancel',
      'fin.charges.read',
      'fin.payments.record',
      'fin.movements.read',
      'fin.movements.create',
      'don.donations.read',
      'don.donations.create',
      'don.donations.update',
      'don.donations.cancel',
      'don.donations.delete',
    ])
    expect(ACCESS_ROLE_CAPABILITIES.Administrador).toEqual(ACCESS_CAPABILITIES)
    expect(hasCapability('Administrador', 'adm.requests.read')).toBe(true)
    expect(hasCapability('Administrador', 'aud.logs.read')).toBe(true)
    expect(hasCapability('Administrador', 'pub.events.publish')).toBe(true)
    expect(hasCapability('Administrador', 'res.reservations.cancel')).toBe(true)
    expect(hasCapability('Administrador', 'fin.payments.record')).toBe(true)
    expect(hasCapability('Administrador', 'fin.movements.create')).toBe(true)
    expect(hasCapability('Administrador', 'don.donations.delete')).toBe(true)
  })

  it('grants financial capabilities to the treasurer', () => {
    expect(ACCESS_ROLE_CAPABILITIES.Tesorero).toEqual([
      'fin.charges.read',
      'fin.payments.record',
      'fin.movements.read',
      'fin.movements.create',
      'don.donations.read',
      'don.donations.create',
      'don.donations.update',
      'don.donations.cancel',
    ])
    expect(hasCapability('Tesorero', 'fin.charges.read')).toBe(true)
    expect(hasCapability('Tesorero', 'fin.payments.record')).toBe(true)
    expect(hasCapability('Tesorero', 'fin.movements.read')).toBe(true)
    expect(hasCapability('Tesorero', 'fin.movements.create')).toBe(true)
    expect(hasCapability('Tesorero', 'don.donations.read')).toBe(true)
    expect(hasCapability('Tesorero', 'don.donations.create')).toBe(true)
    expect(hasCapability('Tesorero', 'don.donations.update')).toBe(true)
    expect(hasCapability('Tesorero', 'don.donations.cancel')).toBe(true)
    expect(hasCapability('Tesorero', 'don.donations.delete')).toBe(false)
    expect(hasCapability('Tesorero', 'usr.users.read')).toBe(false)
    expect(hasCapability('Tesorero', 'res.reservations.read')).toBe(false)
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
    expect(hasCapability('Gestor de Inventario', 'fin.charges.read')).toBe(false)
    expect(hasCapability('Gestor de Inventario', 'fin.movements.read')).toBe(false)
    expect(hasCapability('Vecino/Afiliado', 'fin.movements.create')).toBe(false)
    expect(hasCapability('Tesorero', 'adm.affiliates.read')).toBe(false)
    expect(hasCapability(null, 'usr.profile.read')).toBe(false)
  })

  it('denies unknown roles and capabilities', () => {
    expect(hasCapability('Secretaría', 'adm.affiliates.read')).toBe(false)
    expect(hasCapability('Administrador', 'usr.users.create')).toBe(false)
    expect(hasCapability('Administrador', 'adm.audit.read')).toBe(false)
    expect(hasCapability('Administrador', '')).toBe(false)
  })

})
